# Manage Data — Updated Source Documentation (Phase 9)

Authorized administrators can add or correct reported water-quality measurements using Manual Entry, CSV/Excel upload, or direct online CSV/JSON import. Approved records are stored in the shared Render PostgreSQL database.

**Source documentation is required. Choose one of these two source types:**

- **Online Source:** provide a valid original report/dataset URL; report title is recommended.
- **Offline Source:** provide the report/document title, issuing organization and publication year/date (YYYY, YYYY-MM or YYYY-MM-DD). A page/table/report reference is optional. No URL is required.

These source types are not the same as the three ways of importing measurements. Both types work with manual entry and file upload; direct online imports can also include records whose original evidence is from an offline document, with proper per-row metadata.

Under Manage Data, choose the update method, choose the source type, fill the relevant fields, and click **Preview**. Review the result and confirm corrections if prompted. **Do not publish unverified test values to your public database.**

The latest source metadata appears in the shared dataset, audit history, JSON backup and Data Explorer CSV. For complete database upgrade and Vercel/Render deployment instructions, see `../../docs/PHASE9_ONLINE_OFFLINE_SOURCES.md`.

PDF attachments are not uploaded/stored in this version; retain and cite the original document yourself.
