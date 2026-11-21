# Manage Data — implementation checks

The development test harness used an embedded page with mocked browser storage and JSON responses because local-web navigation was restricted in the test environment. Saving and reading back stored changes were validated through the same JavaScript data-merge logic as the shipped app; the harness intercepted page reloads to inspect state, then bootstrapped a new page from persisted data.

## Completed controlled checks: 23 / 23

- Seven modules including Manage Data present
- Original 186 historical monthly observations preserved
- Three update modes available
- Manual entry preview and approval
- Browser-local saved overlay
- Saved changes merged on fresh page boot
- New reading shown in Monitoring Station profile
- New reading shown in Data Explorer
- New reading reflected in Analytics
- Duplicate records detected and skipped
- Corrections flagged
- Correction blocked until explicit approval
- Correction audit history saved
- CSV file import preview
- Detection-limit value (`<0.1`) preserved verbatim
- Direct online JSON import preview
- Online JSON import saved
- Dynamic Active/Archived classification (based on recent imported data)
- Dynamic observation count updated
- JSON backup generated
- Local-data reset works
- Mobile layout has no page-level horizontal overflow
- No uncaught JavaScript errors in test harness

## Tests requiring the user's networked VS Code browser

- Actual file selection and `.xlsx` parsing through the external CDN (availability depends on the local network)
- External cross-origin CSV/JSON endpoints (must allow CORS)
- Real-world LLDA report contents and reviewer accuracy verification
- Actual Live Server save/reload, persisted browser storage and file downloads
- Live OpenStreetMap boundary service and Chart.js rendering

**Do not treat these controlled tests as certified scientific validation or successful online deployment.**
