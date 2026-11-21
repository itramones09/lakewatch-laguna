# LakeWatch Laguna — Manage Data User Guide

## What's new

A new **Manage Data** module supports three update methods:

1. **Manual entry:** choose an existing monitoring station, month, water-quality parameter, and reported value. Supply the original source URL and reviewer name; click Preview, inspect validation, then Save.
2. **CSV / Excel / JSON file upload:** choose a `.csv`, `.xlsx`, `.xls`, or `.json` file. Click Preview uploaded file; verify the rows, then Save. Excel parsing uses SheetJS via the online CDN; CSV and JSON parsing work without that dependency.
3. **Online source import:** provide a **direct CSV or JSON URL**. The site must allow cross-origin browser requests (CORS). Click Fetch and preview URL, check the records, and Save. HTML pages, PDF reports, protected websites, and server-generated pages that block CORS are not accepted automatically.

### CSV template

Select **Manage Data → CSV / Excel upload → Download CSV template**, or use this header:

```csv
Station ID,Month,Parameter,Reported value,Unit,Official source URL
I,2026-07,do,7.4,mg/L,https://example.org/source-report
```

The example row is **illustrative**, not an LLDA measurement. Delete/replace it before a real import. Month must be `YYYY-MM`. Parameter IDs are `do`, `bod`, `ph`, `nitrate`, `phosphate`, `tss`. Station IDs must match an existing station (e.g., `I`, `II`, `IV`, `XXIV`). Values may be a nonnegative numeric value or a detection-limit notation such as `<0.1`. Keep the measurement's original unit; the app checks it against the parameter's existing unit.

You may also upload the CSV exported by the Data Explorer: its headings (`Station ID`, `Month`, `Parameter`, `Reported value`, `Unit`, `Official source URL`) are recognized.

### JSON format

Supply an array of observation objects or an object with a `readings` property:

```json
[
  {
    "stationId": "I",
    "period": "2026-07",
    "parameter": "do",
    "value": "7.4",
    "sourceUrl": "https://example.org/source-report",
    "editor": "Data Reviewer"
  }
]
```

The values are examples only. An exported LakeWatch JSON backup includes an array under `readings` and can be re-imported via the File method to transfer values. This re-import recreates readings; the audit trail from the other browser is not automatically merged.

### Validating imports

- **New**: this station/month/parameter combination is not in the active dataset.
- **Correction**: a different value already exists at that same station/month/parameter. You must explicitly check **Allow corrected values** to approve overriding the displayed value.
- **Unchanged / duplicate**: an identical record is already present and won't be added again.
- **Invalid**: missing or malformed ID, month, value, source URL, reviewer, unit mismatch, or repeated key in the same batch. Invalid rows block saving the whole batch; fix and preview again.

The app validates structure and provenance fields, **not scientific truth or source authenticity**. A reviewer must compare the readings to the original official report.

### Where updates go

Approved data are stored in **this browser's localStorage only**, under `lakewatch-user-observations-v1`. The original `data/stations.json` and historical annual JSON are unchanged. On reload, the app merges local values into the current dataset. Updates then appear in station profiles, map popups, Data Explorer, analytics, and CSV exports. New months appear in period selectors. The Active/Archived groups reflect data availability within 12 months of the latest imported reporting month, **not an official LLDA operational decision**. Unverified/unlocated station identifiers remain unlocated, even when data are imported.

### Backing up and moving data

1. In Manage Data, choose **Download JSON backup**.
2. Keep that file in a safe place. Browser clearing, incognito browsing, using another browser, or moving computers may lose locally stored changes.
3. On another computer, open the app, choose **CSV / Excel upload**, upload the JSON backup, review, and save.
4. **Remove local updates** clears only browser-stored observations and restores the bundled base dataset (confirmation required). Back up first.

### Important limitations

- **No actual administrator authentication** is implemented. This is an academic local-editing prototype. Anyone with access to the local browser profile can change its displayed data. A published multi-user system needs real authentication, authorization, server-side validation, a database, and audit logging.
- Updates are **not shared automatically** with another user, another browser, the application ZIP, or LLDA.
- Imports from public HTTP(S) URLs do not turn LakeWatch into a real-time data stream; only data available at that URL are fetched, on demand.
- Direct LLDA report web pages and PDFs generally require manual extraction/formatting into CSV before importing. Do not represent online URL import as verified LLDA API access.
- Parameter measurement units must be confirmed against the original source; numeric comparisons to standards require matching reporting bases.
- The existing 186 base monthly observations plus 69 historical annual values are preserved as project source records. Imported observations add to, or locally overlay, that dataset.
