# Phase 11.11 — All-station analytics graph

Adds independent monthly/quarterly/annual filters, six parameter toggles, actual and min–max scales, SVG chart, source-value table and landscape browser print/PDF report. Uses the same dataset loaded by the app (backend or snapshot). Monthly upper limits are marked with hollow points and dashed segments; aggregated means exclude qualified measurements. Missing values break lines. Normalization omits constant/no-exact series. Existing analytics and Reports remain unchanged. No backend changes.

Apply patch to project root. Test monthly June 2026, normalized nitrate omission, quarterly coverage, parameter toggles and browser print/save PDF.
