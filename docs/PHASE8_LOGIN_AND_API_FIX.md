# LakeWatch Laguna — Login and API Connection Fix (21 November 2026)

## Fixed
1. Added `id="manager-layout"` to the Manage Data panel. Previously, `data-manager.js` accessed this missing ID during initialization, causing an exception before it could register the administrator login form handler. Submitting the form then refreshed the page and returned to Overview.
2. Configured `frontend/js/api-config.js` to use `https://lakewatch-laguna-api.onrender.com` instead of `http://127.0.0.1:8000`.
3. Preserved the active navigation tab using `sessionStorage`, so reloads after saving do not unexpectedly return to Overview.

## Required Render setting (not stored in GitHub)
Go to Render > lakewatch-laguna-api > Environment > CORS_ORIGINS and set it to exactly:

`https://lakewatch-laguna-frontend.vercel.app,http://127.0.0.1:5500`

If your Vercel deployment has additional domains, add them as comma-separated exact origins (scheme + host only, no trailing slash/path). Save and deploy the change.

## Publishing the fixed frontend
Copy the corrected `frontend/index.html`, `frontend/js/api-config.js`, and `frontend/js/app.js` into the *existing local project folder*, not into a fresh Git repository. Then, from its root, execute:

```powershell
git add frontend/index.html frontend/js/api-config.js frontend/js/app.js
git commit -m "Fix Manage Data login and Render API connection"
git push origin main
```

Wait for the **Vercel dashboard to confirm** that deployment is Ready, then reload your Vercel site with Ctrl+Shift+R.

## Verification
1. Open `https://lakewatch-laguna-frontend.vercel.app/js/api-config.js` — the configured backend should be `https://lakewatch-laguna-api.onrender.com`.
2. Open `https://lakewatch-laguna-api.onrender.com/api/health` — `status` should be `ok`.
3. The yellow “Offline snapshot” banner must disappear once the browser can access the dataset API. If not, check `CORS_ORIGINS` and the Firefox Console/Network tabs (F12) for the failed request to `/api/dataset`.
4. Open Manage Data; sign in with the *email and password you created in Render* (do not share them). The Manual Entry, CSV/Excel, Online Source, and Audit sections should appear without taking you to Overview.
5. Confirm logout and sign-in work. Only upload genuine, cited observations.

## Notes
- Vercel host: `https://lakewatch-laguna-frontend.vercel.app` (from user screenshot). Render API: `https://lakewatch-laguna-api.onrender.com` (health check confirmed in conversation).
- This ZIP does not include database passwords, administrator passwords or JWT secrets. The backend and database require no source-code edits for this fix.
- If the administrator password needs changing, modifying the initial `ADMIN_PASSWORD` environment variable by itself does not update an existing account in PostgreSQL.
