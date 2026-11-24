# Phase 11.3 — Analytics archive and About & Sources cleanup

## Changes
- Removed the redundant **Water-quality parameter colors** card from **About & Sources**. Parameter colors remain available in the rest of the application.
- Fixed the dependent UI code so removal of that card does not cause a JavaScript error.
- Extended the **Analytics → Extended Historical Archive** parameter dropdown to all six parameters from the active dataset.
- For DO, pH, nitrate, and phosphate, only existing monthly readings are plotted; no historic annual results are invented.
- BOD and TSS retain their documented 1990–2000 lake-wide and 2009–2012 station annual measurements, in separate observation series.
- Added transparent coverage messaging when annual records are not imported, and graceful empty-state behavior for stations without observations.
- Improved dropdown label and chart text contrast in Dark Mode and corrected pH units in chart/table labels.

## Why only BOD and TSS appeared before
The additional historical annual records that were imported from ILEC (1990–2000) and LLDA (2009–2012) contain BOD and TSS only. Other parameters are available in the existing October–December 2023 and June 2026 station monthly dataset. Sparse monthly data are not presented as a continuous trend from the 1990s.

## Deployment
This update changes frontend files only. Copy `frontend/index.html`, `frontend/js/app.js`, `frontend/js/historical-module.js`, `frontend/css/style.css` to the same paths in your VS Code project, then commit and push to GitHub to trigger Vercel deployment. No Render backend or PostgreSQL changes are needed.
