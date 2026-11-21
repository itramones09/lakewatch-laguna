# LakeWatch Laguna — Publish via GitHub + Render + Vercel

## 0. Accounts and local prerequisites

- Visual Studio Code (Windows version), Python 3.11+, Git for Windows, and a GitHub account.
- Accounts at **https://github.com/**, **https://dashboard.render.com/**, and **https://vercel.com/dashboard**.
- Internet access. Frontend charts, OpenStreetMap tiles, and Excel parsing use external libraries/services.
- Do **not** put admin passwords, JWT secrets, or database URLs in the frontend or a public GitHub repository.

## 1. Confirm the system works locally

Open the root project folder in VS Code. Follow the root README quick start to run FastAPI at `http://127.0.0.1:8000` and the frontend on Live Server, typically `http://127.0.0.1:5500`.

When testing an import, use a **clearly labeled test-only source**, never fabricated LLDA data represented as fact. Locally, the backend uses SQLite in `backend/lakewatch_dev.db`. This is intentional; the production backend uses PostgreSQL.

## 2. Upload to GitHub from VS Code

1. At GitHub, create a **new empty repository**, e.g. `lakewatch-laguna`. Private is preferred while the project is under development; configure Vercel/Render repository access as needed.
2. In VS Code, open **Terminal → New Terminal** at `LakeWatch-Laguna-Fullstack/` and run:

```powershell
git init
git add .
git commit -m "LakeWatch Laguna full-stack Phase 8"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/lakewatch-laguna.git
git push -u origin main
```

3. Authenticate with GitHub when prompted. Verify `.env`, `*.db`, `.venv`, and passwords do **not** appear in the repository.
4. Developers can work collaboratively through GitHub collaborators and pull requests.

## 3. Create PostgreSQL database at Render

1. Log into https://dashboard.render.com/.
2. Create **Postgres** (managed PostgreSQL). Name it `lakewatch-postgres`; choose the same region as your future backend service.
3. Choose a plan. **Free PostgreSQL expires after 30 days**; choose a suitable persistent paid plan if the database needs to live beyond testing. Confirm prices before proceeding.
4. After creation, find the **Internal Database URL** in its dashboard. Do not paste the connection URL into GitHub, the frontend, or chat.

## 4. Deploy the FastAPI backend to Render

1. Render dashboard → **New → Web Service** → connect the GitHub repository `lakewatch-laguna`.
2. Select branch `main`, runtime **Python**, and set **Root Directory** = `backend`.
3. **Build Command:** `pip install -r requirements.txt`
4. **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. In **Environment**, add values (configure privately through Render UI):

| Environment variable | Value |
|---|---|
| `DATABASE_URL` | Internal Postgres connection URL from the Render database dashboard |
| `JWT_SECRET` | A 32+ character unpredictable secret; e.g. generate with `python -c "import secrets;print(secrets.token_urlsafe(48))"` |
| `ADMIN_EMAIL` | Your authorized administrator email |
| `ADMIN_PASSWORD` | Strong and unique 12+ character password for **initial** account creation |
| `CORS_ORIGINS` | Initially `http://127.0.0.1:5500` until the Vercel production URL is known |

Do not set `LAKEWATCH_DEV_MODE=1` on Render; it belongs to local SQLite testing only.

6. Click **Deploy Web Service**. Save the backend URL, e.g. `https://lakewatch-laguna-api.onrender.com`. Verify in a browser:

- `https://YOUR_RENDER_SERVICE.onrender.com/api/health`
- `https://YOUR_RENDER_SERVICE.onrender.com/api/dataset`

The API should return a service status and a JSON dataset. Do not test on the `/api/auth/login` route in a browser address bar (it requires POST).

**Important:** The first admin is created on **initial** database initialization only; updating the `ADMIN_PASSWORD` environment variable afterwards does not automatically change that stored password hash. Rotate credentials using a secure administrator-management procedure, not by modifying the frontend. Render database updates persist independently of frontend redeployments.

## 5. Point the frontend to the Render service

Open `frontend/js/api-config.js`. Replace **only** the public URL:

