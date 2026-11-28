"""LakeWatch Laguna API — public historical dataset, admin updates, audit trail.

Shared data is stored in PostgreSQL on Render; SQLite is permitted for local dev only.
There is NO automated LLDA/live-sensor feed.
"""
import copy
import json
import os
import re
import time
from collections import defaultdict, deque
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from urllib.parse import urlparse

import jwt
from argon2 import PasswordHasher, exceptions as argon_exc
from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator, model_validator
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, create_engine, select, func, inspect, text
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker
from dotenv import load_dotenv

load_dotenv(Path(__file__).parents[1] / ".env")

DATA_PATH = Path(__file__).parent / 'data' / 'stations.json'
BASE = json.loads(DATA_PATH.read_text(encoding='utf-8'))
STATIONS = {s['id'] for s in BASE['stations']}
PARAMETERS = {p['id'] for p in BASE['parameters']}
PARAM_UNITS = {p['id']: p['unit'] for p in BASE['parameters']}
BASE_VALUES = {
    (station['id'], sample['period'], param): str(value)
    for station in BASE['stations']
    for sample in station.get('samples', [])
    for param, value in sample['values'].items()
    if value is not None and value != ''
}
DB_URL = os.getenv('DATABASE_URL', '').strip()
if DB_URL.startswith('postgres://'):
    DB_URL = 'postgresql+psycopg://' + DB_URL.removeprefix('postgres://')
elif DB_URL.startswith('postgresql://'):
    DB_URL = 'postgresql+psycopg://' + DB_URL.removeprefix('postgresql://')
DEV = os.getenv('LAKEWATCH_DEV_MODE') == '1'
if not DB_URL:
    if not DEV:
        raise RuntimeError('DATABASE_URL required. For local SQLite only, set LAKEWATCH_DEV_MODE=1.')
    DB_URL = 'sqlite:///./lakewatch_dev.db'
connect_args = {'check_same_thread': False} if DB_URL.startswith('sqlite') else {}
engine = create_engine(DB_URL, pool_pre_ping=True, connect_args=connect_args)
SessionLocal = sessionmaker(engine, autoflush=False, expire_on_commit=False)
JWT_SECRET = os.getenv('JWT_SECRET', '').strip()
if len(JWT_SECRET) < 32 or JWT_SECRET.startswith('CHANGE_') or JWT_SECRET.startswith('GENERATE_'):
    raise RuntimeError('JWT_SECRET must contain at least 32 random characters (server environment only).')
JWT_ALGORITHM = 'HS256'
ph = PasswordHasher(time_cost=2, memory_cost=65536, parallelism=2)


class BaseModelSQL(DeclarativeBase):
    pass


