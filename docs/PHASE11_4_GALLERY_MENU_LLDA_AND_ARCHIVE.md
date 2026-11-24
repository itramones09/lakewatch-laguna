# Phase 11.4 — Gallery Navigation, LLDA Link, Six-Parameter Archive and About Cleanup

## What changed

- **Main navigation:** Photo Gallery is a direct top-level button. The existing interactive Wikimedia Commons carousel, filters, search, author/license credit, and full-size viewer are now on a separate Photo Gallery page. The gallery is removed from About & Sources.
- **About & Sources:** The redundant water-quality parameter color card has been removed. A prominent **Visit LLDA official website** link goes to https://llda.gov.ph/ in a new tab. About now focuses on academic information, project scope, methods, and references.
- **Analytics → Extended Historical Archive:** The parameter selector now lists all six imported water-quality parameters. Only BOD and TSS have additional annual observations in the historical archive; DO, pH, nitrate and phosphate display available station-month records and explicit data-gap notes. No values are invented.
- **User Manual:** Updated to include a dedicated Photo Gallery tab, the LLDA portal, and the six-parameter archive behavior.
- **Themes:** Improved contrast of historical chart selectors in Dark Mode.

## Deploy

Copy the patch's `frontend` and `docs` files into the same paths of your local project. Commit and push to GitHub. Vercel will deploy the frontend if Git-based deployments are enabled. No Render or PostgreSQL migration is necessary.

## Verification

1. Click Photo Gallery on the main menu; check carousel navigation, filters, Load more, and photo viewer.
2. Open About & Sources; check that the gallery and color legend are absent and the LLDA external link opens.
3. Open Analytics → Extended Historical Archive; verify that all six parameters appear and that DO does not falsely show 1990–2012 annual data.
4. Open Help & Information → Open User Manual; verify Photo Gallery has a guide tab.
