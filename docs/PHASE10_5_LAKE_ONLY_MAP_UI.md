# Phase 10.5 — Lake-only map and navigation cleanup

## Scope
The application continues to show Laguna de Bay lake monitoring stations only. No tributary or river monitoring stations are included. The bundled station directory remains 19 historical/active identifiers: 16 approximate-or-published-coordinate mapped lake stations and three unlocated historical entries (III, VI, VII). Adding more markers without verifiable coordinates would misrepresent location accuracy.

## Changes
- Removed the redundant **Guide for this module** link from the breadcrumb section. The global header **User Manual** remains available.
- Changed Lake Map to a map-first layout: one broad, full-width map card first; map filters and station details follow beneath it.
- Increased map height on desktop; responsive height on narrow screens.
- Added **Street** (OpenStreetMap) and **Satellite** (Esri World Imagery) selection directly inside the map. The selection is stored in localStorage in the current browser.
- Added an **Expand map** button and visible **Close expanded map** control; Escape also exits.
- Made the map invalidate and recalculate size when expanded or returning to its regular view.
- Retained confidence indicators for published research coordinates and approximate location areas. No new station coordinates were invented.
- Preserved the bundled data, authenticated administrator tools, user manual, light/dark theme toggle, and existing Render API configuration.

## Limitations and attribution
Street map © OpenStreetMap contributors, provided as online tiles. Satellite imagery © Esri and imagery contributors. Both basemaps require online network access to the mapping providers; they are not stored in the project. The 16 mapped lake stations include nine research-coordinate locations and seven approximate locations, not certified LLDA GPS coordinates. Three historical station identifiers remain unlocated.

## Live deployment (existing Vercel + Render)
1. Make a copy of your project before overwriting files.
2. Extract the patch and copy its `frontend` and `docs` folders to the root `LakeWatch-Laguna-Fullstack` project, replacing matching files.
3. Run in that project folder:

   `git add frontend/index.html frontend/css/style.css frontend/js/app.js frontend/js/map-module.js frontend/js/user-manual.js docs/PHASE10_5_LAKE_ONLY_MAP_UI.md`

   `git commit -m "Phase 10.5 enlarge lake map and add street satellite controls"`

   `git push origin main`

4. Once Vercel is Ready, hard-refresh your live website. Only frontend changes are necessary; keep Render, PostgreSQL, and administrator credentials unchanged.

## Test checklist
- Global User Manual button remains present; redundant per-page guide is absent.
- Lake Map shows a large map occupying the full content width, with controls and station profile below.
- Street and Satellite buttons toggle selected appearance; selection persists after refresh.
- Expand map displays a larger overlay; Escape and Close expanded map both exit.
- Map zoom/pan, station selection, boundary layer and incident markers still operate.
- The 19 station directory entries are unchanged; no river/tributary stations were added.
- Test in Chrome/Firefox on desktop and mobile width, including Dark mode.

### Validation
JavaScript syntax checks, no-duplicate-ID checks, 5 backend regression tests, and isolated map UI interaction checks at 1440 and 390 pixel viewports passed. The live third-party Leaflet tiles and satellite imagery must still be verified in your internet-connected browser.
