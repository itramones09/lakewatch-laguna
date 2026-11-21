# LakeWatch Laguna — WITM 101 Final Examination

**Interactive Water Quality Monitoring and Visualization System**  
**Developers:** Ian Titus F. Ramones and Dycyn T. Alvaro  
**Program:** Master in Information Technology (MIT)  
**Institution:** Laguna State Polytechnic University — San Pablo City Campus  
**Submission deadline:** December 6, 2026

## Launch locally in VS Code

1. Extract this project ZIP and open the `LakeWatch-Laguna-VSCode-Phase6` folder in Visual Studio Code.
2. Install the **Live Server** extension if necessary.
3. Right-click `index.html` and choose **Open with Live Server**.
4. Open the local HTTP address in Chrome or Edge, such as `http://127.0.0.1:5500/`.
5. Use the navigation at the top to explore the six modules.

**Important:** Do not open `index.html` using a `file:///` address. Browsers may block `fetch()` for local JSON files. Connect to the internet for Leaflet, Chart.js, OpenStreetMap tiles and the shoreline geometry service. A separate SVG chart fallback is available if Chart.js cannot load. Historical data files are packaged locally.

## Modules and their web design layouts

| Module | Layout | Main actions |
|---|---|---|
| Environmental Overview | KPI dashboard | View record counts and select color-coded water parameters |
| Interactive Lake Map | Holy Grail | Inspect lake area, change parameters or months, select station tags |
| Monitoring Stations | Two-column master/detail | Filter Active/Archived, search, review station profiles |
| Water Quality Analytics | Chart grid dashboard | Compare station values, inspect short- and long-term chart series |
| Data Explorer | Split filter/table | Filter, search, sort, paginate and export CSV |
| About & Sources | Single-column reading | Review citation links, methods, limitations and team credits |

Visible module labels and repeated development commentary have been removed. Only concise instructions remain; detailed station evidence and data methods appear in expandable sections.

## Dataset and interpretive limits

- `data/stations.json` contains **19 registry identifiers**, with **16 Active entries** (June 2026 observations imported) and **3 Archived entries** (no observations in that month). These status labels refer to **data availability**, not LLDA's official operating or closure status.
- The selected LLDA reports provide **186 monthly parameter values**: 90 from October–December 2023 and 96 from June 2026.
- `data/historical-annual.json` contains **21 lake-wide annual parameter values from 1990–2000** and **48 annual parameter values for station areas from 2009–2012**.
- The total archive is **255 reported parameter values**, not 255 continuous monthly measurements. Missing years are not filled in. Values such as `<0.1` are treated as below a reporting limit, not exact measurements.
- The interactive map contains 9 stations with published academic coordinate references, 7 approximate station-area markers, and 3 historic identifiers that remain unlocated. **None are certified official LLDA survey coordinates.**
- Station establishment dates should not be fabricated. Original stations are documented by 2009; some additions were reported for 2012 and 2021. See `docs/STATION_CHRONOLOGY.md`.
- The app displays **historical information, not a live LLDA sensor feed**, and is **not an official LLDA application**.
- Blue, orange, violet, green, magenta and ochre identify the **parameter type**, not compliance or water safety.

## Project structure

```text
LakeWatch-Laguna-VSCode-Phase6/
├── index.html                       Application shell and six layouts
├── assets/
│   └── lakewatch-laguna-logo.png    Project logo
├── css/
│   └── style.css                    Responsive themes and parameter palette styling
├── js/
│   ├── app.js                       Navigation and station selection state
│   ├── parameter-palette.js         Shared palette legend / badges
│   ├── map-module.js               Leaflet map, boundary and markers
│   ├── analytics-module.js         Parameter trend and station comparison
│   ├── historical-module.js        Long-term annual / monthly chart
│   ├── explorer-module.js          Filtered data table, sorting and CSV export
│   └── theme-module.js             Light, System and Dark settings
├── data/
│   ├── stations.json               186 monthly observations and registry metadata
│   ├── historical-annual.json      69 annual reported values
│   ├── station-coordinate-register.csv
│   └── lake-schematic.geojson      Explicitly approximate offline shoreline fallback
└── docs/                             Data sources, tests, deployment and final report
```

## Final documentation

- [Final project report](docs/FINAL_PROJECT_REPORT.md)
- [Phase 6 testing and limitations](docs/FINAL_TESTING_REPORT.md)
- [Deployment guide](docs/DEPLOYMENT_GUIDE.md)
- [Final submission checklist](docs/SUBMISSION_CHECKLIST.md)
- [Presentation walkthrough](docs/DEMONSTRATION_SCRIPT.md)
- [Station coordinates and status](docs/STATION_COORDINATES_AND_STATUS.md)
- [Primary data sources](docs/DATA_SOURCES.md)

## Credits and license caution

LakeWatch Laguna is an academic project by the tandem developers. Map tiles are provided by OpenStreetMap contributors and require their attribution, which Leaflet displays. LLDA and ILEC report links are acknowledged under About & Sources. Do not reuse third-party trademarks, maps or reports beyond their applicable rights and terms.

---

## Manage Data — three update methods

Open **Manage Data** from the top navigation (also accessible from **Data Explorer**).

- **Manual entry:** choose station, month, parameter and reported value; enter reviewer name and original source URL.
- **File upload:** CSV, XLSX, XLS or JSON. Download the provided CSV template to see the required columns. Excel files use an external spreadsheet library and require internet access; CSV/JSON need no spreadsheet dependency.
- **Online import:** fetch a direct JSON/CSV URL if the website allows CORS. PDFs and ordinary HTML pages cannot be automatically parsed in this static application.

Every method uses a **Preview → Validate → Approve → Save** workflow. Existing values are not changed without explicit correction approval. Accepted readings are merged into all modules on page reload. The app retains the originally bundled LLDA source datasets as-is.

**Storage:** Accepted changes are stored in the **current browser profile's localStorage only**, not in a shared database or the original source files. Download the JSON backup before clearing browser data or moving computers. To restore on another computer, import that JSON using the file method. This prototype **has no real admin authentication**, does not automatically publish user edits and does not provide a verified real-time LLDA feed.

For the complete steps and CSV/JSON formats, see [docs/MANAGE_DATA_USER_GUIDE.md](docs/MANAGE_DATA_USER_GUIDE.md).
