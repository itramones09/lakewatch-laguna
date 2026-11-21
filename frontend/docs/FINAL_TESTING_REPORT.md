# Phase 6 — Final Testing and Limitations

**Build:** LakeWatch Laguna Phase 6, November 20, 2026.  
**Test environment:** headless Chromium with local JavaScript/CSS and JSON injected into a controlled DOM. External map and chart services are not fully reachable in this environment.

## Automated functional checks

**32 of 32 checks passed**; **0 uncaught JavaScript page exceptions** in the controlled browser harness.

Tested categories:

| Area | Checks performed | Result |
|---|---|---|
| Overall layout | Six views; removed visible layout teaching labels; project logo | Passed |
| Overview | 186-record total, six parameter shortcuts, quick module navigation | Passed |
| Stations | Six parameter cards, 16 Active and 3 Archived, expandable station sources | Passed |
| Analytics | Navigation, chart fallback, historical SVG chart, collapsed source list | Passed |
| Explorer | 186 observations, parameter filtering, CSV export | Passed |
| About | Methodology disclosure, external references and team credits | Passed |
| Map controls | Map region, locator and parameter selection connected to shared state | Passed in simulated browser |
| Themes | Light, Dark and System selection | Passed; browser reload persistence needs local-host verification |
| Responsive | No page-level horizontal overflow across all six modules at 390px width | Passed |

An individual per-check JSON log was generated during development and verified before packaging. The log is not required at runtime. Screenshots of non-map modules are provided in `docs/screenshots` for presentation reference.

## Items still requiring developer verification with Live Server and internet

- [ ] Real Leaflet map tiles display correctly and attribution is visible.
- [ ] Every mapped station tag opens its popup and can be selected by the station locator; close-together markers remain clickable.
- [ ] OSM shoreline loads where permitted, or a schematic fallback is correctly labeled.
- [ ] Chart.js charts render with a working CDN connection; built-in SVG fallback remains available if CDN fails.
- [ ] Appearance choice survives closing/reopening the real browser tab and System tracks device theme changes.
- [ ] All external data-source URLs still work from the target network.
- [ ] A final Chrome/Edge and tablet/mobile test is performed on the actual submission device.
- [ ] Published deployment URL, if chosen, is checked after publishing.

## Data integrity checks

- Station records: 19 identifiers (16 with June 2026 data + 3 unverified archive identifiers).
- Six parameter types in the selected monthly dataset.
- 186 reported monthly values across 2023 Q4 and 2026 June.
- 21 lake-wide annual values and 48 station annual values (69 historical annual observations).
- 255 historical source-reported values across all three reporting methods.
- Non-numeric reporting-limit values retain their original qualifiers; absent values are not invented.

## Known limitations

The 1990–2026 timeline is **not continuous**. Stations III, VI and VII lack independently verified mapped positions. Seven station markers remain approximate, while nine published-coordinate positions are not certified official LLDA GPS fixes. LLDA data are dated publications rather than a verified public live water-quality API. The display is an educational interpretation aid, not a compliance or health assessment.
