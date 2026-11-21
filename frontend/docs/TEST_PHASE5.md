# Phase 5 — Testing checklist

Open `index.html` in VS Code using **Live Server**. Internet access is needed for live OpenStreetMap tiles and the external Leaflet/Chart.js libraries.

## Desktop

1. Overview shows 6 distinct parameter shortcuts (DO blue, BOD orange, pH violet, nitrate green, phosphate magenta, TSS ochre).
2. Click pH on Overview: Analytics opens with the pH parameter selected and both charts use violet. Change to phosphate: charts become magenta.
3. Open Lake Map: 16 marker tags should appear. Switch parameter and confirm the outer outline changes color while location-confidence interiors stay teal/amber. Click station tags and locator to check profiles. No tags are created for III, VI or VII.
4. Open Monitoring Stations: 16 Active and 3 Archived. Station profiles display six clearly labeled color-coded cards. Missing readings remain labeled rather than simulated.
5. Open Data Explorer: total 186 reported values. Filter to nitrate and check green badges on the filtered rows; sorting and CSV export still work. CSV data remains raw source values.
6. Analytics historical archive: BOD should have orange series, TSS ochre series; solid/dashed/dotted line styles distinguish lake-wide annual, station annual and monthly observations.
7. Select Light, Dark and System; all six colors stay distinguishable, text remains legible and preference persists after browser reload.

## Mobile

8. Resize browser to 390px. Parameter shortcuts form two columns; six station reading cards stack; navigation scrolls horizontally. No page-level sideways scroll.
9. Confirm keyboard Tab focus rings, screen-reader-friendly data tables, color labels, and reduced motion preference.

## Validation limitations

The programmatic controlled-DOM smoke test validated the six color keys, cross-module navigation, historical SVG chart rendering, 16/3 status filters, 186 records, Dark mode, and 390px layout without JavaScript page errors. That environment did not load external Leaflet or Chart.js, so **you must verify real maps, map-marker interaction and Chart.js in Live Server**. The study-derived and approximate station coordinate accuracy caveats from prior versions still apply. The app is a classroom visualization, not an LLDA-certified monitoring product.
