# Data files

- `stations.json`: 16 confirmed June 2026 lake reporting station records with approximate pins, plus III/VI/VII as **unlocated, unverified** registry entries. Six parameters and **186** genuine reported monthly values. Every record includes evidence of official addition year or earliest appearance and a provenance URL.
- `historical-annual.json`: **21 lake-wide** annual averages (1990–2000 BOD / 1990–1999 TSS) + **48 station-level** annual averages (2009–2012, BOD/TSS). Provenance and aggregation differences documented in metadata. Never merge these averages as month-specific observations.
- `lake-schematic.geojson`: clearly labeled approximate shoreline fallback when OpenStreetMap boundary service cannot load. This is not surveyed geography.

Read `docs/HISTORICAL_DATA_METHODOLOGY.md` and `docs/STATION_CHRONOLOGY.md` before adding observations.
