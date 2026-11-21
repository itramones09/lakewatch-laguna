# Phase 5 — Parameter Identity Palette and Responsive Interface

## Categorical palette

| Parameter | Light | Dark |
|---|---|---|
| Dissolved Oxygen (DO) | `#146da9` blue | `#6ab5f3` |
| Biochemical Oxygen Demand (BOD) | `#bf5727` vermilion | `#ff9d72` |
| pH Level | `#8e52b4` violet | `#d1a3ff` |
| Nitrate (NO3) | `#087c62` green | `#62e0ba` |
| Inorganic Phosphate (PO4) | `#b33f78` magenta | `#ff91bd` |
| Total Suspended Solids (TSS) | `#947213` ochre | `#f5cf69` |

These are **categorical identities**, not water-quality classifications, thresholds or rankings. No traffic-light scale is implied.

## Files

- `css/style.css`: central CSS design tokens for light/dark colors; component rules and responsive breakpoints.
- `js/parameter-palette.js`: `LakeWatchPalette`, `color(id)`, `badge(id,label)`, `legend(parameters)`.
- `js/app.js`: Overview shortcuts, station reading cards, map panel legend and shared selected parameter.
- `js/map-module.js`: marker **outer ring** follows parameter hue, **interior** retains teal/amber geographic confidence, selected tag adds a gold emphasis ring.
- `js/analytics-module.js`: Chart.js and SVG historical monthly comparisons use the active parameter hue; numerical below-limit qualifiers remain excluded from plots and visible in tables.
- `js/historical-module.js`: BOD/TSS hue follows selected parameter. Line styles identify *lake-wide annual*, *single-station annual* and *station monthly* measurements; these series remain separate.
- `js/explorer-module.js`: colored badges and underlines distinguish parameter types; stored readings and downloaded CSV remain unchanged.

## Accessibility

- Every color is coupled with the parameter name/abbreviation (DO, BOD, pH, NO3, PO4, TSS).
- Distinguish map location confidence separately from parameter identity using solid or dashed marker borders and explicit tooltips/captions.
- High-contrast focus outlines remain available for keyboard navigation.
- Mobile controls reflow into a 2-column color guide, with single-column reading cards on narrow screens.
- `prefers-reduced-motion` disables decorative view transitions.
- Light, Dark and System modes retain persistent selection from the existing theme module.

## Data integrity

- 16 stations show June 2026 readings; III, VI, VII remain unlocated archive identifiers.
- The 186 Q4 2023/June 2026 monthly values and 69 annual historical values are unchanged.
- Official coordinate and station foundation date limitations remain documented in `STATION_COORDINATES_AND_STATUS.md` and `STATION_CHRONOLOGY.md`.
