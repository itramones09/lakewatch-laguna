# Station placement and reporting-status methodology

LakeWatch Laguna — WITM 101 / MIT, LSPU San Pablo City Campus

## Scope and scientific safeguards

- **16 station IDs have published June 2026 observations** in the imported LLDA Q2 2026 quarterly report. In LakeWatch, these are labeled **Active** *for the latest imported reporting month*, not guaranteed operational today.
- **III, VI and VII** are listed in an **Archived / No recent results** registry. Their distinct existence, physical locations and current status have **not** been independently verified. Archived does not mean officially decommissioned. The app does not pin these identifiers at fictitious locations.
- **9 station locations** have published coordinate values from an academic study of Laguna Lake using LLDA data. These are latitudes/longitudes reported to **2–3 decimal degrees**, which limits accuracy and does not provide surveyed official GPS. Station XV longitude is printed to two decimals (121.09), so its positional rounding may correspond to roughly a kilometer.
- **7 station locations** are mapped to approximate geographic areas based on available LLDA monitoring maps. These tags are amber. Their positions are not LLDA GPS readings; do not use them for navigation, fieldwork or precise measurement.
- **All 186 dated monthly parameter values** and the separate annual archive are retained unchanged.

## Academic-study coordinates (WGS84-style degrees as published)

Source: *Spatial Variability Model for Water Quality Assessment of the Physicochemical Parameters and the Water Quality Index of Laguna Lake and its Tributaries*, Appendix A, station locations (2021), accessible in the ResearchGate full-text transcription:
https://www.researchgate.net/publication/349406848_Spatial_Variability_Model_for_Water_Quality_Assessment_of_the_Physicochemical_Parameters_and_the_Water_Quality_Index_of_Laguna_Lake_and_its_Tributaries

| Station ID | Description | Latitude N | Longitude E |
|---|---|---:|---:|
| I | Central West Bay | 14.420 | 121.181 |
| II | East Bay | 14.226 | 121.334 |
| IV | Central Bay | 14.386 | 121.280 |
| V | Northern West Bay | 14.488 | 121.139 |
| VIII | South Bay | 14.196 | 121.230 |
| XV | West Bay (San Pedro) | 14.386 | 121.09 |
| XVI | West Bay (Santa Rosa) | 14.325 | 121.145 |
| XVII | Fish Sanctuary (Central Bay) | 14.272 | 121.280 |
| XVIII | Pagsanjan (East Bay) | 14.369 | 121.425 |

These coordinates reflect the study's station definitions and may not match later LLDA sampling sites. Source precision is not evidence of survey-grade GPS accuracy.

## Other seven current reporting locations

Stations XIII, XIX, XX, XXI, XXII, XXIII, and XXIV remain approximated from published geographic station maps (see each record's coordinateNote and coordinateSource).

Reference map: LLDA 2022 Annual Report, Water Quality Monitoring station map: https://llda.gov.ph/wp-content/uploads/dox/ar/ar22.v7.pdf

## Why official exact GPS is not claimed

A September 2023 Freedom of Information request explicitly sought LLDA's **sampling-station geographic coordinates and lake boundaries**. LLDA's reply states that a standard *Access to and Use of Information* agreement is required before releasing the data and directs researchers to the relevant LLDA units:
https://www.foi.gov.ph/requests/laguna-de-bay-sampling-station-coordinates-and-lake-boundaries/

For a more precise future release, obtain LLDA's authorized GIS/CSV data, including coordinate reference system, station identifier, validity dates, positional uncertainty and permission to reproduce. Update `data/stations.json` only after verification; then set `coordinateAccuracy`/`coordinateSource` to the new documented evidence. Never replace unlocated stations with arbitrarily chosen coordinates.

## How Active and Archived are calculated

The application computes category from the source JSON at build time:

```
Active: station contains at least one non-null reported water-quality parameter in period 2026-06.
Archived: no parameter value is present for 2026-06 in the application's imported data.
```

Archived is a **project-level data availability label**. It must not be used to assert that LLDA has closed a station. Archived stations can still have older readings if the dataset contains them. A future import with more recent records should recompute this categorization based on the newest available reporting month.

## Marker reliability changes

1. Each station uses a Leaflet marker with a 42×42 pixel clickable target, explicit station ID text, popup and tooltip.
2. Shoreline GeoJSON is set `interactive:false` so it cannot intercept marker clicks.
3. Selected tags gain extra stacking offset and a highlighted outline.
4. A station locator dropdown can zoom to any mapped station when pins are close together.
5. No fictitious map pins are used for unlocated identifiers.
