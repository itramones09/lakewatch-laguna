# LakeWatch Laguna — User Manual

**Project:** Water Quality Monitoring & Visualization, Laguna de Bay  
**Developers:** Dycyn T. Alvaro and Ian Titus F. Ramones  
**Program:** Master in Information Technology (MIT)  
**Institution:** Laguna State Polytechnic University – San Pablo City Campus  
**Course:** WITM 101 — Advanced Web Design and Programming

## Open and navigate the built-in manual

1. Open the LakeWatch Laguna website, then select **Help & Information → Open User Manual**.
2. The guide appears in a **floating non-modal window**. The normal website navigation remains usable while the guide is open. No page change or login is required to read the manual.
3. Select a module from the manual's **horizontal menu at the top**. The instructions for that module appear underneath.
4. Clicking a module in the **main website menu** automatically displays the matching guide while the manual remains open.
5. Manual tabs can also be selected independently. Click **Open [module] module** at the bottom to switch the main page to that module.
6. Use **−** to minimize, **×** or **Escape** to close, and the restore button to reopen a minimized manual. On desktop, drag the header to move the window.

The manual deliberately does **not** disable, dim, or block the main webpage. On small screens, minimizing the guide may provide more room to explore the app.

---

## 1. Overview

**Purpose:** Entry point for coverage, parameter identity and major workspaces.

1. Read the overview tiles for monitored lake, number of parameters, active/archived counts and imported monthly readings.
2. Click a color-coded parameter tile to open its charts in **Analytics**.
3. Use the feature launchpad to open **Compare & Predict**, **Lake Context**, **Reports** or **Incident Watch**.
4. Use Explore, Analysis & Reports, Administration and Help & Information, or the direct **Photo Gallery** button. The breadcrumb identifies the current module.
5. Use the header sun/moon button to toggle light and dark appearance.

**Note:** Parameter colors identify the type of reading; they are not water-quality ratings.

## 2. Lake Map

**Purpose:** Geographic context, station navigation and documented incident records.

1. Choose **Reporting month** and **Parameter shown on markers** in Map Controls.
2. Click a labeled station tag, or select **Go to monitoring station**.
3. Inspect its reading in **Selected Station**, and click **Open Station Profile** for details.
4. Toggle **Show lake boundary**, **Show station markers** and **Show documented incident locations**.
5. Click **Reset Map View** to return to the full lake region.
6. Use **Find a station**, Street/Satellite and Expand map to locate and inspect stations; Escape exits the expanded map.
7. Scroll to **Incident reporting** to browse documented events. An administrator can sign in, provide an incident date/category/description/reference, and publish a sourced report.

**Location limitation:** Some station tags have published research coordinates; others have approximate area-level positions. These are not certified LLDA sampling GPS coordinates. Incident markers indicate a monitoring area, not a surveyed event location.

## 3. Monitoring Stations

**Purpose:** Station directory, month-specific parameter readings and interpretation.

1. Choose **Active Stations** or **Archived Stations** in the left directory.
2. Search by station identifier or lake bay, then select a station.
3. Choose **View measurements from** to set the reporting month.
4. Read the six parameter cards and **Parameter Interpretation** explanation.
5. Expand **Station history and location sources** to see provenance, establishment evidence and coordinate qualifications.
6. Use **Export station PDF report** or **Find station on map** where available.

**Terminology:** "Archived" means no recent imported data and **does not** confirm official closure. Below-limit readings such as `<0.1` are not zeros.

## 4. Analytics

**Purpose:** Trends, matched-date comparisons, historical context and cautious predictive analytics.

1. Select a **Monitoring station**, **Water quality parameter** and **Comparison month** in the main analytics toolbar.
2. Review the trend and comparison charts; expand **View exact station values** to see labels not plotted as exact numeric values.
3. In **Extended Historical Archive**, choose any of the six parameters and a station. BOD/TSS additionally have imported annual records; other parameters show available monthly values only. Data gaps are not interpolated. The selector includes DO, BOD, pH, nitrate, phosphate and TSS. Lake-wide annual (1990–2000), station annual (2009–2012) and station monthly (2023 / June 2026) series are distinct. Expand the plotted source readings and Historical data sources to check coverage.
4. In **Multi-station comparison**, choose a parameter and reporting month. Select station checkboxes manually or use **Select All with Readings**. Use **Unselect All** to clear the selection.
5. Under **Predictive water-quality analytics**, select dataset/parameter/station and click **Evaluate forecast**. When data are insufficient, the tool displays an explanatory limitation instead of a prediction.
6. Use **Station Profile**, **Show on Map**, and **Export PDF** to continue to other modules.

**Interpretation:** Compare only compatible units and matching dates. Predictive outputs are not official LLDA forecasts.

## 5. Data Explorer

**Purpose:** Detailed table of imported observations, with filters and export.

