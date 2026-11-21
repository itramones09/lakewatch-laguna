# Deployment and authorization considerations

This is a **static, client-side** application. The Manage Data user interface is suitable for a coursework demonstration, personal investigation, and local import/export. It is **not** a secure admin dashboard: no identity verification, server authorization, shared database, or centralized audit trail exists.

For real shared updates and trustworthy dataset publication, add an authenticated backend with:

1. Admin/editor roles enforced on the server, including read-only public access.
2. A structured observations table keyed by station, sample date/period, parameter, unit and reporting basis, plus immutable source citations.
3. A staging/review queue for uploaded files and URLs, with a second reviewer/approval step.
4. Versioned corrections and auditable import history.
5. Safe, server-side ingestion of allowed data sources and normalizing scripts for complex PDF reports.
6. Backup, rollback, and disclosure of provenance, data currency and location confidence.

Until that exists, local imports should be explicitly labeled **user-managed data** and must not be presented as a verified official LLDA update or real-time readings.