class Admin(BaseModelSQL):
    __tablename__ = 'admins'
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(256))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class Observation(BaseModelSQL):
    __tablename__ = 'observation_overrides'
    __table_args__ = (UniqueConstraint('station_id', 'period', 'parameter', name='uq_reading'),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    station_id: Mapped[str] = mapped_column(String(12), index=True)
    period: Mapped[str] = mapped_column(String(7), index=True)
    parameter: Mapped[str] = mapped_column(String(32))
    value: Mapped[str] = mapped_column(String(32))
    source_url: Mapped[str] = mapped_column(Text, default='')
    source_kind: Mapped[str] = mapped_column(String(16), nullable=False, server_default='online')
    source_organization: Mapped[str] = mapped_column(String(160), nullable=False, server_default='')
    source_date: Mapped[str] = mapped_column(String(10), nullable=False, server_default='')
    source_reference: Mapped[str] = mapped_column(String(250), nullable=False, server_default='')
    title: Mapped[str] = mapped_column(String(160), default='')
    method: Mapped[str] = mapped_column(String(20))
    updated_by: Mapped[str] = mapped_column(String(255))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class Audit(BaseModelSQL):
    __tablename__ = 'observation_audit'
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    station_id: Mapped[str] = mapped_column(String(12))
    period: Mapped[str] = mapped_column(String(7))
    parameter: Mapped[str] = mapped_column(String(32))
    old_value: Mapped[str | None] = mapped_column(String(32), nullable=True)
    new_value: Mapped[str] = mapped_column(String(32))
    source_url: Mapped[str] = mapped_column(Text, default='')
    source_kind: Mapped[str] = mapped_column(String(16), nullable=False, server_default='online')
    source_organization: Mapped[str] = mapped_column(String(160), nullable=False, server_default='')
    source_date: Mapped[str] = mapped_column(String(10), nullable=False, server_default='')
    source_reference: Mapped[str] = mapped_column(String(250), nullable=False, server_default='')
    title: Mapped[str] = mapped_column(String(160), nullable=False, server_default='')
    method: Mapped[str] = mapped_column(String(20))
    editor_id: Mapped[int] = mapped_column(ForeignKey('admins.id'))
    editor_email: Mapped[str] = mapped_column(String(255))
    changed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


def migrate_source_columns():
    """Add non-destructive provenance columns to existing Render PostgreSQL tables.

    Original records are preserved, and existing citations default to online.
    The migration is idempotent so backend redeploys are safe.
    """
    columns = {
        'source_kind': "VARCHAR(16) NOT NULL DEFAULT 'online'",
        'source_organization': "VARCHAR(160) NOT NULL DEFAULT ''",
        'source_date': "VARCHAR(10) NOT NULL DEFAULT ''",
        'source_reference': "VARCHAR(250) NOT NULL DEFAULT ''",
    }
    with engine.begin() as conn:
        for table in ('observation_overrides', 'observation_audit'):
            existing = {column['name'] for column in inspect(conn).get_columns(table)}
            for name, definition in columns.items():
                if name not in existing:
                    conn.execute(text(f'ALTER TABLE {table} ADD COLUMN {name} {definition}'))
            if table == 'observation_audit' and 'title' not in existing:
                conn.execute(text("ALTER TABLE observation_audit ADD COLUMN title VARCHAR(160) NOT NULL DEFAULT ''"))


def init_db():
    BaseModelSQL.metadata.create_all(engine)
    migrate_source_columns()
    email = os.getenv('ADMIN_EMAIL', '').strip().lower()
    password = os.getenv('ADMIN_PASSWORD', '')
    with SessionLocal.begin() as db:
        count = db.scalar(select(Admin.id).limit(1))
        if not count:
            if not email or '@' not in email or len(password) < 12:
                raise RuntimeError('For first launch, set ADMIN_EMAIL and ADMIN_PASSWORD (12+ characters) in backend environment.')
            db.add(Admin(email=email, password_hash=ph.hash(password)))


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title='LakeWatch Laguna API', version='1.0.0', lifespan=lifespan,
              description='Historical LLDA water quality records and authenticated shared updates; not a live sensor feed.')
origins = [x.strip() for x in os.getenv('CORS_ORIGINS', '').split(',') if x.strip()]
if DEV:
    origins.extend(['http://127.0.0.1:5500', 'http://localhost:5500',
                    'http://127.0.0.1:5501', 'http://localhost:5501',
                    'http://127.0.0.1:3000', 'http://localhost:3000'])
app.add_middleware(CORSMiddleware, allow_origins=list(set(origins)), allow_credentials=False,
                   allow_methods=['GET', 'POST'], allow_headers=['Authorization', 'Content-Type'])


@app.middleware('http')
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    response.headers['Cache-Control'] = 'no-store'
    return response


def db_session():
    with SessionLocal() as db:
        yield db


class LoginIn(BaseModel):
    email: str
    password: str


# Simple per-process brute-force throttling for academic deployment.
# Multiple workers require an external shared rate limiter for strong enforcement.
login_attempts: dict[str, deque] = defaultdict(deque)
login_lock = Lock()


def enforce_login_limit(client_id: str):
    now = time.monotonic()
    with login_lock:
        attempts = login_attempts[client_id]
        while attempts and attempts[0] < now - 900:
            attempts.popleft()
        if len(attempts) >= 8:
            raise HTTPException(status_code=429, detail='Too many attempts. Try again after 15 minutes.')
        attempts.append(now)


@app.post('/api/auth/login')
def login(credentials: LoginIn, request: Request, db: Session = Depends(db_session)):
    enforce_login_limit(request.client.host if request.client else 'unknown')
    user = db.scalar(select(Admin).where(Admin.email == credentials.email.strip().lower()))
    if not user:
        # Equalize some of the expensive hash verification work on failed logins.
        try:
            ph.verify('$argon2id$v=19$m=65536,t=2,p=2$QVVUVU9fUkFORE9NX1NBTFQ$JLIga2YghZzOlQixRMvGy3kT1bJOx5cpWPyA19beoj4', credentials.password)
        except Exception:
            pass
        raise HTTPException(status_code=401, detail='Invalid email or password')
    try:
        valid = ph.verify(user.password_hash, credentials.password)
    except (argon_exc.VerifyMismatchError, argon_exc.VerificationError):
        valid = False
    if not valid:
        raise HTTPException(status_code=401, detail='Invalid email or password')
    with login_lock:
        login_attempts.pop(request.client.host if request.client else 'unknown', None)
    now = datetime.now(timezone.utc)
    token = jwt.encode({'sub': str(user.id), 'email': user.email, 'iss': 'lakewatch-api',
                        'aud': 'lakewatch-admin', 'iat': now, 'exp': int(now.timestamp()) + 7200},
                       JWT_SECRET, algorithm=JWT_ALGORITHM)
    return {'access_token': token, 'token_type': 'bearer', 'expires_in': 7200, 'email': user.email}


