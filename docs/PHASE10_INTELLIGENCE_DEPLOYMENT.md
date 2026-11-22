# LakeWatch Laguna — Phase 10 Environmental Intelligence

**Developers:** Ian Titus F. Ramones & Dycyn T. Alvaro  
**MIT — LSPU San Pablo City Campus | WITM 101**  
**Deployment:** GitHub `itramones09/lakewatch-laguna` → Render API/PostgreSQL + Vercel frontend  
**Deadline:** December 6, 2026

## What changed, and where

| Requested capability | User-facing placement | Data handling |
|---|---|---|
| Water Quality Interpretation Engine | Monitoring Stations → Station Profile | Derived client-side from reported values; no invented lab measurements or automatic safety verdict |
| Station Comparison Dashboard | Analytics → Multi-station comparison | Same parameter and same sampling month; below-limit readings excluded from exact numerical comparisons |
| Professional PDF Report Generator | Reports tab, plus Station Profile/Analytics shortcut | Render `/api/reports/pdf` generates branded PDFs with full source notes; browser fallback available |
| Predictive water-quality analytics | Analytics → Predictive water-quality analytics | Simple linear regression, data sufficiency gate, holdout MAE and R²; historical annual demonstration 1990–2000 is NOT a present-day forecast |
| Environmental incident reporting | Lake Map → Incident reporting and optional incident markers | Admin-authenticated submissions, public dated register, citation details, explicitly not independent LLDA confirmation |
| Expanded environmental datasets | Lake Context tab | Open-Meteo historical precipitation / air temperature; separate admin-curated PostgreSQL records for lake levels, tributary flow, rainfall and temperature |

## Deploy the patch to your existing project

**Your local project root:**

`C:\Users\admin\Downloads\WITM Final Exam Output\LakeWatch_Laguna_Phase8_Fullstack_Vercel_Render_GitHub\LakeWatch-Laguna-Fullstack`

1. Before updating, sign in to **Manage Data** and download the shared JSON backup of existing administrator-approved observations. Save it outside the project and GitHub repository.
2. Download and unzip the **Phase 10 patch**. Copy the `frontend`, `backend`, and `docs` directories into your existing project root. Allow replacement of the matching files. Existing data files, `.env`, credentials and Git configuration should not be replaced.
3. Open the original root folder in VS Code; open its PowerShell terminal.
4. Check `git status`. Do not stage `backend/.env`, `lakewatch_dev.db`, secrets or other private files.
5. Run:

```powershell
cd "C:\Users\admin\Downloads\WITM Final Exam Output\LakeWatch_Laguna_Phase8_Fullstack_Vercel_Render_GitHub\LakeWatch-Laguna-Fullstack"
git add README.md frontend/index.html frontend/css/style.css frontend/js/app.js frontend/js/map-module.js frontend/js/api-client.js frontend/js/intelligence-studio.js frontend/docs/PHASE10_USER_GUIDE.md backend/app/main.py backend/app/assets/lakewatch-laguna-logo.png backend/requirements.txt backend/tests/test_phase10_intelligence.py docs/PHASE10_INTELLIGENCE_DEPLOYMENT.md
git commit -m "Phase 10 - Add environmental intelligence and reporting"
git push origin main
```

6. In **Render**, open `lakewatch-laguna-api` → Deploys / Events / Logs and verify the new commit builds. The build command stays `pip install -r requirements.txt`; the new dependency is `reportlab`, included in `backend/requirements.txt`. No changes are required to your `DATABASE_URL`, `JWT_SECRET`, admin email/password or `CORS_ORIGINS` if the existing Vercel domain remains the same.
7. The API creates two *new* PostgreSQL tables on startup (`environmental_incidents` and `environmental_context_observations`). It does not delete or alter historical readings, observation overrides or the admin account.
8. Test `https://lakewatch-laguna-api.onrender.com/api/health`, `/api/incidents`, `/api/environmental-context`, and `/api/reports/pdf?stationId=I&period=2026-06&parameter=all`.
9. In **Vercel**, verify the Git deployment is **Ready**. Open `https://lakewatch-laguna-frontend.vercel.app` and perform a hard reload (`Ctrl+Shift+R`).
10. Explore the interpretation panel, compare five stations for June 2026, generate a report, open Lake Context, and view the initially empty incident list. For admin actions, sign in to **Manage Data** first in the same browser session.

If frontend deploys before backend, incident/context requests or PDF generation may temporarily fail until Render finishes. This is expected during a rolling deployment; do not enter test events into the public database.

## New API endpoints

| Route | Auth | Details |
|---|---|---|
| `GET /api/incidents` | Public | List administrator-documented incident reports, initially empty |
| `POST /api/incidents` | Admin bearer token | Validate and save an incident with original reference |
| `GET /api/environmental-context` | Public | Retrieve cited environmental context observations, initially empty |
| `POST /api/environmental-context` | Admin bearer token | Validate and save independent environmental readings |
| `GET /api/reports/pdf` | Public | Download source-labeled PDF; query `stationId`, `period`, `parameter`, `includeIncidents`, `includeContext` |

## Data and safety rules

- A **live website** is not equivalent to a **live LLDA water-quality sensor feed**. LakeWatch Laguna's laboratory readings remain dated historical records updated through authorized imports.
- Station coordinates retain their original confidence labels. Incident map symbols use the associated *station location* as context, not an independently surveyed incident coordinate.
- The new incident register begins empty and is not a confirmed official LLDA incident database. Do not enter fabricated demonstrations into the public database.
- Open-Meteo provides historical gridded precipitation and **air** temperature near a lake reference point; it is not LLDA lake temperature, tributary or sampling data. API access can fail; no fake values are substituted.
- Curated lake-level, river/tributary-flow and lake-temperature records are empty until administrators provide appropriately sourced measurements.
- Forecasts require at least six consecutive comparable numeric observations. The provided 2023–2026 monthly series are too sparse to support station-level forecasts. Retrospective trends from 1990–2000 cannot forecast modern 2026 conditions. R² and holdout MAE are diagnostics, not guarantees.
- Parameter identities are color-coded; colors do **not** assert regulatory compliance or water safety. Nitrate and phosphate reporting basis must be checked before comparison to DENR standards.
- Browser print/PDF fallback remains available if the Render PDF endpoint or external jsPDF library is unavailable.

## References

- [LLDA official website](https://llda.gov.ph/)
- [LLDA water quality archive](https://llda.gov.ph/ldb-and-its-tributaries/)
- [Open-Meteo Historical Weather API](https://open-meteo.com/en/docs/historical-weather-api)
- [DENR DAO 2016-08](https://emb.gov.ph/wp-content/uploads/2019/04/DAO-2016-08_WATER-QUALITY-GUIDELINES-AND-GENERAL-EFFLUENT-STANDARDS.pdf)
- [DENR DAO 2021-19](https://r9.emb.gov.ph/wp-content/uploads/2023/09/DAO-2021-19-Updated-Water-Quality-Guidelines.pdf)

## Testing and limitations

Existing Phase 8/9 backend regression tests pass alongside new protected-write and PDF tests. An isolated headless-browser test (with *mocked* external API responses) verifies navigation, parameter switching, comparison rendering, historical forecasting, report preview and responsive Lake Context. It is **not** evidence that the new production deployment is live or that external Open-Meteo and Leaflet requests work from your network. Verify on your actual Vercel and Render accounts.
