## Phase 11.5 — Rotating Photo Gallery and synchronized User Manual

Perspective coverflow, automatic rotation with pause/play, manual navigation, filtered enlarged viewer, reduced-motion support and updated ten-module guide. See `docs/PHASE11_5_ROTATING_GALLERY_AND_MANUAL.md`.

## Phase 11.4 — Direct Photo Gallery, LLDA portal and expanded historical selector

The top navigation now includes a dedicated **Photo Gallery** button. The Wikimedia Commons carousel has moved out of About & Sources, which now provides a prominent official [LLDA](https://llda.gov.ph/) homepage link. The redundant About color-card was removed. Analytics → Extended Historical Archive now lists all six parameters while leaving unavailable 1990–2012 annual measurements blank for DO, pH, nitrate and phosphate. See `docs/PHASE11_4_GALLERY_MENU_LLDA_AND_ARCHIVE.md`.

## Phase 10.3: User Experience & Navigation Enhancement

The main navigation is grouped into task-based categories with a current-module breadcrumb and direct module guide. The Overview dashboard now summarizes dataset coverage, provides task-based shortcuts, and distinguishes shared database connectivity from historical water-quality observations. Lake Map adds station search, and Manage Data displays a four-step guided publishing workflow. This is a frontend-only update; existing API contracts, administrator credentials and PostgreSQL records are unchanged. See `docs/PHASE10_3_UX_ENHANCEMENT.md`.

## Phase 10.2: Floating User Manual & About page

A non-blocking, draggable User Manual window now offers ten module guides, ordered instructions and quick navigation. About & Sources has a top Academic Context card, centered content, dedicated references and organized information cards. See `docs/PHASE10_2_USER_MANUAL_AND_ABOUT_LAYOUT.md` and `frontend/docs/USER_MANUAL_ALL_MODULES.md`. Frontend-only update; existing backend and database remain unchanged.

# LakeWatch Laguna — Phase 10 Full-Stack Environmental Intelligence

**Developers:** Dycyn T. Alvaro and Ian Titus F. Ramones  
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
- Photo Gallery — lake-only Wikimedia Commons photo carousel, search, viewing and source credits
- About & Sources — academic context, official LLDA link, provenance and methodology

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

## Phase 11.6 — Dual Mode
Presentation visibility is session-scoped. See the maintainer notes in docs/PHASE11_7_KEYBOARD_ACCESS.md. Existing administrator authorization remains separate.

## Phase 11.8 data update
See [LLDA dataset expansion](docs/PHASE11_8_LLDA_DATA_EXPANSION.md).

# Phase 11.9 — Partial LLDA archive expansion

Imported Q1 2020 (9 stations, 5 parameters, 135 readings; TSS absent from the lake tables) and Q1 2026 (16 stations, 6 parameters, 288 readings). Manually transcribed from official PDF page images. Existing 366 observations preserved; 789 monthly + 69 annual = 858. Source links and PDF page numbers are recorded for new observations.

- Q1 2020: https://llda.gov.ph/wp-content/uploads/dox/waterqualityrpt/2020/2020q1.pdf (PDF pages 2–3)
- Q1 2026: https://llda.gov.ph/wp-content/uploads/2026/waterqlty/1Q2026%20Scanned.pdf (PDF page 2)

Remaining quarterly reports have not been transcribed. Q2 2026 retrieval timed out; existing June values retained. Archive Q3/Q4 2026 links duplicate 2025 links and must not be treated as 2026. Q2 2020 is not linked. No continuous coverage is claimed.

Archive: https://llda.gov.ph/ldb-and-its-tributaries/
