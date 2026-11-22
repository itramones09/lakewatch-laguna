"""Phase 10 public read, admin-only write, validation and persistence."""
import os, tempfile
from pathlib import Path
_testdir=tempfile.TemporaryDirectory(prefix='lakewatch_phase10_')
os.environ.setdefault('LAKEWATCH_DEV_MODE','1')
os.environ.setdefault('DATABASE_URL','sqlite:///'+str(Path(_testdir.name)/'phase10.db'))
os.environ.setdefault('JWT_SECRET','unit-test-jwt-secret-only-not-for-deploy-32-chars')
os.environ.setdefault('ADMIN_EMAIL','testing@example.com')
os.environ.setdefault('ADMIN_PASSWORD','test-only-very-long-password-1234')
from fastapi.testclient import TestClient
from app.main import app


def test_incident_and_context_endpoints():
    with TestClient(app) as client:
        assert client.get('/api/incidents').status_code == 200
        assert client.get('/api/environmental-context').status_code == 200
        assert client.get('/api/incidents').json()['records'] == []
        assert client.get('/api/environmental-context').json()['records'] == []
        report = dict(eventDate='2025-10-12', incidentType='fish_kill', stationId='I',
             title='Test only: a hypothetical field report',
             description='This is a unit test entry; it must never be deployed as a real incident.',
             sourceTitle='Hypothetical test source', sourceUrl='https://example.org/source')
        ctx = dict(observationDate='2025-10-12',kind='lake_level',location='Test site',
             value=1.28,sourceTitle='Hypothetical test source',sourceUrl='https://example.org/source')
        assert client.post('/api/incidents',json=report).status_code == 401
        assert client.post('/api/environmental-context',json=ctx).status_code == 401
        login=client.post('/api/auth/login',json={'email':'testing@example.com','password':'test-only-very-long-password-1234'})
        assert login.status_code == 200
        headers={'Authorization':'Bearer '+login.json()['access_token']}
        assert client.post('/api/incidents',headers=headers,json={**report,'eventDate':'2099-01-01'}).status_code == 422
        assert client.post('/api/incidents',headers=headers,json={**report,'stationId':'NOT-A-STATION'}).status_code == 422
        assert client.post('/api/incidents',headers=headers,json={**report,'sourceUrl':'file:///etc/passwd'}).status_code == 422
        assert client.post('/api/environmental-context',headers=headers,json={**ctx,'kind':'invalid'}).status_code == 422
        assert client.post('/api/environmental-context',headers=headers,json={**ctx,'value':-5,'kind':'rainfall'}).status_code == 422
        a=client.post('/api/incidents',headers=headers,json=report)
        assert a.status_code == 201,a.text
        b=client.post('/api/environmental-context',headers=headers,json=ctx)
        assert b.status_code == 201,b.text
        incidents=client.get('/api/incidents').json()['records']
        context=client.get('/api/environmental-context').json()['records']
        assert len(incidents)==1 and incidents[0]['stationId']=='I'
        assert len(context)==1 and context[0]['unit']=='m'
        assert client.get('/api/dataset').status_code == 200
        assert client.get('/api/health').status_code == 200


def test_professional_pdf_export():
    with TestClient(app) as client:
        report=client.get('/api/reports/pdf?stationId=I&period=2026-06&parameter=all')
        assert report.status_code == 200, report.text[:500] if report.status_code != 200 else ''
        assert report.headers['content-type'].startswith('application/pdf')
        assert report.content[:4] == b'%PDF'
        assert len(report.content)>3000
        from io import BytesIO
        from pypdf import PdfReader
        pdf=PdfReader(BytesIO(report.content))
        content=' '.join(p.extract_text() for p in pdf.pages)
        assert 'LAKEWATCH LAGUNA' in content
        assert 'Monitoring Summary' in content
        assert 'Dissolved Oxygen' in content
        assert 'Historical' in content
        assert client.get('/api/reports/pdf?stationId=NOTREAL&period=2026-06').status_code == 400
        assert client.get('/api/reports/pdf?stationId=I&period=2026-06&parameter=invalid').status_code == 400
