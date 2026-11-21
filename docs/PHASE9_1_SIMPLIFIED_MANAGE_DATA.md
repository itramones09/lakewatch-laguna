# Phase 9.1 — Manage Data UI/UX refinement

This is a **frontend-only change** to Phase 9. It does not alter the PostgreSQL schema, FastAPI validation, administrator credentials, or stored observations.

## Changes

- `Update method` → `How to add data`.
- `Online source` (update method) → `Import data from URL`.
- `Source documentation` → `Original data reference`.
- `Online Source` (reference) → `Online publication`.
- `Offline Source` (reference) → `Offline / printed document`.
- Original reference-type radios appear only for Manual Entry and CSV/Excel Import.
- Direct CSV/JSON URL imports automatically use an online reference and store the fetched URL as the source URL; optional metadata is entered next to that URL.
- Changing the URL or citation invalidates an earlier preview so readings must be reviewed again.
- Per-row citation metadata in CSV/Excel is still supported. No backend data migration is needed.

## Apply to your existing GitHub repository

Extract the patch and copy the `frontend` folder into your existing local `LakeWatch-Laguna-Fullstack` folder, replacing the corresponding four files:

- `frontend/index.html`
- `frontend/css/style.css`
- `frontend/js/data-manager.js`
- `frontend/docs/MANAGE_DATA_USER_GUIDE.md`

Then run from your existing project root:

```powershell
git add frontend/index.html frontend/css/style.css frontend/js/data-manager.js frontend/docs/MANAGE_DATA_USER_GUIDE.md docs/PHASE9_1_SIMPLIFIED_MANAGE_DATA.md
git commit -m "Phase 9.1: clarify Manage Data import and source reference options"
git push origin main
```

Vercel should rebuild the frontend from the latest commit. Render's backend and PostgreSQL are unchanged. No new environment variables are needed.

To test: sign in to Manage Data; switch between all three methods. Manual and File should show Online/Offline citation choices, while URL should hide them and automatically indicate Online publication. Use an existing reading for preview and do not save fictitious observations.