def current_admin(authorization: str | None = Header(None), db: Session = Depends(db_session)) -> Admin:
    if not authorization or not authorization.lower().startswith('bearer '):
        raise HTTPException(401, 'Administrator login required')
    try:
        payload = jwt.decode(authorization.split(' ', 1)[1], JWT_SECRET, algorithms=[JWT_ALGORITHM],
                             issuer='lakewatch-api', audience='lakewatch-admin')
        user_id = int(payload['sub'])
    except (jwt.PyJWTError, ValueError, KeyError):
        raise HTTPException(401, 'Session expired or invalid')
    user = db.get(Admin, user_id)
    if not user:
        raise HTTPException(401, 'Administrator not found')
    return user


@app.get('/api/health')
def health(db: Session = Depends(db_session)):
    db.execute(select(Admin.id).limit(1)).all()
    return {'status': 'ok', 'service': 'LakeWatch Laguna API', 'data_mode': 'historical-and-admin-updated'}


def merged_dataset(db: Session):
    data = copy.deepcopy(BASE)
    station_lookup = {s['id']: s for s in data['stations']}
    updated = db.scalars(select(Observation)).all()
    for row in updated:
        station = station_lookup.get(row.station_id)
        if not station or row.parameter not in PARAMETERS:
            continue
        sample = next((s for s in station['samples'] if s['period'] == row.period), None)
        if sample is None:
            sample = {'period': row.period, 'values': {}}
            station['samples'].append(sample)
        sample['values'][row.parameter] = row.value
        sample.setdefault('sources', {})[row.parameter] = row.source_url if row.source_kind == 'online' else ''
        sample.setdefault('provenance', {})[row.parameter] = {
            'editor': row.updated_by, 'updatedAt': row.updated_at.isoformat(),
            'method': row.method, 'title': row.title,
            'sourceKind': row.source_kind, 'sourceOrganization': row.source_organization,
            'sourceDate': row.source_date, 'sourceReference': row.source_reference,
            'sourceUrl': row.source_url if row.source_kind == 'online' else ''
        }
    periods = sorted({s['period'] for station in data['stations'] for s in station['samples']})
    data['periods'] = periods
    if periods:
        latest = periods[-1]
        year, month = map(int, latest.split('-'))
        cutoff_year, cutoff_month = (year * 12 + month - 1 - 11) // 12, ((year * 12 + month - 1 - 11) % 12) + 1
        cutoff = f'{cutoff_year:04d}-{cutoff_month:02d}'
        for station in data['stations']:
            station['samples'].sort(key=lambda x: x['period'])
            station['appStatus'] = ('active' if any(s['period'] >= cutoff and any(
                value is not None and value != '' for value in s['values'].values()
            ) for s in station['samples']) else 'archived')
        data['metadata']['statusAsOf'] = latest
    data['metadata']['sharedUpdateCount'] = len(updated)
    data['metadata']['dataMode'] = 'published historical reports + administrator-approved shared updates (not live sensors)'
    return data


@app.get('/api/dataset')
def dataset(db: Session = Depends(db_session)):
    return merged_dataset(db)


@app.get('/api/revision')
def revision(db: Session = Depends(db_session)):
    """Lightweight timestamp for notifying visitors that shared records changed."""
    count, last = db.execute(select(func.count(Observation.id), func.max(Observation.updated_at))).one()
    return {'count': count, 'latestUpdate': last.isoformat() if last else None}


@app.get('/api/auth/me')
def me(admin: Admin = Depends(current_admin)):
    return {'email': admin.email, 'role': 'admin'}


