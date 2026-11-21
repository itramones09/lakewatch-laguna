# Test plan — station tags and current/archived classification

1. Launch project via VS Code **Live Server**; internet is needed for the Leaflet CDN and OSM map tiles.
2. Open **Lake Map**. Confirm 16 station-ID tags appear (I, II, IV, V, VIII, XIII, XV–XVIII, XIX–XXIV). No tags should appear for III, VI or VII.
3. Click every visible tag. Each should open a station-specific popup and update the right-side **Selected Station** card. Markers should remain click-accessible even while the shoreline layer is visible.
4. Open the **Go to monitoring station** dropdown, select XXIV or XIII, and confirm that the map moves to and opens the correct popup. Tags are clickable via keyboard focus as well.
5. Inspect the marker confidence legend: teal = published academic coordinate, amber = approximate area, grey = archived marker when location data exists. The present archived records have no verified coordinates, so no grey pins appear.
6. In **Monitoring Stations**, choose **Active Stations (16)**; confirm all 16 have June 2026 readings. Choose **Archived Stations (3)**; confirm III, VI, VII only, with "no recent results" messaging and no map pin.
7. Search within both tabs; switch between them and confirm that right-side station profile changes to a station in the selected tab.
8. Confirm that all 186 monthly values remain in Data Explorer; annual archive remains available in Analytics; light/system/dark appearance persists.
9. On mobile viewport, confirm the station status toggle and map station selector remain usable.
10. If a few markers overlap at a given zoom, zoom closer or use the station locator. Location confidence and sources must remain visible.

**Known limitation:** This build cannot assert official GPS precision for all 16 sites. Nine coordinates are from published academic Appendix A, seven remain approximately placed, and three historical identifiers remain unlocated. Public LLDA coordinate release requires permission.
