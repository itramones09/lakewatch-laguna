# Phase 11.12 — Predictive Water Quality Analytics

Apply over Phase 11.11. Frontend only; no dataset or database changes.

Monthly parameter selector contains all six parameters. Lake-wide annual selector retains BOD and TSS. Observed points appear on a calendar-proportional axis, with gaps unconnected. Qualified values are listed but excluded from regression. Predictions require six or more consecutive exact observations across the selected series; monthly data older than 18 months are withheld. Two-period linear regression estimates are dashed, with holdout MAE and R² when available. Implausible negative or out-of-range pH predictions are withheld. No uncertainty interval or official forecast is implied. Annual extrapolations and elapsed-period estimates are explicitly retrospective.

Print / Save forecast as PDF opens a landscape A4 browser print dialog with chart, data, model diagnostics and source citations where available. No prediction is necessary to export observations.

Testing: verify monthly/annual switching, insufficient data display, annual BOD model, PDF print dialog, and unchanged existing modules after deployment.
