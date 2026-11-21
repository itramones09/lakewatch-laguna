> **Note (Phase 4):** This file documents the earlier Phase 3 design; the active Phase 4 datasets also include all 16 stations and June 2026 readings. See `OFFICIAL_STATIONS_AND_DATA.md` for current coverage.

# Data sources, definitions and geographic limitations

## Historical water-quality measurements

**Publisher:** Laguna Lake Development Authority (LLDA), Environmental Laboratory and Research Division  
**Document:** Quarterly Water Quality Report, Laguna Lake and Tributary Rivers, October to December 2023  
**URL:** https://www.llda.gov.ph/wp-content/uploads/dox/waterqualityrpt/2023/q4_2023.pdf

Selected stations (official IDs and names):

- Stn. I — Central West Bay
- Stn. II — East Bay
- Stn. IV — Central Bay
- Stn. V — Northern West Bay
- Stn. VIII — South Bay

The first table in the report contains the BOD and DO readings. The second lake-station table contains pH, nitrate, inorganic phosphate and total suspended solids (TSS) readings. The app preserves three monthly observations per station, October/November/December 2023.

**Units:** DO, BOD, nitrate, phosphate and TSS in mg/L; pH is unitless. Values like `<0.1` are report notation indicating a value below a reporting threshold, not a measured exact 0.1 or 0.0. The application stores the original string.

## Geographic geometry

**Primary map:** OpenStreetMap tiles, credited in Leaflet controls.

**Shoreline lookup:** OSM relation 79348 (Laguna de Bay) via Nominatim GeoJSON polygon lookup. It is requested once when the map initializes, and is not bundled because the project was created in a network-restricted environment. The app draws a local **approximate schematic** while awaiting the lookup. If the service cannot be reached, the schematic remains in dashed amber, with its limitation stated on screen.

**Schematic outline:** `data/lake-schematic.geojson` is a simple manually interpreted tracing of the shape seen in an LLDA monitoring-station map. **NOT** official survey geography; **NOT** suitable for measuring area or determining water boundaries.

**Station locations:** `data/stations.json` includes `coordinateAccuracy: "illustrative"` and `coordinateNote` fields for each station. Coordinates were set to representative positions within the corresponding lake bay and **must not be presented as LLDA station GPS fixes**. Report station descriptions establish the monitored bay, not exact latitude/longitude. Replace with documented official GPS coordinates before calling them exact.

## Licensing and disclaimers

The lake geometry and basemap, when displayed, come from OpenStreetMap contributors (ODbL); keep visible attribution. The LLDA data is cited to its original report. This student software is **not affiliated with or endorsed by LLDA**.


## November 20, 2026 historical expansion

See `HISTORICAL_DATA_METHODOLOGY.md` and `STATION_CHRONOLOGY.md` for the newest 1990–2026 historical scope, 186 monthly + 69 annual values, and the unverified III/VI/VII location caveats. This section supersedes earlier statements that the dataset has no values before 2023.
