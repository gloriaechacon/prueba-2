# Lot panorama locator — 2026-11-23

Only the full-screen 360° lot gallery uses this locator. Home, the main lot map,
Surroundings, existing outlines and original assets are unchanged.

## Orientation data

`public/proyecto/lot-panorama-map.js` keys each pose by the current catalog's
image filename, not the historical folder's apparent lot number. Public lots
1–6 remain RP-01, RP-14, RP-05, RP-06, RP-07 and RP-09.

The current JPEGs contain no EXIF GPS or heading. These poses are **geometric
estimates**, not surveyed camera coordinates or independently verified compass
bearings. The interface says “Position and direction approximate” in EN/ES/PT.
They should be checked against original drone data or manually confirmed landmarks
before describing them as calibrated. An unknown image gets a parcel locator
without a direction cone rather than silently reusing another image's pose.

Method: intersect the existing equirectangular outline rays with an assumed flat
ground plane, using the viewer's upright horizon. At unit camera height the
horizontal coordinates are `(-tan(pi*v)*cos(2*pi*u), tan(pi*v)*sin(2*pi*u))`.
Fit a 2D similarity transform to the corresponding parcel ring from
`assets/geography/collection-lots.json`, in local east/north meters. Consider
cyclic vertex order and reversed winding; disambiguate the 180° alternative by
the camera being on the street/front side (visible in the current panoramas).
No image, outline, cadastral ring or initial view is changed.

| Public lot | Internal ID | Outline indices used | RMS fit residual, m |
|---|---|---|---|
| 1 | RP-01 | 0,1,2,3 | 0.88 |
| 2 | RP-14 | 0,1,2,3 | 2.19 |
| 3 | RP-05 | 0,1,2,3 | 1.84 |
| 4 | RP-06 | 0,1,2,3 | 0.82 |
| 5 | RP-07 | 0,1,2,4 | 2.63 |
| 6 | RP-09 | 0,1,2,3 | 0.73 |

Residuals describe agreement with the existing **indicative** outlines, not
real-world accuracy. Lot 5 has a five-point panorama annotation but a four-point
cadastral ring; the best four-point fit excludes annotation vertex 3. This makes
its estimated pose particularly important to review. Preserve its five-point
panorama annotation.

The stored offset maps viewer yaw to compass bearing:
`heading = (yaw + headingOffset) mod 360`. Increasing yaw turns clockwise on the
north-up map. Pitch does not move the observer. Horizontal aperture is computed
from the viewer's vertical FOV and current aspect ratio. The cone is a direction
indicator of fixed screen radius, not a geographic visibility/coverage boundary.

## Behavior and resources

- Reuses bundled Leaflet and the existing Surroundings OpenStreetMap street tiles
  and desaturation treatment. No additional libraries or keys.
- Lot boundary plus a green observation point and transparent direction cone.
- Bottom-right, collapsible on all sizes; mobile has a smaller panel.
- Map refits camera and parcel on canvas resize; rotating the panorama never
  rotates or pans the base map. Zoom buttons on the minimap are independent.
- Closing or switching gallery items disposes Leaflet, observers and the panorama.
  A gallery generation guard prevents a delayed transition from remounting them.
- Tile failures show an inline status while the local parcel and cone remain.

## House plan preview

`floor-plan-sheet.js/css` now render a compact preview with the unchanged image
and PDF for the selected house. A native dialog contains fit/zoom/pan controls,
the full sheet, original PDF and download links. Escape closes it and returns
focus; changing house/language disposes the previous dialog and handlers.
No changes to either GLB or to Home.
