# Phase 10.3 — User Experience & Navigation Enhancement

**Project:** LakeWatch Laguna  
**Developers:** Ian Titus F. Ramones and Dycyn T. Alvaro  
**Course:** WITM 101 — Advanced Web Design and Programming  
**Program:** Master in Information Technology, LSPU San Pablo City Campus

## Purpose

Phase 10.3 improves the ease of navigation and the clarity of the main workflows without replacing existing application capabilities, changing the Render API contract, or modifying PostgreSQL records.

## Changes included

### 1. Grouped main navigation

The nine existing modules are arranged into task-based groups:

- **Overview** — dashboard landing page.
- **Explore** — Lake Map, Monitoring Stations, Data Explorer and Lake Context.
- **Analysis & Reports** — Analytics and Reports.
- **Administration** — Manage Data.
- **Help & Information** — About & Sources and a direct User Manual entry.

The current group displays the active module. The active module is also shown in a breadcrumb bar, with a module-specific guide button. Dropdown groups support desktop and mobile layouts.

### 2. Task-oriented Overview dashboard

The Overview now displays data-driven summary cards for:

- Stations with recent readings.
- Archived / no recent readings.
- Latest reporting period.
- Monthly reported values.

The latest period and its station coverage are calculated from available sample records, rather than assuming the last configured period always contains observations. A data-status card distinguishes shared database connectivity from offline snapshot use and reminds visitors that water-quality readings are historical/administrator-updated, not live sensor measurements.

Four task cards guide visitors to find a station, explore the map, compare and interpret observations, or create a PDF report. The six parameter color shortcuts remain available.

### 3. Module orientation and help

A breadcrumb identifies the current category and module. The **Guide for this module** control opens the corresponding section of the existing floating, non-modal User Manual. The manual remains non-blocking so the visitor can continue using the main navigation.

### 4. Lake Map station search

A station search field narrows the existing station selector by station identifier, station name or lake bay. Entries without a mapped position remain disabled and are identified as unlocated. The existing map marker and station-selection behavior is retained.

### 5. Guided Manage Data workflow

The administrator workspace now displays four progress steps:

1. Choose method.
2. Document source.
3. Preview & validate.
4. Publish.

The progress state responds to method selection, source edits, validation results and publish readiness. A publish step is not marked current when all rows are unchanged or when invalid rows remain. Existing server-side validation and administrator approval are unchanged.

### 6. Accessibility and responsive refinements

- Clear keyboard focus indicators for buttons, links, form fields and navigation summaries.
- Reduced-motion preference respected for new transitions.
- Responsive navigation menus and task cards.
- Mobile horizontal overflow checked at a 390-pixel viewport.
- Existing Light, Dark and System appearance settings retained.

## Files changed

- `frontend/index.html`
- `frontend/css/style.css`
- `frontend/js/app.js`
- `frontend/js/data-manager.js`
- `frontend/js/user-manual.js`
- `README.md`

No backend files, environment variables, administrator credentials or database schema are changed in this phase.

## Verification performed

- All frontend JavaScript files passed `node --check`.
- Backend regression suite: 5 tests passed.
- HTML identifier check: no duplicate IDs.
- Isolated browser checks covered grouped navigation, breadcrumb updates, module-specific User Manual behavior, navigation while the manual is open, station search filtering, administrator popup login, Manage Data workflow progress, Light/Dark theme switching, and mobile navigation.
- Mobile document width matched the 390-pixel viewport in the isolated test.

The browser test used a local dataset and mocked API responses. It does not constitute a live production test of Vercel, Render, Open-Meteo, Leaflet tiles or the production PostgreSQL database.

## Deployment — frontend-only update

1. Back up the shared observations from Manage Data before any deployment.
2. Extract the Phase 10.3 patch into the existing `LakeWatch-Laguna-Fullstack` project, preserving the folder structure and replacing the matching files.
3. Review the changes in VS Code.
4. From the project root, run:

```powershell
git add frontend/index.html frontend/css/style.css frontend/js/app.js frontend/js/data-manager.js frontend/js/user-manual.js README.md docs/PHASE10_3_UX_ENHANCEMENT.md
git commit -m "Phase 10.3 - Improve navigation and user experience"
git push origin main
```

5. Confirm the Vercel production deployment is **Ready**.
6. Open the live website and refresh with `Ctrl + Shift + R`.
7. Verify grouped navigation, the Overview cards, map search, module guide button and Manage Data progress steps.

Render and PostgreSQL do not need to be redeployed for this frontend-only phase. Keep existing Render environment variables and production credentials unchanged.

## Live verification still required

After deployment, manually confirm:

- Vercel serves the updated frontend and official logo.
- Render connectivity is online and the Overview says **Shared database connected**.
- Lake Map loads its map tiles and station markers; station search filters the locator.
- Manage Data login and publishing still work with the production administrator account.
- Existing historical records, reports and source citations remain available.
- Light, Dark and System modes remain usable on desktop and mobile.

Do not publish invented observations during testing.