1. Filter by **Monitoring station**, **Parameter**, **Reporting month** and **Reading classification**.
2. Use **Search records** to find matching station IDs, bays, months or readings.
3. Click column headings to sort records; adjust **Rows per page** and the previous/next controls.
4. Click **View** on a row to open the selected station profile.
5. Click **Export Filtered CSV** to download all matching records.
6. Use **Clear All Filters** to return to the full imported record set.

**Data quality:** Reported labels such as `<0.1` are retained; do not interpret them as exact values.

## 6. Lake Context

**Purpose:** Atmospheric reference information and curated environmental datasets.

1. Read the precipitation, mean **air** temperature and weather-day summary cards.
2. Review the historical **Rainfall and air temperature** chart sourced from Open-Meteo.
3. Click **Refresh weather context** to request available historical weather estimates.
4. Explore **Curated environmental datasets** for separately documented lake level, tributary flow, rainfall, temperature or related records.
5. An authorized administrator can open the header **Admin sign in** popup, enter cited context observation details, and submit a record.

**Important:** Air temperature is not lake water temperature. Atmospheric estimates cannot by themselves establish the causes of a particular lake sample.

## 7. Reports

**Purpose:** Preview and download a source-labeled water-quality PDF.

1. Choose **Report scope** (selected station or all reporting stations).
2. Choose **Monitoring station** if applicable, then **Reporting month** and **Parameter** (or all parameters).
3. Optionally include **incident summary** and **contextual-data summary**.
4. Click **Preview report** to inspect selected data and explanatory notes.
5. Click **Download PDF report** to download the backend-generated report when the API is available.

**Review step:** Verify observations, dates and citations before sharing the PDF. It is not an official LLDA compliance document.

## 8. Manage Data (administrator)

**Purpose:** Approved new measurements, corrections and shared audit history.

1. Click **Admin sign in** in the header, enter your administrator email and password. The popup opens without moving away from your active module.
2. Once signed in, select **Manage Data** from the main navigation.
3. Choose **Manual entry**, **Import CSV / Excel file** or **Import data from URL**.
4. For manual/file data, document the **Original data reference** as either **Online publication** (report URL) or **Offline / printed document** (organization, date and document details). URL imports record their own data URL.
5. Enter the exact measurement, or load a supported dataset. Click the appropriate **Preview** button and inspect the validation table.
6. If the new measurement differs from a published record, review the source carefully and explicitly approve a correction when warranted.
7. Click **Save validated readings** to publish approved observations to the shared PostgreSQL database.
8. Use **Shared change history** and **Download shared JSON backup** to audit and back up changes.

**Security:** Reading data is public, but publishing/correcting requires administrator authentication. Do not save invented measurements or credentials in project files.

## 9. About & Sources

**Purpose:** Project attribution, information architecture, measurement cautions and bibliographic references.

1. Read the top **Academic Context** card for university, degree, course, academic year and tandem developers.
2. Review **Project purpose** and **What you can do**.
3. Click **Visit LLDA official website** below Academic Context to open https://llda.gov.ph/ in a new tab. Parameter colors are explained in Overview; the gallery is a separate main-menu module.
4. Read **Data stewardship** and **Environmental intelligence**; expand **Data methodology & limitations** for historical coverage, station chronology and location confidence.
5. Open the grouped **References & source library** cards for LLDA records, environmental guidelines, geographic tools and weather data.

## 10. Photo Gallery (main navigation)

**Purpose:** Explore real, attributed Laguna de Bay photographs in an animated perspective carousel.

1. Select **Photo Gallery** directly from the top menu bar.
2. The center photo advances every 4.2 seconds while the gallery is visible. Adjacent photos appear in perspective. Hover over the preview to temporarily pause it.
3. Use **Pause rotation** or **Play rotation**. Arrows, keyboard Left/Right when the preview region has focus, or a horizontal swipe rotate the matching collection manually and pause autoplay. The collection wraps around.
4. Filter by **All photos**, **Lake views**, **Lakeside life**, or **Sunsets**, or search loaded photographs. These actions pause rotation; use Play rotation to resume.
5. Use **Load more photographs** to retrieve further lake-focused Commons images. Retry if the external service is unavailable.
6. Select the center photo to open an enlarged viewer. Browse matching photos using its arrows or keyboard Left/Right; close with Escape or the close button. Opening a photo pauses rotation.
7. Review the photographer, original file page and reuse license. Visit the Wikimedia Commons collection link for further source information.

**Accessibility and connectivity:** Autoplay is initially off when reduced motion is requested. Photos are externally hosted, including the featured fallback URLs, and require internet access. Photos are illustrative, not water-quality observations.

## General limitations and source handling

- The website is public and data updates can be shared via the Render/PostgreSQL backend. **This does not make the water-quality measurements real-time LLDA sensor readings.**
- The archive contains selected historical observations only. It is not a continuous record for every year since 1990.
- Station map positions must retain their source/accuracy labels. Unverified historical station identifiers are not assigned invented coordinates.
- A parameter interpretation or forecast is educational decision support, not formal compliance certification.
- Treat any user-published observations and incidents as administrator-sourced data that require independent verification.