class IncomingObservation(BaseModel):
    stationId: str
    period: str
    parameter: str
    value: str
    sourceUrl: str = Field('', max_length=2000)
    sourceKind: str = Field('online', max_length=16)
    sourceOrganization: str = Field('', max_length=160)
    sourceDate: str = Field('', max_length=10)
    sourceReference: str = Field('', max_length=250)
    title: str = Field('', max_length=160)
    method: str = Field('manual')
    @field_validator('stationId')
    @classmethod
    def valid_station(cls, value):
        if value not in STATIONS: raise ValueError('Unknown station')
        return value
    @field_validator('period')
    @classmethod
    def valid_period(cls, value):
        if not re.fullmatch(r'\d{4}-(0[1-9]|1[0-2])', value): raise ValueError('Use YYYY-MM')
        if not ('1970-01' <= value <= datetime.now(timezone.utc).strftime('%Y-%m')):
            raise ValueError('Future or out-of-range month')
        return value
    @field_validator('parameter')
    @classmethod
    def valid_parameter(cls, value):
        if value not in PARAMETERS: raise ValueError('Unknown parameter')
        return value
    @field_validator('value')
    @classmethod
    def valid_value(cls, value):
        if not re.fullmatch(r'(?:<\s*)?(?:\d+(?:\.\d+)?|\.\d+)', value):
            raise ValueError('Invalid reading')
        number = float(value.replace('<', '').strip())
        if number > 100000: raise ValueError('Outside permitted range')
        return value.replace('< ', '<')
    @model_validator(mode='after')
    def validate_provenance(self):
        self.sourceKind = self.sourceKind.strip().lower()
        self.title = self.title.strip()
        self.sourceUrl = self.sourceUrl.strip()
        self.sourceOrganization = self.sourceOrganization.strip()
        self.sourceDate = self.sourceDate.strip()
        self.sourceReference = self.sourceReference.strip()
        if self.sourceKind not in ('online', 'offline'):
            raise ValueError('Source type must be Online or Offline')
        if self.sourceKind == 'online':
            u = urlparse(self.sourceUrl)
            if u.scheme not in ('http', 'https') or not u.hostname:
                raise ValueError('Online source needs a valid HTTP(S) source URL')
        else:
            if self.sourceUrl:
                raise ValueError('Offline source must not include a source URL')
            if not self.title:
                raise ValueError('Offline source requires a report/document title')
            if not self.sourceOrganization:
                raise ValueError('Offline source requires the issuing organization')
            if not self.sourceDate or not re.fullmatch(r'\d{4}(?:-(?:0[1-9]|1[0-2])(?:-(?:0[1-9]|[12]\d|3[01]))?)?', self.sourceDate):
                raise ValueError('Offline source requires publication date as YYYY, YYYY-MM or YYYY-MM-DD')
            try:
                datetime.strptime(self.sourceDate + ('-01-01' if len(self.sourceDate) == 4 else '-01' if len(self.sourceDate) == 7 else ''), '%Y-%m-%d')
            except ValueError:
                raise ValueError('Invalid offline publication date')
            if self.sourceDate[:4] < '1800' or self.sourceDate[:4] > datetime.now(timezone.utc).strftime('%Y'):
                raise ValueError('Offline publication year outside supported range')
        return self
    @field_validator('method')
    @classmethod
    def valid_method(cls, value):
        if value not in ('manual', 'file', 'url'):
            raise ValueError('Unknown import method')
        return value


class BatchIn(BaseModel):
    readings: list[IncomingObservation] = Field(min_length=1, max_length=500)
    allowReplace: bool = False


@app.post('/api/observations/batch')
def save_batch(batch: BatchIn, admin: Admin = Depends(current_admin), db: Session = Depends(db_session)):
    seen = set()
    errors, conflicts, duplicates, pending = [], [], [], []
    for idx, record in enumerate(batch.readings, start=1):
        key = (record.stationId, record.period, record.parameter)
        if key in seen:
            errors.append({'row': idx, 'reason': 'Repeated station/month/parameter in submission'})
            continue
        seen.add(key)
        if record.parameter == 'ph' and float(record.value.replace('<', '').strip()) > 14:
            errors.append({'row': idx, 'reason': 'pH exceeds 14'})
            continue
        previous = db.scalar(select(Observation).where(
            Observation.station_id == key[0], Observation.period == key[1], Observation.parameter == key[2]))
        old = previous.value if previous else BASE_VALUES.get(key)
        if old == record.value:
            duplicates.append(idx)
            continue
        if old is not None and not batch.allowReplace:
            conflicts.append({'row': idx, 'stationId': key[0], 'period': key[1], 'parameter': key[2]})
            continue
        pending.append((record, previous, old))
    if errors or conflicts:
        raise HTTPException(409, detail={'errors': errors, 'conflicts': conflicts,
                                          'message': 'Nothing saved; correct errors or explicitly authorize changes.'})
    now = datetime.now(timezone.utc)
    for record, previous, old in pending:
        if previous is None:
            previous = Observation(station_id=record.stationId, period=record.period,
                                   parameter=record.parameter)
            db.add(previous)
        previous.value, previous.source_url, previous.title = record.value, record.sourceUrl, record.title
        previous.source_kind, previous.source_organization = record.sourceKind, record.sourceOrganization
        previous.source_date, previous.source_reference = record.sourceDate, record.sourceReference
        previous.updated_by, previous.updated_at, previous.method = admin.email, now, record.method
        db.add(Audit(station_id=record.stationId, period=record.period, parameter=record.parameter,
                     old_value=old, new_value=record.value, source_url=record.sourceUrl,
                     source_kind=record.sourceKind, source_organization=record.sourceOrganization,
                     source_date=record.sourceDate, source_reference=record.sourceReference,
                     title=record.title, editor_id=admin.id, editor_email=admin.email, method=record.method, changed_at=now))
    db.commit()
    return {'saved': len(pending), 'unchanged': len(duplicates), 'shared': True}


