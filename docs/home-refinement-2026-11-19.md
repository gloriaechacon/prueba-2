# Home refinement · 19 November 2026

Updated the Home hero clouds and headline positions, added linked lot markers, enlarged section labels, expanded the Surroundings introduction, and placed the existing inquiry form beside the closing headline. Added the existing Rainbow Park mark to the introduction. Removed the hero investment shortcut and the requested 3D captions. Shared primary and secondary CTAs now use text without trailing arrows; carousel navigation is unchanged.

Utah's selector, Home preview and Contact use the existing illustrative exterior concept from `public/assets/finishes/utah-exterior-concept.jpg`, exported to responsive JPEG/WebP. The model viewers and comparison renders remain available. Contact starts directly with the inquiry section.

## Verification

- `npm ci --ignore-scripts --no-audit --no-fund` and `npm run build` passed without dependency or build configuration changes.
- JavaScript syntax and `git diff --check` passed.
- Browser review: Home at 1366×768 and 375×812; English, Spanish and Portuguese content; desktop Contact and House Models.
- Home marker 02 opened `?lot=2` with lot 02 selected. All six markers have individual public-number URLs and keyboard links.
- Form fields stack on mobile; no horizontal document overflow at tested sizes. Required-field validation is present. No real inquiry was sent; recipient activation/delivery is not verified.
- Utah and Bell selector images loaded; no errors reported in that page's browser console.
- Reduced-motion behavior retained in code: fixed clouds, no marker transitions. No new performance benchmark was taken.

## Generated asset

Built-in ImageGen produced `public/assets/cirrus-overlay.webp`, preserving transparency. Prompt:

> Create a production website overlay asset: photorealistic thin white cirrus clouds on a truly transparent background. Wide horizontal 3:2 canvas. An irregular elongated bank of delicate wind-stretched feathery cloud filaments sweeping across the image, airy wisps, varied density, naturally torn translucent edges, viewed at high altitude. Cloud mass is long and flat with extensive horizontal strands, no round cotton balls, no cumulus lobes, no sky or blue backdrop, no landscape, no text, no shadows. Warm white clouds with soft photographic texture and real alpha translucency. Leave transparent breathing room on all edges. Intended to be enlarged behind a website headline and drift outwards with scrolling.
