# Phase 9 — Online or Offline Source Evidence

LakeWatch Laguna now supports **two citation types** under **Manage Data**. These source types are separate from the three existing data update methods (manual entry, CSV/Excel file upload, direct online CSV/JSON import).

## Online Source

Choose **Online Source** when the measurement is documented by a web-accessible report, official PDF, or dataset. Provide:
- **Original source URL (required):** `https://...` or `http://...`, pointing to the relevant report or table
- **Report / document title (recommended):** the actual report name

The source URL must be a valid HTTP(S) address. The application does not independently certify that the report contains the claimed reading.

## Offline Source

Choose **Offline Source** when the measurement comes from a verifiable print report, offline laboratory record, thesis, archival report, or document without a public URL. Provide:
- **Report / document title (required)**
- **Issuing organization (required)**
- **Publication date or year (required):** `YYYY`, `YYYY-MM`, or `YYYY-MM-DD`
- **Reference / pages (optional):** report identifier, page/table number, physical archive location

An offline source must not include a source URL. The application stores the citation metadata, not the full scanned report. **PDF or image attachment uploads are not part of this version.** Keep the original document accessible for verification.

The *sampling month* and *publication date* are different: sample month refers to when lake water was measured, while publication date is when the cited report was published.

## How it works

1. Sign in to the **Manage Data** module as administrator.
2. Choose an **Update method**: Manual entry, CSV/Excel, or Online source import.
3. Under **Source documentation**, choose **Online Source** or **Offline Source**.
4. Fill in the source fields, then enter/choose water-quality readings.
5. Select **Preview** and resolve validation errors or conflicts.
6. Save only verified observations. Avoid publishing invented test measurements to the live database.

For CSV or Excel, choose one of the new downloadable templates. A file can include source-type and citation columns per row. If omitted, the form's selected citation type and source fields are used for those rows.

## Data and schema safety

- Existing database observations and audit history are **not deleted**.
- Backend startup adds source citation columns to existing PostgreSQL tables only if they do not already exist. Existing entries default to `online`.
- Online records still require valid URLs, as they did in Phase 8.
- Offline records require documentation; missing or invalid fields are rejected in both frontend and backend validation.
- New provenance is saved to shared PostgreSQL, appears in administrator audit/JSON backup, and is provided with shared observations. Data Explorer CSV export includes source type, title, organization, date, reference and URL.
- This does not add real-time LLDA data feeds or automated official-source authentication.

## Deploy to your existing live site

**Do not upload passwords or .env files to GitHub.** Before deploying changes, download a JSON backup from Manage Data and, if your Render plan supports it, make a PostgreSQL backup.

1. In VS Code, open the existing local `LakeWatch-Laguna-Fullstack` project.
2. Extract **LakeWatch_Laguna_Phase9_Source_Options_Patch.zip**. Copy its `frontend`, `backend` and `docs` contents into the matching project folders; replace those specific files only.
3. In a VS Code terminal at the project root, run:

   ```powershell
   git add README.md frontend/index.html frontend/css/style.css frontend/js/data-manager.js frontend/js/explorer-module.js frontend/js/app.js frontend/data/templates/Import_Template_Blank.csv frontend/docs/MANAGE_DATA_USER_GUIDE.md backend/app/main.py backend/tests/test_source_types.py docs/PHASE9_ONLINE_OFFLINE_SOURCES.md
   git commit -m "Add online and offline source documentation to Manage Data"
   git push origin main
   ```

4. In Render, open the `lakewatch-laguna-api` Web Service. Confirm its latest deployment from `main` is **Live**. Its startup automatically performs an idempotent schema upgrade. Do **not** create a new PostgreSQL database, change `DATABASE_URL`, or reset administrator credentials.
5. In Vercel, confirm the frontend deployment for that Git commit is **Ready**.
6. Open `https://lakewatch-laguna-frontend.vercel.app` and hard-refresh (`Ctrl + Shift + R`). Sign in to Manage Data.
7. Switch between Online Source and Offline Source. Preview one existing published record (without saving) to check validation. If creating a real update, independently verify the source first.

If the backend fails to start during the schema update, inspect Render's logs and preserve the existing database rather than creating a replacement.

## Developer testing

- Backend: `cd backend; python -m pytest -q tests/test_api.py tests/test_source_types.py` (install `requirements.txt` and pytest/httpx first).
- JavaScript: `node --check frontend/js/data-manager.js`.
- The frontend source-selection workflow passed controlled-browser tests. Live Vercel and Render deployment must still be performed and verified by the project owner.