@app.get('/api/audit')
def audit(admin: Admin = Depends(current_admin), db: Session = Depends(db_session)):
    rows = db.scalars(select(Audit).order_by(Audit.id.desc()).limit(100)).all()
    return {'rows': [{'stationId': r.station_id, 'period': r.period, 'parameter': r.parameter,
                      'value': r.new_value, 'previousValue': r.old_value,
                      'editor': r.editor_email, 'method': r.method,
                      'at': r.changed_at.isoformat(), 'sourceUrl': r.source_url,
                      'sourceKind': r.source_kind, 'title': r.title,
                      'sourceOrganization': r.source_organization, 'sourceDate': r.source_date,
                      'sourceReference': r.source_reference} for r in rows]}


@app.get('/api/observations/export')
def export_overrides(admin: Admin = Depends(current_admin), db: Session = Depends(db_session)):
    rows = db.scalars(select(Observation).order_by(Observation.period, Observation.station_id, Observation.parameter)).all()
    return {'format': 'lakewatch-shared-override-backup-v1', 'exportedAt': datetime.now(timezone.utc).isoformat(),
            'readings': [{'stationId': r.station_id, 'period': r.period, 'parameter': r.parameter,
                          'value': r.value, 'sourceUrl': r.source_url, 'sourceKind': r.source_kind,
                          'sourceOrganization': r.source_organization, 'sourceDate': r.source_date,
                          'sourceReference': r.source_reference, 'title': r.title,
                          'method': r.method, 'editor': r.updated_by, 'updatedAt': r.updated_at.isoformat()}
                         for r in rows]}


# --- Phase 10: independently sourced environmental context and incident registry ---
# These records are separate from laboratory observations and never alter LLDA samples.
class EnvironmentalIncident(BaseModelSQL):
    __tablename__ = 'environmental_incidents'
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    event_date: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    incident_type: Mapped[str] = mapped_column(String(40), nullable=False)
    station_id: Mapped[str | None] = mapped_column(String(12), nullable=True)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    source_title: Mapped[str] = mapped_column(String(200), nullable=False)
    source_url: Mapped[str] = mapped_column(Text, nullable=False, default='')
    added_by: Mapped[str] = mapped_column(String(255), nullable=False)
    added_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class ContextObservation(BaseModelSQL):
    __tablename__ = 'environmental_context_observations'
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    observation_date: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    kind: Mapped[str] = mapped_column(String(40), nullable=False)
    location: Mapped[str] = mapped_column(String(120), nullable=False)
    value: Mapped[float] = mapped_column(nullable=False)
    unit: Mapped[str] = mapped_column(String(20), nullable=False)
    source_title: Mapped[str] = mapped_column(String(200), nullable=False)
    source_url: Mapped[str] = mapped_column(Text, nullable=False, default='')
    added_by: Mapped[str] = mapped_column(String(255), nullable=False)
    added_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


def validate_public_link(value: str) -> str:
    value = value.strip()
    if not value:
        return ''
    parts = urlparse(value)
    if parts.scheme not in ('http', 'https') or not parts.hostname or parts.username or parts.password:
        raise ValueError('Supply a public http(s) document URL without credentials')
    return value


class IncidentIn(BaseModel):
    eventDate: str
    incidentType: str
    stationId: str | None = None
    title: str = Field(min_length=5, max_length=160)
    description: str = Field(min_length=15, max_length=3000)
    sourceTitle: str = Field(min_length=5, max_length=200)
    sourceUrl: str = Field('', max_length=2000)

    @model_validator(mode='after')
    def validate_input(self):
        try:
            when = datetime.strptime(self.eventDate, '%Y-%m-%d').date()
        except ValueError:
            raise ValueError('Event date must be a valid YYYY-MM-DD date')
        if when > datetime.now(timezone.utc).date() or when.year < 1970:
            raise ValueError('Future or out-of-range incident date')
        if self.incidentType not in ('fish_kill', 'algal_bloom', 'spill', 'sediment', 'other'):
            raise ValueError('Unrecognized incident category')
        if self.stationId and self.stationId not in STATIONS:
            raise ValueError('Unknown monitoring area')
        self.sourceUrl = validate_public_link(self.sourceUrl)
        self.title, self.description, self.sourceTitle = (v.strip() for v in (self.title,self.description,self.sourceTitle))
        return self


