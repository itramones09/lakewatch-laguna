# LakeWatch Laguna — Phase 10.4: one-click Light / Dark toggle

The Appearance dropdown has been removed from the website header. A single sun/moon icon occupies its place.

- In Light mode the **moon icon** indicates the action to switch to Dark mode.
- In Dark mode the **sun icon** indicates the action to switch to Light mode.
- The setting is saved under the existing `lakewatch-appearance` browser storage key. An old `system` preference is still respected until the first click, then a manual Light or Dark preference is saved.
- This button is keyboard accessible, with a descriptive tooltip, screen-reader label, and visible focus indicator.
- The existing `lakewatch-theme-change` event is preserved so Chart.js elements can refresh correctly.
- No Backend, Render environment variables, or PostgreSQL migrations are needed.

## Update instructions

Copy the patch's `frontend/index.html`, `frontend/css/style.css`, and `frontend/js/theme-module.js` into your local repository, replacing the existing copies. Review changes, commit and push:

```powershell
git add frontend/index.html frontend/css/style.css frontend/js/theme-module.js docs/PHASE10_4_THEME_TOGGLE.md
git commit -m "Phase 10.4 - Replace appearance menu with sun moon toggle"
git push origin main
```

Once Vercel is Ready, refresh the live website and verify the button switches in both directions. Reload the page and confirm the choice persists. Test at desktop and narrow mobile width.
