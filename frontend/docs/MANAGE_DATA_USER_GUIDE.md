# Manage Data — Phase 9.1 Source Workflow

Authorized administrators can add and correct water-quality observations, subject to server validation and audit logging.

## Step 1 — How to add data

- **Manual entry:** type one station/month/parameter reading and preview it.
- **Import CSV / Excel file:** upload a file and preview rows. File templates are provided.
- **Import data from URL:** fetch a public, direct CSV or JSON URL that allows cross-origin browser access. This is **not** a general webpage/PDF scraper.

## Step 2 — Original data reference

For **Manual entry** and **Import CSV / Excel file**, choose one of:

- **Online publication**: enter an HTTP(S) URL to the original report/data, preferably with its title.
- **Offline / printed document**: enter a document title, issuing organization, and publication year/date. A page/report reference is optional. A URL is not required.

For **Import data from URL**, there is no second source radio group: the directly fetched URL is automatically saved as an **Online publication** reference. Optional report/data title, issuer, publication date and page details may also be entered. If source rows contain citation details they are retained where applicable; the URL you actually fetched is stored as the source URL.

## Validation and preservation

After supplying the appropriate citation, preview records. Check duplicates, existing values, and corrections carefully, then save verified readings. The backend validates all writes and records changes in PostgreSQL.

The method and source are different concepts: manually typing values from an online PDF is **Manual entry + Online publication**, whereas uploading a spreadsheet transcribed from a paper report is **File import + Offline / printed document**.

**Accuracy caution:** Imported figures are not automatically verified by LLDA. Maintain original sources; do not publish unsourced or simulated values as observations.