class ContextIn(BaseModel):
    observationDate: str
    kind: str
    location: str = Field(min_length=2, max_length=120)
    value: float
    sourceTitle: str = Field(min_length=5, max_length=200)
    sourceUrl: str = Field('', max_length=2000)

    @model_validator(mode='after')
    def validate_input(self):
        from math import isfinite
        try:
            when = datetime.strptime(self.observationDate, '%Y-%m-%d').date()
        except ValueError:
            raise ValueError('Use a valid observation date')
        if when > datetime.now(timezone.utc).date() or when.year < 1970:
            raise ValueError('Future or out-of-range observation date')
        if self.kind not in ('rainfall', 'air_temperature', 'lake_level', 'tributary_flow', 'water_temperature'):
            raise ValueError('Unknown context data type')
        if not isfinite(self.value) or abs(self.value)>1000000:
            raise ValueError('Non-finite or unreasonable magnitude')
        if self.kind in ('rainfall','tributary_flow') and self.value < 0:
            raise ValueError('Negative values are not allowed for this type')
        self.sourceUrl = validate_public_link(self.sourceUrl)
        self.location,self.sourceTitle=self.location.strip(),self.sourceTitle.strip()
        return self


CONTEXT_UNITS = {'rainfall':'mm', 'air_temperature':'°C', 'lake_level':'m',
                 'tributary_flow':'m³/s', 'water_temperature':'°C'}


@app.get('/api/incidents')
def list_incidents(db: Session = Depends(db_session)):
    rows = db.scalars(select(EnvironmentalIncident).order_by(EnvironmentalIncident.event_date.desc(), EnvironmentalIncident.id.desc()).limit(250)).all()
    return {'records': [{'id':r.id, 'eventDate':r.event_date,'incidentType':r.incident_type,
        'stationId':r.station_id,'title':r.title,'description':r.description,
        'sourceTitle':r.source_title,'sourceUrl':r.source_url,'addedAt':r.added_at.isoformat(),
        'verification':'Administrator-documented report; not an independent LLDA confirmation'} for r in rows]}


@app.post('/api/incidents', status_code=201)
def add_incident(item: IncidentIn, admin: Admin = Depends(current_admin), db: Session = Depends(db_session)):
    row = EnvironmentalIncident(event_date=item.eventDate,incident_type=item.incidentType,
        station_id=item.stationId or None,title=item.title,description=item.description,
        source_title=item.sourceTitle,source_url=item.sourceUrl,added_by=admin.email)
    db.add(row)
    db.commit()
    return {'id':row.id, 'saved':True, 'verification':'Administrator documented; not independently confirmed'}


@app.get('/api/environmental-context')
def list_context(db: Session = Depends(db_session)):
    rows=db.scalars(select(ContextObservation).order_by(ContextObservation.observation_date.desc(),ContextObservation.id.desc()).limit(500)).all()
    return {'records':[{'id':r.id,'observationDate':r.observation_date,'kind':r.kind,
        'location':r.location,'value':r.value,'unit':r.unit,'sourceTitle':r.source_title,
        'sourceUrl':r.source_url,'addedAt':r.added_at.isoformat()} for r in rows]}


@app.post('/api/environmental-context', status_code=201)
def add_context(item: ContextIn, admin: Admin = Depends(current_admin), db: Session = Depends(db_session)):
    row=ContextObservation(observation_date=item.observationDate,kind=item.kind,
        location=item.location,value=item.value,unit=CONTEXT_UNITS[item.kind],
        source_title=item.sourceTitle,source_url=item.sourceUrl,added_by=admin.email)
    db.add(row)
    db.commit()
    return {'id':row.id,'saved':True}

# Render-native PDF export. Public read-only report; no client-side PDF dependency required.
from io import BytesIO
from xml.sax.saxutils import escape as xml_escape
from fastapi import Query
from fastapi.responses import StreamingResponse
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.units import mm


