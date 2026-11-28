# Deployment Guide — LakeWatch Laguna

## A. Local presentation from VS Code (recommended for the defense)

1. Extract the project ZIP and open its project folder in VS Code.
2. Launch `index.html` with the **Live Server** extension.
3. Confirm the browser URL starts with `http://127.0.0.1` or `http://localhost`, not `file:///`.
4. Check that the internet-connected browser loads the Leaflet basemap and external libraries.
5. Test the Map, Analytics and Data Explorer on the presentation computer before the session.

No Node build command, database or API key is required.

## B. GitHub Pages (static deployment)

1. Create a **new repository** for this academic project on your own GitHub account.
2. Upload the **contents of the project folder** to the repository root. `index.html` must be at the root along with `css`, `js`, `assets` and `data`.
3. Under the repository's **Settings → Pages**, select deployment from the appropriate branch (typically `main`, root folder) and save.
4. Open the URL GitHub Pages provides after the site is published.
5. Verify JSON fetches, map tiles, navigation, charts, CSV export and the display themes from that public URL.

GitHub's interface and deployment policies can change. Check current Pages documentation if menu names differ. If the repository is public, **all local project files and historical datasets included in it are also public**.

## C. Netlify or similar static hosting

1. Upload the extracted web application's directory using the host's static-site upload option (where supported), or deploy the repository.
2. Set the **publish directory** to the folder containing `index.html`. A build command is not required.
3. Open the assigned URL and run the post-deployment checks below.

## D. Post-deployment verification

- The logo displays at the correct size, and navigation switches among all six modules.
- All JSON requests return successfully; `stations.json` and `historical-annual.json` are publicly accessible where deployed.
- The interactive map centers near Laguna de Bay and station tags can be clicked or selected from the locator.
- OpenStreetMap attribution is displayed. A schematic boundary, if shown, is identified as approximate.
- Charts reflect selected station/parameter; annual and monthly series remain separated.
- Active 16 / Archived 3 and 789 monthly records appear correctly.
- CSV export downloads all filtered results, not only the current page.
- Light, Dark and System themes work; persistence across reload works on the host's origin.
- Layouts have no unintended horizontal page overflow on desktop and mobile widths.
- Source links under About & Sources open as intended.

## External services and limitations

Leaflet and Chart.js load from public CDNs. Map tiles and an optional OpenStreetMap lake-boundary request depend on internet connectivity, the service's policies and current availability. Do not claim 24/7 operation or live water-quality updates. The historical JSON data itself is packaged with the project.

**No deployment has been performed by this project package.** Publishing the code is an action for the two developers after reviewing privacy, attribution and third-party data/licensing requirements.
