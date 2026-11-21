# LakeWatch Laguna frontend — Phase 8

This directory is a static HTML/CSS/JavaScript frontend for **Vercel**, connected to the FastAPI + PostgreSQL backend hosted on **Render**.

**Read the root-level `../README.md` first, followed by `../docs/DEPLOY_VERCEL_RENDER_GITHUB.md`.**

To configure the server address, edit `js/api-config.js`. The URL is public and must be your real Render backend URL; never put secrets in frontend files.

Local development: run the backend on port `8000`, then serve this directory using VS Code Live Server on port `5500`.

Phase 7's original browser-only update instructions are archived as `../docs/PHASE7_LEGACY_README.md`. They no longer describe the full-stack project.

The website's water-quality readings are historical, not live LLDA sensor observations. Backend administrators can publish new verified readings to the shared database.
