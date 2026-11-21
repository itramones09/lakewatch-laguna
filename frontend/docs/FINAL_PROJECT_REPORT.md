# LakeWatch Laguna — Final Technical Project Report

**Course:** WITM 101 — Advanced Web Design and Programming  
**Program:** Master in Information Technology  
**Campus:** Laguna State Polytechnic University, San Pablo City Campus  
**Developers:** Ian Titus F. Ramones and Dycyn T. Alvaro  
**Submission deadline:** December 6, 2026

## 1. Project summary

LakeWatch Laguna is an interactive, responsive web application for exploring publicly reported water-quality observations associated with Laguna de Bay. It combines a geographic map, a monitoring-station registry, parameter-specific charts, a historical archive and a filterable dataset browser. It presents **historical research and agency values** without claiming a real-time sensor connection.

## 2. Objectives aligned with the final examination

1. Integrate a web map using Leaflet and OpenStreetMap background tiles.
2. Display monitoring-station markers with selectable station attributes and reported parameter values.
3. Use JSON datasets and JavaScript to update the application state without page reloads.
4. Visualize selected monitoring parameters using interactive charts and accessible data tables.
5. Apply responsive, readable, accessible layouts appropriate to each module.
6. Document data sources, geographic accuracy limits and interpretation rules.

## 3. Interface and layouts

| Screen | Layout | Rationale |
|---|---|---|
| Overview | Dashboard | KPIs and parameter shortcuts support rapid orientation |
| Lake Map | Holy Grail | Persistent left filters, dominant central map, contextual right detail |
| Monitoring Stations | Master–detail two-column | A station directory remains beside the selected station's measurements |
| Analytics | Responsive chart grid | Large trend chart paired with comparison and summary |
| Data Explorer | Filter/table split | Controls and results are visible together on desktop and stacked on mobile |
| About & Sources | Single-column reading | Long-form documentation stays within a comfortable text width |

Shared design: navy and teal branding, the supplied round project logo, persistent top navigation, consistent typography, six parameter-specific categorical colors, and Light/Dark/System themes. Color is never used as the sole indication of measurement type or status.

## 4. Technical design

The application uses HTML5, CSS Grid/Flexbox, vanilla JavaScript and browser Fetch APIs to read local JSON files served over HTTP. Leaflet displays the basemap, boundary overlay and clickable station tags. Chart.js renders graphical comparisons when available; a built-in SVG fallback supports recent trend and comparison views, while the extended historical timeline is rendered in SVG. No separate database or application server is necessary.

Data modules are separated by responsibility: `app.js` manages navigation and shared state, `map-module.js` manages the Leaflet map, `analytics-module.js` and `historical-module.js` render measurements, `explorer-module.js` handles search/filters/CSV, and `theme-module.js` handles appearance preferences.

## 5. Dataset and source integrity

**Monitoring registry:** 19 identifiers are represented in the application. Sixteen have imported June 2026 parameter readings, and three historical identifiers (III, VI, VII) have no imported recent records and no independently verified site position. “Active” and “Archived” refer strictly to the latest imported dataset, not to agency confirmation of operational status.

**Monthly readings:** 90 values from five stations across three months in Q4 2023 plus 96 values from 16 stations in June 2026, for 186 source-reported measurements in six parameter categories: dissolved oxygen, biochemical oxygen demand, pH, nitrate, inorganic phosphate and total suspended solids.

**Long-term archive:** 21 individual lake-wide annual BOD/TSS values for 1990–2000 and 48 station annual BOD/TSS values for 2009–2012. These are separately sourced and plotted separately from 2023/2026 station-month values. The archive contains **255 reported numeric/qualified parameter records total**, but does not provide continuous monthly coverage for 1990–2026.

**Data handling:** Missing observations remain missing; below-limit readings such as `<0.1` retain their original text and do not enter exact-value chart calculations. The system does not infer drinking-water safety, regulatory classification or compliance from color-coded parameter displays.

**Geographic limits:** Nine markers use published research latitude/longitude that are not official certified GPS fixes; seven use approximate regional placements; the three unverified identifiers are not pinned. When official lake geometry cannot load, the map may display an explicitly labeled approximate schematic. Users should not use the displayed points as survey coordinates.

Primary sources and links are listed in `docs/DATA_SOURCES.md`, `docs/STATION_COORDINATES_AND_STATUS.md` and the application's **About & Sources** module.

## 6. Core workflows

- Overview shortcut → selected Analytics parameter.
- Map station marker / station locator → selected station context → profile.
- Active / Archived selector → directory filtered according to imported June 2026 readings.
- Analytics toolbar → trend, comparison, selected reading and parameter color update.
- Data Explorer → station/parameter/date/status filters → sortable records → full filtered CSV export.
- Appearance selection → Light, Dark or System colors shared by all views.

## 7. Testing and known constraints

The Phase 6 controlled browser harness checked 32 functional and responsive behaviors and reported **32 passing checks with no JavaScript page exceptions**. These checks inject local JSON and JavaScript under a controlled browser environment. They do **not** establish that the external Leaflet tile/shoreline services or Chart.js CDN will load correctly on another network. See `FINAL_TESTING_REPORT.md` for exact scope and local-browser release tests.

## 8. Future improvement opportunities

If authorized information becomes available, replace approximate map points with LLDA-certified site coordinates; add further dated LLDA report extracts; implement a documented data-update workflow; and connect real-time measurements only if a verified authorized API exists.

## 9. Academic declaration

This application is a **university project** and is not an LLDA service. Data origin, dates and geographic confidence are disclosed to avoid misrepresenting public environmental measurements.