@app.get('/api/reports/pdf')
def pdf_report(
        stationId: str = Query('I', min_length=1, max_length=12),
        period: str = Query('2026-06', min_length=7, max_length=7),
        parameter: str = Query('all', max_length=40),
        includeIncidents: bool = True,
        includeContext: bool = True,
        db: Session = Depends(db_session)):
    """Source-labeled, server-generated report of published historical observations."""
    if stationId != 'all' and stationId not in STATIONS:
        raise HTTPException(400, 'Unknown station')
    if not re.fullmatch(r'\d{4}-(0[1-9]|1[0-2])', period):
        raise HTTPException(400, 'Use a YYYY-MM reporting month')
    if parameter != 'all' and parameter not in PARAMETERS:
        raise HTTPException(400, 'Unknown parameter')
    data = merged_dataset(db)
    if period not in data['periods']:
        raise HTTPException(400, 'No imported records for this month')
    stations = data['stations'] if stationId == 'all' else [s for s in data['stations'] if s['id'] == stationId]
    params = [p for p in data['parameters'] if parameter == 'all' or p['id'] == parameter]

    buf = BytesIO()
    PAGE_W,PAGE_H=A4
    theme_navy=colors.HexColor('#0B2C40')
    theme_teal=colors.HexColor('#0B9489')
    pale=colors.HexColor('#EAF4F4')
    gray=colors.HexColor('#526B79')
    styles=getSampleStyleSheet()
    styles.add(ParagraphStyle(name='LakeSub',parent=styles['Normal'],fontName='Helvetica',fontSize=9,leading=14,textColor=gray))
    styles.add(ParagraphStyle(name='LakeHead',parent=styles['Heading2'],fontName='Helvetica-Bold',fontSize=13,leading=19,spaceBefore=12,spaceAfter=9,textColor=theme_navy))
    styles.add(ParagraphStyle(name='LakeCell',parent=styles['Normal'],fontName='Helvetica',fontSize=8.1,leading=10.5,textColor=theme_navy))
    styles.add(ParagraphStyle(name='LakeSmall',parent=styles['Normal'],fontName='Helvetica',fontSize=7.4,leading=11,textColor=gray))
    fmt=lambda v: xml_escape(str(v if v is not None else ''))

    def pages(canvas, doc):
        canvas.saveState()
        canvas.setFillColor(theme_navy)
        canvas.rect(0,PAGE_H-34*mm,PAGE_W,34*mm,stroke=0,fill=1)
        canvas.setFillColor(theme_teal)
        canvas.rect(0,PAGE_H-34*mm,PAGE_W,2*mm,stroke=0,fill=1)
        logo=Path(__file__).parent/'assets'/'lakewatch-laguna-logo.png'
        if logo.exists():
            try: canvas.drawImage(str(logo),18*mm,PAGE_H-25*mm,width=16*mm,height=16*mm,mask='auto',preserveAspectRatio=True,anchor='c')
            except Exception: pass
        canvas.setFillColor(colors.white)
        canvas.setFont('Helvetica-Bold',15)
        canvas.drawString(39*mm,PAGE_H-19*mm,'LAKEWATCH LAGUNA')
        canvas.setFont('Helvetica',8)
        canvas.drawString(39*mm,PAGE_H-26*mm,'Environmental Intelligence  /  Water Quality Report')
        canvas.setStrokeColor(colors.HexColor('#CEDDE0'))
        canvas.line(16*mm,17*mm,PAGE_W-16*mm,17*mm)
        canvas.setFillColor(gray)
        canvas.setFont('Helvetica',7)
        canvas.drawString(16*mm,12*mm,'MIT  |  LSPU San Pablo City Campus  |  Historical data, not live sensors')
        canvas.drawRightString(PAGE_W-16*mm,12*mm,f'Page {doc.page}')
        canvas.restoreState()

    doc=SimpleDocTemplate(buf,pagesize=A4,rightMargin=16*mm,leftMargin=16*mm,
        topMargin=40*mm,bottomMargin=22*mm,title='LakeWatch Laguna Water Quality Report',author='LakeWatch Laguna')
    story=[Paragraph('Monitoring Summary',styles['LakeHead'])]
    story.append(Paragraph(f'<b>Sampling month:</b> {fmt(period)}  |  <b>Monitoring areas:</b> {len(stations)}  |  <b>Parameters:</b> {len(params)}',styles['LakeSub']))
    story.append(Paragraph('These are dated laboratory observations. The system does not provide live LLDA sensor readings or certify water safety.',styles['LakeSub']))
    story.append(Spacer(1,5*mm))
    header=[Paragraph('<b>Station / Bay</b>',styles['LakeCell']), Paragraph('<b>Parameter</b>',styles['LakeCell']), Paragraph('<b>Reported result</b>',styles['LakeCell']), Paragraph('<b>Source</b>',styles['LakeCell'])]
    table_rows=[header]
    totals=0
    citations=set()
    for station in stations:
        sample=next((s for s in station['samples'] if s['period']==period),None)
        for p in params:
            raw=sample.get('values',{}).get(p['id']) if sample else None
            if raw is not None and raw!='': totals+=1
            value='Not reported' if raw is None or raw=='' else str(raw) + ('' if p['unit']=='pH units' else f" {p['unit']}")
            provenance=(sample or {}).get('provenance',{}).get(p['id'])
            if provenance:
                source='Admin: '+(provenance.get('title') or provenance.get('sourceOrganization') or 'documented update')
                ref=provenance.get('sourceUrl') or ' / '.join(str(provenance.get(k) or '') for k in ('sourceOrganization','sourceDate','sourceReference'))
                if ref.strip():citations.add(ref)
            else:
                entry=data['metadata'].get('quarterlySources',{}).get(period,{})
                source='LLDA '+entry['title'] if entry else 'Source not recorded'
                if entry.get('url'): citations.add(entry['url'])
            station_name=station['name']+' / '+station['zone']
            table_rows.append([Paragraph(fmt(station_name),styles['LakeCell']),
                Paragraph(fmt(p['name']),styles['LakeCell']),Paragraph(fmt(value),styles['LakeCell']),Paragraph(fmt(source),styles['LakeCell'])])
    story.append(Paragraph(f'<b>Available observations:</b> {totals} of {len(stations)*len(params)} selected station-parameter combinations',styles['LakeSub']))
    story.append(Spacer(1,4*mm))
    table=Table(table_rows,colWidths=[51*mm,45*mm,35*mm,46*mm],repeatRows=1,hAlign='LEFT')
    table.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,0),pale),('VALIGN',(0,0),(-1,-1),'TOP'),
        ('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,colors.HexColor('#F7FAFA')]),
        ('LINEBELOW',(0,0),(-1,-1),0.3,colors.HexColor('#D8E6E8')),
        ('LEFTPADDING',(0,0),(-1,-1),6),('RIGHTPADDING',(0,0),(-1,-1),5),
        ('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7)
    ]))
    story.append(table)

    story.append(Paragraph('Interpretation and Limitations',styles['LakeHead']))
    for note in [
        'DO relates to oxygen availability; BOD reflects biodegradable oxygen demand; pH describes acidity or alkalinity.',
        'Nitrate and phosphate are nutrients, but their chemical reporting bases must match any comparison standard.',
        'TSS describes suspended particles. An individual result cannot establish the condition of the entire lake.',
        'Results below a laboratory detection/reporting limit (for example &lt;0.1) are not exact numeric values.',
        'Station marker coordinates may be approximate and must not be interpreted as surveyed sampling locations.',
    ]: story.append(Paragraph('&#8226; '+note,styles['LakeSub']))
    if includeIncidents:
        story.append(Paragraph('Environmental Incident Registry',styles['LakeHead']))
        items=db.scalars(select(EnvironmentalIncident).order_by(EnvironmentalIncident.event_date.desc()).limit(35)).all()
        if not items: story.append(Paragraph('No administrator-documented incident reports are currently published in this registry. This does not mean that no incidents occurred.',styles['LakeSub']))
        for incident in items:
            text_content=f'{incident.event_date} | {incident.incident_type.replace("_"," ")} | {incident.title} | {incident.source_title}'
            story.append(Paragraph(fmt(text_content),styles['LakeSmall']))
            if incident.source_url:citations.add(incident.source_url)
    if includeContext:
        story.append(Paragraph('Environmental Context',styles['LakeHead']))
        items=db.scalars(select(ContextObservation).order_by(ContextObservation.observation_date.desc()).limit(35)).all()
        if not items:story.append(Paragraph('No independently sourced contextual measurements are currently published in the curated context dataset.',styles['LakeSub']))
        for r in items:
            value=f'{r.observation_date} | {r.kind.replace("_"," ")} | {r.location} | {r.value:g} {r.unit} | {r.source_title}'
            story.append(Paragraph(fmt(value),styles['LakeSmall']))
            if r.source_url:citations.add(r.source_url)

    story.append(Paragraph('Data Provenance',styles['LakeHead']))
    for title, url in [('LLDA Q4 2023',data['metadata'].get('source2023Url','')),
                       ('LLDA Q2 2026',data['metadata'].get('source2026Url',''))]:
        if url:story.append(Paragraph(f'<b>{fmt(title)}:</b> {fmt(url)}',styles['LakeSmall']))
    for source in sorted(citations):story.append(Paragraph(fmt(source),styles['LakeSmall']))
    story.append(Spacer(1,4*mm))
    story.append(Paragraph(f'<i>Report generated UTC: {datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M")}. Original data and citations should be reviewed before formal environmental or regulatory decisions.</i>',styles['LakeSmall']))
    doc.build(story,onFirstPage=pages,onLaterPages=pages)
    buf.seek(0)
    filename=f'LakeWatch_Laguna_{period}_{stationId}_Report.pdf'
    return StreamingResponse(buf,media_type='application/pdf',headers={
        'Content-Disposition':f'attachment; filename="{filename}"',
        'Cache-Control':'no-store'
    })
