# Phase 10.2 — Floating User Manual and About & Sources Layout

## New features

### Floating User Manual
- Header action **User Manual** opens a non-modal floating panel with no backdrop.
- Nine top-level manual tabs: Overview, Lake Map, Monitoring Stations, Analytics, Data Explorer, Lake Context, Reports, Manage Data and About & Sources.
- Each module has a purpose, ordered instructions and a practical data/usage note.
- The guide stays open during normal navigation and automatically follows the selected main module.
- Manual tabs can be explored without navigating the main page; **Open module** explicitly navigates to a chosen module.
- Close (**×**), minimize (**−**), restore and Escape are supported; keyboard arrow/Home/End navigation works across tabs.
- The window can be dragged by its heading on desktop. On mobile, it adapts to screen width; minimize to recover viewing space.
- No admin login is required for reading the guide.

### About & Sources redesign
- A centered content shell with generous space on both sides at desktop widths.
- **Academic Context** is now the first full-width card below the page heading, displaying course, program, developers and institution.
- Purpose, feature capabilities, measurement key, stewardship, environmental-intelligence explanations and methodology are organized into individual responsive cards.
- **References & source library** has its own full-width card and four groups; all existing 16 reference URLs are retained.
- The expandable historical methodology and six-parameter legend remain available.
- Light, Dark and System appearance preferences are supported through existing color tokens.

## Files modified
- `frontend/index.html`
- `frontend/css/style.css`
- `frontend/js/app.js`
- New: `frontend/js/user-manual.js`
- New: `frontend/docs/USER_MANUAL_ALL_MODULES.md`

The backend and database are unchanged. No migration or new secrets are needed.

## Deployment — GitHub, Vercel and Render

1. Download your current shared-database backup from Manage Data before updating your deployed application.
2. Extract the Phase 10.2 **patch ZIP**.
3. Copy the patch's `frontend` and `docs` folders into your existing `LakeWatch-Laguna-Fullstack` repository, keeping the folder structure and replacing only matching files.
4. In the VS Code terminal, run:

```powershell
cd "C:\Users\admin\Downloads\WITM Final Exam Output\LakeWatch_Laguna_Phase8_Fullstack_Vercel_Render_GitHub\LakeWatch-Laguna-Fullstack"
git add frontend/index.html frontend/css/style.css frontend/js/app.js frontend/js/user-manual.js frontend/docs/USER_MANUAL_ALL_MODULES.md docs/PHASE10_2_USER_MANUAL_AND_ABOUT_LAYOUT.md
git commit -m "Phase 10.2 - Add floating user manual and refine About Sources"
git push origin main
```

5. Wait until the connected **Vercel frontend** deployment is Ready. This phase does **not** require a Render backend deployment or PostgreSQL schema change.
6. Hard-refresh the live Vercel website with **Ctrl + Shift + R**, then open User Manual and About & Sources.

## Acceptance checks

- [ ] User Manual opens from the header over any module.
- [ ] Main navigation remains clickable; it changes the manual's selected tab without closing the popup.
- [ ] Manual tabs display their own instructions without automatically changing the main page.
- [ ] **Open module** selects the matching main page.
- [ ] Minimize, restore, Escape and close work as expected.
- [ ] Manual is readable on phone and desktop.
- [ ] About & Sources displays Academic Context first and References in its own card.
- [ ] Existing sources, parameter key, navigation, admin login, analytics and data update operations remain intact.

## Verification and limitations

The updated front end passed HTML ID and JavaScript syntax checks. The floating manual interactions, responsive layouts and new About cards were tested in an **isolated browser UI**, not against the live API. Post-deployment integration should be confirmed in your own Vercel browser.
