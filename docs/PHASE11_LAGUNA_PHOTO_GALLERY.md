# Phase 11 — Laguna de Bay Photo Gallery

## What was added
An eight-photo, source-credited gallery under About & Sources, between Data Methodology and References. Filter by lake views, lakeside life or sunset; open an image for a larger view and move with arrow keys. All links point to the corresponding Wikimedia Commons file page and license.

These are actual photographs of Laguna de Bay and neighboring lake shores—not AI-generated views, station coordinates, or water-quality evidence. The images remain externally hosted and require an internet connection. No photo files or backend code are changed.

## Why only eight?
It is not feasible or legally appropriate to collect every image of Laguna de Bay published online. This is a curated selection whose source authors and licenses can be attributed. More photos are available at https://commons.wikimedia.org/wiki/Category:Laguna_de_Bay.

## Image sourcing and copyright
Image URLs and their sources are listed in `frontend/js/photo-gallery.js`. Each entry includes the author, a CC0 or CC BY-SA license, and a source page. Users can follow these links for license details. Card thumbnails visually crop photos with CSS; the original files remain on Wikimedia Commons. If you copy, edit or redistribute individual photos, follow the applicable photo license and give credit.

## Deployment
Copy the `frontend` and `docs` folders from the patch into the existing local repository; replace the matching files, then run:

```powershell
git add frontend/index.html frontend/css/style.css frontend/js/photo-gallery.js frontend/js/user-manual.js docs/PHASE11_LAGUNA_PHOTO_GALLERY.md
git commit -m "Add credited Laguna de Bay photo gallery"
git push origin main
```

Vercel deploys the frontend from GitHub. No Render or PostgreSQL change is needed. Images hosted externally may be unavailable if Wikimedia is blocked, offline, or rate-limited; the source links remain available.

## Testing
Verify all eight cards online, filter tabs, source links, lightbox close, keyboard arrows, Light/Dark theme, and mobile layout.
