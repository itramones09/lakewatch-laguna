# Phase 11.1 — Wikimedia Commons Laguna de Bay carousel

## How it works
- About & Sources now contains a responsive three-/two-/one-card carousel with Previous and Next controls, touch swipe, search, category filters, and a full-screen image viewer.
- The gallery starts with eight source-reviewed photos as offline fallback and then queries the Wikimedia Commons MediaWiki API (`https://commons.wikimedia.org/w/api.php`) for current files in `Category:Laguna de Bay` and lake-related descendant categories.
- Every image batch is fetched on demand; the app does **not** download or store entire original photos in GitHub, Vercel, or PostgreSQL. It only loads thumbnail URLs for a few visible cards.
- The traversal includes lake-focused subcategories (such as location-based lake views and Talim Island). The tributary/river category and unrelated park categories are deliberately excluded, matching LakeWatch's lake-only scope.
- The carousel includes *photographic raster files* (JPEG, PNG, WebP), filtering some obvious map/logo/diagram names. Because Wikimedia classification and categories change, it cannot guarantee every entry is a photograph or that every photograph online is in this category.
- Image credit and license information are read from Commons file metadata when available. Unknown licenses link to the original source for confirmation. Do not remove attribution.

## Using the gallery
1. Open Help & Information → About & Sources → Laguna de Bay Photo Gallery.
2. Select All photos, Lake views, Lakeside life, or Sunsets; these filters are approximate filename-based groupings and search only loaded photos.
3. Use the arrows or touch swipe to navigate cards.
4. Click Load more photographs to fetch the next batch from Wikimedia Commons; repeat to reach later categories.
5. Open a photo to view it larger, then use the Original file and Reuse license links.

## Connectivity
Uses the public MediaWiki Action API with `origin=*` for browser CORS. If Commons is unavailable, the curated starter set remains accessible and a Retry button is shown. Vercel deployment requires no new env variables, backend modifications, or database migration.

## Frontend changes
- `frontend/index.html`
- `frontend/js/photo-gallery.js`
- `frontend/css/style.css`
- `frontend/js/user-manual.js`

## Attribution note
A Creative Commons license may require author credit, a license link, indication of modifications, and share-alike on derivatives. Follow each file's page for the definitive license and any special restrictions.
