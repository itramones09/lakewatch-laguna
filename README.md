# LakeWatch Laguna — Phase 8 full-stack web application

**Final project:** WITM 101 Advanced Web Design and Programming — Master in Information Technology (MIT), Laguna State Polytechnic University – San Pablo City Campus  
**Developers:** Ian Titus F. Ramones and Dycyn T. Alvaro  
**Submission deadline:** December 6, 2026

This is the **actual Phase 7 application** extended with:

- **Frontend:** plain HTML5, CSS3, JavaScript, Leaflet, Chart.js; deploy `frontend/` to **Vercel**.
- **Backend:** FastAPI, JSON REST endpoints, Argon2-hashed administrator passwords, expiring JWT sessions; deploy `backend/` to **Render**.
- **Shared database:** PostgreSQL (Render managed Postgres). SQLite works only for **local development**.
- **Manage Data:** admin-only manual entry, CSV/Excel file import, and direct CSV/JSON URL import. All updates are validated on the backend, written atomically, audited, and shown to all visitors.
- **Existing features retained:** 16 stations with June 2026 readings, 3 historical unverified registry entries, historical datasets, colored parameters, Map, Monitoring Stations, Analytics, Data Explorer, the official logo, and Light/Dark/System appearance settings.

**“Live” means the website and backend are accessible online and administrator-approved updates are shared. It does not mean that lake sensor measurements arrive in real time.** Source-linked LLDA data remain historical reports; no real-time LLDA API is connected.

## Folders

```text
LakeWatch-Laguna-Fullstack/
├── frontend/                 # Deploy as Vercel project root
│   ├── index.html
│   ├── js/api-config.js      # Change PUBLIC Render API URL after deployment
│   ├── js/api-client.js
│   ├── js/data-manager.js
│   ├── assets/ css/ data/ docs/ ...
├── backend/                  # Deploy as Render web service root
│   ├── app/main.py
│   ├── app/data/stations.json # Bundled read-only LLDA baseline
│   ├── requirements.txt
│   ├── .env.example
│   └── tests/test_api.py
├── docs/DEPLOY_VERCEL_RENDER_GITHUB.md
├── .gitignore
└── README.md
```

## Quick start on Windows with VS Code

1. Open the entire `LakeWatch-Laguna-Fullstack` folder in **VS Code (Windows/local)**.
2. Open terminal, run `cd backend`, `python -m venv .venv`, `.venv\Scripts\python -m pip install -r requirements.txt`.
3. Copy `backend/.env.example` to `backend/.env`. Fill in a random `JWT_SECRET`, an `ADMIN_EMAIL`, and a **unique 12+ character** `ADMIN_PASSWORD`. Keep `.env` out of GitHub. Generate a random secret using `python -c "import secrets;print(secrets.token_urlsafe(48))"`.
4. In the backend terminal run `.venv\Scripts\python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000`.
5. Check `http://127.0.0.1:8000/api/health` and `http://127.0.0.1:8000/api/dataset`.
6. Open the `frontend/index.html` file in VS Code, then **Open with Live Server** (normally `http://127.0.0.1:5500/`). `frontend/js/api-config.js` already points to local FastAPI port 8000.
7. Open **Manage Data**, sign in using the email/password from `.env`, preview a **test-only** reading, and verify that after saving/reloading it becomes visible in all views. Do not label test data as official LLDA data.

Full deployment: **[docs/DEPLOY_VERCEL_RENDER_GITHUB.md](docs/DEPLOY_VERCEL_RENDER_GITHUB.md)**.

## Security and data accuracy

- No backend secret/password belongs in `frontend/`, `api-config.js`, or GitHub. The API URL is **public** and safe to put in the frontend.
- Administrator credentials are created once on the backend with Argon2 password hashing. Credentials are never sent in page data or code.
- Authentication uses **2-hour** bearer tokens kept in the active tab's `sessionStorage`; refresh preserves it, but closing the tab ends that session. Tokens can be stolen by XSS, so only trusted scripts and sources should be used. For a larger production deployment, add a mature identity provider, password-reset flow, a centralized rate limiter, structured migrations, and security reviews.
- CORS is restricted to listed frontend origins; CORS is not authorization. All writes check a signed admin session **on the backend**.
- Every record must contain a real source URL, valid station, parameter, reported value, and sampling month. The backend prevents unapproved corrections and stores a change history.
- Archived station IDs III, VI, VII are **historical references with unverified locations**, not confirmed decommissioned sites. Do not misrepresent approximate coordinates as official GPS values.
- Records such as `<0.1` preserve laboratory reporting limits; they are not zero.
- Original baseline reports remain read-only. The PostgreSQL table contains additions/corrections layered on the baseline and can be backed up from Manage Data.
- If Render goes offline, visitors see a **clearly labeled bundled historical snapshot**; new updates are not possible until the API reconnects.
- Visitors receive an unobtrusive notice when new approved records have been published (polled about every minute); refreshing retrieves the shared dataset.

## Tests

From `backend/`: `python -m pytest -q tests` (install `pytest` and `httpx` if not already installed). This verifies authentication, public read access, protected saves, conflict handling, and shared updates. JS syntax can be checked with Node: `node --check frontend/js/app.js` and similarly for other scripts.

## Deployment warning

**Render Free PostgreSQL expires after 30 days**, so it is not an appropriate long-term shared database. Plan a paid PostgreSQL database or migration/backup. Render free web services may sleep and respond slowly to the first request. Current prices and limits can change.


## Phase 9: Online and Offline Source documentation

Manage Data offers two source citation choices in addition to its three update methods. Online sources require an HTTP(S) URL. Offline sources require title, issuing organization and publication date/year (no URL). See `docs/PHASE9_ONLINE_OFFLINE_SOURCES.md`. The backend applies a non-destructive schema upgrade to existing PostgreSQL records at startup.
