# Historical Expansion Acceptance Checklist

- [ ] Open `index.html` through VS Code **Live Server**, not `file:///`.
- [ ] Overview shows **16 documented map locations** and **186 monthly readings**.
- [ ] Map has up to 16 interactive **approximate** station pins when Leaflet loads (no fabricated III/VI/VII markers).
- [ ] Directory lists 19 **identifiers**, with III/VI/VII explicitly marked *unverified* and not physically confirmed.
- [ ] Selecting Stn. XV displays **added in 2012** and the source link, without claiming an exact day/month.
- [ ] Selecting Stn. XIII displays **added in 2021** and the source link.
- [ ] Selecting Stn. XXIV displays **first documented by 2026**, not a made-up establishment date.
- [ ] Selecting Stn. VII displays the LLDA 2017 VII/VIII label conflict and **No verified map location**.
- [ ] Analytics > Extended Historical Archive displays lake-wide series beginning **1990**.
- [ ] Changing Historical parameter from BOD to TSS displays **1990–1999** lake series (no 2000 TSS point).
- [ ] Historical station drop-down changes 2009–2012 station annual and 2023/2026 monthly points without changing lake-wide aggregate.
- [ ] Gaps 2001–2008 and 2013–2022 are marked and not interpolated.
- [ ] Recent Analytics trend **does not connect December 2023 and June 2026** across the unimported interval.
- [ ] Data Explorer lists **186** monthly values by default; selecting Stn. III and *Not reported* shows 24 blank entries, not fabricated readings.
- [ ] CSV export retains original qualified readings and source URLs.
- [ ] Light / Dark / System switch preserves functionality.
- [ ] All six layouts function on mobile and desktop.

**Verification performed in test environment:** JSON/count checks, JavaScript syntax, station selection/dates, history chart data, explorer filters/export, three theme modes, and responsive SVG visualization passed. Live remote Leaflet tiles and remote chart CDN were not available in automated browser sandbox; test in your own networked browser.