```js
window.LAKEWATCH_API_BASE_URL = 'https://YOUR_RENDER_SERVICE.onrender.com';
```

Commit and push:

```powershell
git add frontend/js/api-config.js
git commit -m "Configure production API endpoint"
git push
```

This URL contains **no secret**, so it may be public. It must be the HTTPS URL of your own actual deployed Render web service. Do not add a trailing `/api`.

## 6. Deploy the frontend to Vercel

1. Vercel dashboard → **Add New → Project** → import your GitHub repository.
2. Set **Root Directory** to `frontend`.
3. Framework Preset: **Other**. The project uses plain HTML/CSS/JS. Leave the **Build Command** empty; no build step is needed. The app serves `index.html` directly.
4. Click **Deploy**. Obtain a URL similar to `https://lakewatch-laguna.vercel.app`.
5. Open the site; a temporary **offline snapshot** message is expected until Render allows your exact Vercel origin.

## 7. Authorize the production Vercel origin in Render

1. Render backend service → Environment → change `CORS_ORIGINS` to the **exact** production origin, such as:

```text
https://lakewatch-laguna.vercel.app,http://127.0.0.1:5500
```

2. Save and redeploy/restart the backend as Render directs.
3. Refresh the Vercel site. The status banner must say **Connected · Shared database readings**.
4. If you add a custom domain or Vercel preview hostname, add each exact HTTPS origin to `CORS_ORIGINS` (comma-separated). Do not use `*` for admin requests.

## 8. Final end-to-end verification

- On Vercel in an incognito browser, verify public map, stations, historical Analytics, Data Explorer, and 16 active/3 archived views.
- Visit **Manage Data** without logging in. Import controls must be hidden, and backend write endpoints must return **401** without a token.
- Log in using administrator credentials. Import a **test-only** new record with a source URL (clearly identified as demonstration data), preview, and save.
- Open the site in **another browser/device** and refresh: it should show the new approved reading. This proves PostgreSQL is shared; it does not prove live sensors are connected.
- Download the JSON backup and inspect the audit history.
- For the actual assessed data, only publish verified measurements from official sources. Correct or remove test records before the final demonstration; direct database changes should be handled with a documented administrative procedure.

## Troubleshooting

| Symptom | Likely cause | Remedy |
|---|---|---|
| Offline snapshot banner | Render API unreachable / wrong URL / CORS blocked | Test `/api/health`; check `api-config.js`, Render logs, `CORS_ORIGINS` |
| `401` on login-protected endpoint | No token, invalid or expired token | Sign in again; check admin env and database |
| `409` during import | Existing value differs | Review correction; explicitly allow replacement |
| `422` during import | Invalid station, period, parameter, value, URL, or method | Correct source format, re-preview and re-upload |
| Backend deploy fails immediately | Missing `JWT_SECRET`, `DATABASE_URL`, or first admin credentials | Set Render environment variables securely |
| Browser loads but remote fetch fails | Render app sleeping or CORS mismatch | Recheck Render URL and origin; retry after free-service wake-up |
| Web works but imported data disappear | Database is ephemeral/expired, or service points to wrong DB | Restore a backup to persistent managed PostgreSQL; inspect `DATABASE_URL` |
| Excel upload doesn't parse | External SheetJS CDN blocked | Export your Excel worksheet to CSV and import that |
| No official real-time measurements | No confirmed LLDA sensor API | Continue with published historical data; do not mark as sensor-live |

## Architecture and responsibility

GitHub stores source code. Vercel serves static HTML/CSS/JS. Render serves the FastAPI endpoints and owns credentials. PostgreSQL stores approved data changes and their audit history. The original bundled observations remain available as a source-linked baseline. Frontend refresh is needed to display recent shared updates, and a background revision check alerts users about changes approximately every 60 seconds.

**Security scope:** This is a university project reference architecture, not a security-certified government system. Before handling sensitive or mission-critical data, add a mature identity provider, centralized rate limiting, HTTPS-only deployments, password recovery/rotation, database migration tooling, backups, monitoring, and security assessment.
