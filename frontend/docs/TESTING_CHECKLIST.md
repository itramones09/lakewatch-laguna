# LakeWatch Laguna — Phase 4 verification checklist

## Automated checks performed in controlled browser

- [x] JSON syntax and station counts: 16 documented LLDA Q2 2026 lake station IDs.
- [x] 186 real historical reported values from included samples (90 + 96).
- [x] Data Explorer: 186 default reported observations.
- [x] June 2026 filter: 96 readings for 16 stations, six parameters each.
- [x] June 2026 nitrate: 16 values labeled `<0.1` below reporting limit.
- [x] Station XXIV: six June 2026 values.
- [x] December 2023 Station XXIV: correctly labeled no reported station data.
- [x] Missing-record filter reveals unavailable historical cells without fabricated readings.
- [x] CSV export invokes a downloadable file with the filtered data and source column.
- [x] Analytics: 16 comparison rows, selected station pH value and SVG fallback.
- [x] Light / Dark / System theme switching, with no browser script errors.

## Perform in the user's networked Chrome/Edge browser using VS Code Live Server

- [ ] Confirm official project logo loads (asset is included in ZIP).
- [ ] Confirm Leaflet map tiles load with required OpenStreetMap attribution.
- [ ] Confirm live OpenStreetMap shoreline geometry if public service responds; otherwise verify schematic is labeled approximate.
- [ ] Confirm all 16 clickable map markers and updated popups.
- [ ] Confirm Chart.js CDN renders, with 16 station bars; if blocked verify SVG fallback.
- [ ] Select Dark, reload browser: verify preference persists. Choose System and change operating-system appearance: verify follow-the-device works.
- [ ] Download Data Explorer CSV and open in Excel. Confirm `<0.1` retained, source URLs included, and column values match screen.
- [ ] Repeat at desktop width and 390px mobile screen.

**Important:** The controlled automated browser cannot access local Live Server in this environment; an in-memory DOM browser test was used instead. Do not claim full networked/browser map functionality was tested.
