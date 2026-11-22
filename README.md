## Phase 10.3: User Experience & Navigation Enhancement

The main navigation is grouped into task-based categories with a current-module breadcrumb and direct module guide. The Overview dashboard now summarizes dataset coverage, provides task-based shortcuts, and distinguishes shared database connectivity from historical water-quality observations. Lake Map adds station search, and Manage Data displays a four-step guided publishing workflow. This is a frontend-only update; existing API contracts, administrator credentials and PostgreSQL records are unchanged. See `docs/PHASE10_3_UX_ENHANCEMENT.md`.

## Phase 10.2: Floating User Manual & About page

A non-blocking, draggable User Manual window now offers nine top-menu module guides, ordered instructions and quick navigation. About & Sources has a top Academic Context card, centered content, dedicated references and organized information cards. See `docs/PHASE10_2_USER_MANUAL_AND_ABOUT_LAYOUT.md` and `frontend/docs/USER_MANUAL_ALL_MODULES.md`. Frontend-only update; existing backend and database remain unchanged.

# LakeWatch Laguna — Phase 10 Full-Stack Environmental Intelligence

**Developers:** Ian Titus F. Ramones and Dycyn T. Alvaro  
**Program:** Master in Information Technology (MIT), Laguna State Polytechnic University — San Pablo City Campus  
**Course:** WITM 101 Advanced Web Design and Programming

A responsive, color-coded web application for Laguna de Bay monitoring information: station exploration, historical trends, data management, parameter interpretation, station comparisons, cautious linear-trend analysis, source-labeled PDF reporting, environmental incident documentation, and independent weather/lake context.

## Stack

- **Frontend:** HTML, CSS, JavaScript, Leaflet, Chart.js; hosted on Vercel.
- **Backend:** FastAPI with ReportLab PDF rendering; hosted on Render.
- **Shared persistence:** PostgreSQL on Render; existing administrator authentication and LLDA observation audit history remain intact.
- **Source repository:** GitHub.

## Phase 10 navigation

- Overview — lake metrics, parameter colors, insight shortcuts
- Lake Map — geographic station tags, evidence-based incident registry and location overlays
- Monitoring Stations — active/archived station records and interpretation of the six water parameters
- Analytics — charts, historical records, matched-period comparisons and predictive model quality checks
- Data Explorer — sortable/filterable observation dataset and export
- Lake Context — separate atmospheric weather reference (Open-Meteo), cited lake and tributary contextual observations
- Reports — live-rendered reports, source notes and downloadable professional PDF
- Manage Data — existing administrator login, manual/file/URL imports and source documentation
- About & Sources — provenance and methodology

**Start here:** [`docs/PHASE10_INTELLIGENCE_DEPLOYMENT.md`](docs/PHASE10_INTELLIGENCE_DEPLOYMENT.md)

## Important transparency

Live hosting means the website is accessible online and updates are shared through PostgreSQL. It **does not** mean that LLDA laboratory readings are acquired in real time. The supplied monthly and annual datasets contain historical, non-continuous observations. Never use an exploratory trend estimate or a single parameter measurement as a water-safety certificate.

### Developer test commands

```powershell
cd backend
python -m pip install -r requirements.txt
$env:LAKEWATCH_DEV_MODE="1"
$env:JWT_SECRET="a-random-local-development-secret-at-least-32-characters"
$env:ADMIN_EMAIL="your-admin-email@example.org"
$env:ADMIN_PASSWORD="strong-local-password-not-for-production"
python -m uvicorn app.main:app --reload
```

For production, follow the deployment guide and keep existing Render secrets; never commit `.env`.

### Phase 10.5 lake-only map UI update
The lake-only map now uses a wider map-first layout, Street/Satellite basemap buttons, and an expanded view. The global User Manual replaces the redundant per-module guide link. See `docs/PHASE10_5_LAKE_ONLY_MAP_UI.md`.
