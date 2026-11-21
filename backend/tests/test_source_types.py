"""Phase 9: Online and Offline source citation checks."""
import os
import tempfile
from pathlib import Path

_tmp = tempfile.TemporaryDirectory(prefix='lakewatch_source_tests_')
os.environ['LAKEWATCH_DEV_MODE'] = '1'
os.environ['DATABASE_URL'] = 'sqlite:///' + str(Path(_tmp.name) / 'test.db')
os.environ['JWT_SECRET'] = 'unit-test-jwt-secret-only-not-for-deploy-32-chars'
os.environ['ADMIN_EMAIL'] = 'testing@example.com'
os.environ['ADMIN_PASSWORD'] = 'test-only-very-long-password-1234'

from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine, inspect, text  # noqa: E402
import app.main as main  # noqa: E402


def get_auth(client):
    result = client.post('/api/auth/login', json={
        'email': 'testing@example.com', 'password': 'test-only-very-long-password-1234'})
    assert result.status_code == 200, result.text
    return {'Authorization': 'Bearer ' + result.json()['access_token']}


def test_online_and_offline_sources():
    with TestClient(main.app) as client:
        headers = get_auth(client)
        base = {'stationId': 'I', 'period': '2026-09', 'parameter': 'do', 'value': '7.4', 'method': 'manual'}
        # Offline citation without URL is allowed with traceable metadata.
        offline = {**base, 'sourceKind': 'offline', 'sourceUrl': '',
                   'title': 'Water Quality Field Report', 'sourceOrganization': 'University Environmental Laboratory',
                   'sourceDate': '1998', 'sourceReference': 'Archive B, p. 7'}
        saved = client.post('/api/observations/batch', headers=headers,
                            json={'readings': [offline]})
        assert saved.status_code == 200, saved.text
        report = client.get('/api/dataset').json()
        station = next(s for s in report['stations'] if s['id'] == 'I')
        record = next(s for s in station['samples'] if s['period'] == '2026-09')
        assert record['values']['do'] == '7.4'
        assert record['provenance']['do']['sourceKind'] == 'offline'
        assert record['provenance']['do']['sourceOrganization'] == 'University Environmental Laboratory'
        assert record['provenance']['do']['sourceUrl'] == ''
        audit = client.get('/api/audit', headers=headers).json()['rows'][0]
        assert audit['sourceKind'] == 'offline' and audit['sourceReference'] == 'Archive B, p. 7'
        export = next(r for r in client.get('/api/observations/export', headers=headers).json()['readings'] if r['period'] == '2026-09')
        assert export['sourceDate'] == '1998'
        # Correcting a value with online citation is allowed after explicit approval.
        online = {**base, 'value': '<0.1', 'sourceUrl': 'https://example.edu/llda-report.pdf',
                  'title': 'Online report', 'sourceKind': 'online'}
        updated = client.post('/api/observations/batch', headers=headers,
                              json={'readings': [online], 'allowReplace': True})
        assert updated.status_code == 200, updated.text
        assert client.get('/api/audit', headers=headers).json()['rows'][0]['sourceKind'] == 'online'
        assert next(r for r in client.get('/api/observations/export', headers=headers).json()['readings'] if r['period'] == '2026-09')['sourceUrl'] == online['sourceUrl']
        # Offline errors cannot bypass server validation.
        for bad in [{**offline, 'period': '2026-10', 'sourceOrganization': ''},
                    {**offline, 'period': '2026-10', 'title': ''},
                    {**offline, 'period': '2026-10', 'sourceDate': '2025-02-30'},
                    {**offline, 'period': '2026-10', 'sourceUrl': 'https://example.com'},
                    {**offline, 'period': '2026-10', 'sourceKind': 'not-allowed'},
                    {**online, 'period': '2026-10', 'sourceUrl': ''}]:
            resp = client.post('/api/observations/batch', headers=headers, json={'readings': [bad]})
            assert resp.status_code == 422, resp.text
        assert client.get('/api/revision').status_code == 200


def test_legacy_database_schema_is_upgraded_without_deleting_rows(monkeypatch):
    db = create_engine('sqlite:///' + str(Path(_tmp.name) / 'legacy.db'))
    with db.begin() as conn:
        conn.execute(text('CREATE TABLE observation_overrides (id INTEGER PRIMARY KEY, source_url TEXT, title VARCHAR(160))'))
        conn.execute(text("INSERT INTO observation_overrides (id,source_url,title) VALUES (1,'https://example.com/old','Old Report')"))
        conn.execute(text('CREATE TABLE observation_audit (id INTEGER PRIMARY KEY, source_url TEXT)'))
    monkeypatch.setattr(main, 'engine', db)
    main.migrate_source_columns()
    main.migrate_source_columns()  # safe on repeated backend deployments
    with db.connect() as conn:
        assert conn.execute(text('SELECT title, source_kind FROM observation_overrides WHERE id=1')).first() == ('Old Report','online')
        for table in ('observation_overrides', 'observation_audit'):
            cols = {column['name'] for column in inspect(conn).get_columns(table)}
            assert {'source_kind', 'source_organization', 'source_date', 'source_reference'}.issubset(cols)
        assert 'title' in {c['name'] for c in inspect(conn).get_columns('observation_audit')}
