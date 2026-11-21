> **Note (Phase 4):** This file documents the earlier Phase 3 design; the active Phase 4 datasets also include all 16 stations and June 2026 readings. See `OFFICIAL_STATIONS_AND_DATA.md` for current coverage.

# Phase 3 — Water Quality Analytics: design and data processing

## Why the Analytics module uses a dashboard grid

A wide historical trend chart needs more horizontal space for time-series comparisons. Two smaller dashboard panels below it show cross-station differences and descriptive numbers without overcrowding the trend. CSS Grid automatically switches to single-column cards on small screens. The shared site header/navigation are unchanged from earlier modules.

## Data model

All charts read `data/stations.json`. The model has:

- `metadata`: source, accuracy limitations and historic period.
- `periods`: October, November, December 2023 (`2023-10` to `2023-12`).
- `parameters`: six codes, names, units and meanings.
- `stations`: five LLDA IDs/bays, illustrative map positions and `samples` arrays with monthly `values` objects.

No separate or manually generated chart dataset is stored. The chart series are constructed from the selected station, parameter, and month at runtime. This ensures charts and station profiles remain synchronized.

## Charts

**Line chart:** for the selected station and parameter, use the three monthly values as the three time points. Missing or non-exact results have `null` numeric data points; segments are not connected across gaps.

**Bar chart:** use a single reporting month and parameter; display five station IDs in a common unit. The selected station uses a stronger teal shade. Below-limit reports are not represented as exact bars.

**Parameter summary:** display the original value at the selected station, minimum and maximum of exact numeric results for that month, mean of the exact numeric subset (rounded for display), and fraction of included exact station results. This is a descriptive comparison **only**, not a scientific assessment of lake health or regulatory compliance.

## Handling values such as `<0.1`

The official report notation `<0.1` means the actual result is **below a stated value**, not exactly `0`, `0.05`, or `0.1`. The stored JSON string is preserved. Numeric plotting only accepts numbers and strings consisting solely of a numeric literal (for example, `"0.30"`). Any value with `<`, `>`, or other non-numeric notation is excluded from plots and averages. The literal reading remains visible in the tables, measurement cards and reading summary.

The app does not imply that an excluded value is zero, and it does not claim that the average of exact data represents a full five-station average where censored values are excluded.

## Progressive enhancement and accessibility

- Chart.js 4.4.8 from CDN provides hover tooltips, line and bar rendering, and mobile responsiveness.
- If Chart.js cannot load, the local `analytics-module.js` renders equivalent semantic SVG line/bar charts using the **same exact numeric series**.
- Every chart is accompanied by an expandable HTML table giving source values, units and notes about any point that was not plotted.
- All three filters have visible labels and accept keyboard interaction. The chart summary uses an `aria-live` region for updates.
- Responsive charts and grid layout are tested at both desktop width and 390px mobile width.

## Implementation files

- `index.html`: Analytics section, controls, canvas elements, SVG containers, tables, descriptive notes and module links.
- `js/analytics-module.js`: data parsing, selection, chart data preparation, Chart.js rendering, SVG fallback, statistics and source value tables.
- `js/app.js`: navigation, state synchronization between Analytics, Map, and Monitoring Stations.
- `css/style.css`: responsive dashboard grid, toolbar, cards, tables, chart regions and mobile spacing.

## Limits

Only three monthly periods are included, so a time trend is short and must not be described as a long-term trend. Official station GPS locations have not been verified; markers remain approximate. The dataset is historical LLDA data, not a current monitoring feed. Source report: https://www.llda.gov.ph/wp-content/uploads/dox/waterqualityrpt/2023/q4_2023.pdf.
