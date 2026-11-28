"""Integration tests for the public dataset and protected shared updates."""
import os
import tempfile
from pathlib import Path

_tmp = tempfile.TemporaryDirectory(prefix='lakewatch_api_')
os.environ['LAKEWATCH_DEV_MODE'] = '1'
os.environ['DATABASE_URL'] = 'sqlite:///' + str(Path(_tmp.name) / 'test.db')
os.environ['JWT_SECRET'] = 'unit-test-jwt-secret-only-not-for-deploy-32-chars'
os.environ['ADMIN_EMAIL'] = 'testing@example.com'
os.environ['ADMIN_PASSWORD'] = 'test-only-very-long-password-1234'

from fastapi.testclient import TestClient  # noqa: E402
from app.main import app, BASE_VALUES  # noqa: E402


def test_backend_login_and_shared_write():
    with TestClient(app) as client:
        h = client.get('/api/health')
        assert h.status_code == 200
        original = client.get('/api/dataset')
        assert original.status_code == 200
        data = original.json()
        assert len(data['stations']) == 19
        assert len(data['parameters']) == 6
        assert data['metadata']['sharedUpdateCount'] == 0
        assert client.get('/api/audit').status_code == 401
        assert client.post('/api/auth/login', json={'email': 'testing@example.com', 'password': 'bad'}).status_code == 401
        login = client.post('/api/auth/login', json={
            'email': 'testing@example.com', 'password': 'test-only-very-long-password-1234'
        })
        assert login.status_code == 200
        token = login.json()['access_token']
        headers = {'Authorization': 'Bearer ' + token}
        assert client.get('/api/auth/me', headers=headers).json()['role'] == 'admin'
        read = {'stationId': 'I', 'period': '2026-07', 'parameter': 'do',
                'value': '7.4', 'sourceUrl': 'https://llda.gov.ph/report-example',
                'title': 'Test only — not real LLDA', 'method': 'manual'}
        assert client.post('/api/observations/batch', json={'readings': [read]}).status_code == 401
        saved = client.post('/api/observations/batch', headers=headers,
                            json={'readings': [read], 'allowReplace': False})
        assert saved.status_code == 200, saved.text
        assert saved.json()['saved'] == 1
        updated = client.get('/api/dataset').json()
        assert updated['metadata']['sharedUpdateCount'] == 1
        station = next(s for s in updated['stations'] if s['id'] == 'I')
        assert next(s for s in station['samples'] if s['period'] == '2026-07')['values']['do'] == '7.4'
        same = client.post('/api/observations/batch', headers=headers, json={'readings': [read]})
        assert same.json()['unchanged'] == 1
        bad = client.post('/api/observations/batch', headers=headers,
                          json={'readings': [{**read, 'value': '8.5'}], 'allowReplace': False})
        assert bad.status_code == 409
        replaced = client.post('/api/observations/batch', headers=headers,
                               json={'readings': [{**read, 'value': '<0.1'}], 'allowReplace': True})
        assert replaced.status_code == 200
        assert next(s for s in client.get('/api/dataset').json()['stations'] if s['id']=='I')['samples'][-1]['values']['do'] == '<0.1'
        assert client.get('/api/observations/export', headers=headers).json()['readings'][0]['value'] == '<0.1'
        assert len(client.get('/api/audit', headers=headers).json()['rows']) == 2
        unknown = client.post('/api/observations/batch', headers=headers, json={'readings': [{**read, 'stationId': 'UNREAL'}]})
        assert unknown.status_code == 422
        assert len(BASE_VALUES) == 789
