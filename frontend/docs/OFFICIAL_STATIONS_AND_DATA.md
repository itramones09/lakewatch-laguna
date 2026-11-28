# Official LLDA lake monitoring stations and data

## Network size

The LLDA 2024 annual report refers to 15 lake water-quality monitoring stations. Its **April–June 2026 quarterly report lists 16** lake water-quality sampling stations, including **Station XXIV (Cardona – North Central Bay)**. The station IDs are I, II, IV, V, VIII, XIII, XV, XVI, XVII, XVIII, XIX, XX, XXI, XXII, XXIII, XXIV. The IDs III, VI and VII do not appear in that report's active lake station table. Do not create fictitious station entries to fill gaps.

**2026 source:** https://llda.gov.ph/wp-content/uploads/2026/waterqlty/2Q2026%20WATER%20QUALITY%20REPORT.pdf (page 2; June columns)

**2023 archive:** https://www.llda.gov.ph/wp-content/uploads/dox/waterqualityrpt/2023/q4_2023.pdf

Six selected parameters per station: BOD, dissolved oxygen, pH, nitrate, phosphate and total suspended solids. The 2026 file supplies all 16 stations for June 2026. The 2023 records now cover all 15 lake stations listed in Q4 2023; the June 2026 observations are retained from the earlier release. Missing historical readings are intentionally marked missing, never copied from another date.

## Live-data status

No verified public LLDA real-time API for these six water-quality parameters was found. LLDA also operates real-time **lake-level and hydrometeorological** sensors, which are different information products. This app does not claim to display live sensor data. It presents a published and dated historical snapshot. Additional official reports can be transcribed into data/stations.json using the same schema and the month added to `periods`.

## Geographic accuracy

Station coordinates are approximate map reference points inferred from official published map diagrams and are **not LLDA survey coordinates**. The optional OSM shoreline layer depends on an external service, and the schematic fallback is labeled.


## November 20, 2026 historical expansion

See `HISTORICAL_DATA_METHODOLOGY.md` and `STATION_CHRONOLOGY.md` for the newest 1990–2026 historical scope, 789 monthly + 69 annual values, and the unverified III/VI/VII location caveats. This section supersedes earlier statements that the dataset has no values before 2023.
