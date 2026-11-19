/* House models — the single place to change asset paths.
   When the improved GLB v3 files arrive (same node names), point model3d / floor3d at them here.
   turntable: folder with the Blender 360° sequence (desktop|mobile + manifest.json); until it exists
   the Home view falls back to the 3D viewer.
   photo: base path (no extension; .webp + .jpg) of a realistic image for the selector and the
   comparison. Set it when the Blender frames arrive (e.g. '/assets/homes/utah-front'); while it
   is null, the current render (image / thumb) is used. */
export const HOMES = {
  utah: {
    name: 'Utah',
    model3d: '/utah/utah-exterior-v3.glb',
    floor3d: '/utah/utah-plan-v3.glb',            // furnished interior, baked without roof/ceilings
    plan: '/utah/floorplan-v3.png',
    planPdf: '/utah/utah-floor-plan.pdf',
    metadata: '/utah/metadata-plan-v3.json',
    // Blender images, responsive (base-<w>.webp|jpg): photo = horizontal 3:2, photoTall = 3:4 card,
    // cmp = comparison still. Utah: hero-sequence frame 34 (desktop) / 18 (mobile), full front façade.
    photo: { base: '/assets/homes/utah-front', w: [960, 1600] },
    photoTall: { base: '/assets/homes/utah-front-tall', w: [600, 1200] },
    cmp: { base: '/assets/homes/utah-card34', w: [960, 1600] },
    illustrative: false,
    image: '/assets/homes-utah-tall',
    thumb: '/assets/home-utah',
    turntable: '/assets/turntable/utah/', turntableReady: true,
    finishes: [                         // swatch crops + the two concept images, one gallery
      { src: '/assets/finishes/utah-exterior-concept', label: 'Finish concept · exterior', concept: true },
      { src: '/assets/finishes/utah-kitchen-concept', label: 'Finish concept · kitchen' }
    ]
  },
  bell: {
    name: 'Bell',
    model3d: '/bell/bell-exterior-v3.glb',
    floor3d: '/bell/bell-plan-v3.glb',
    plan: '/bell/floorplan.png',
    planPdf: '/bell/bell-model.pdf',
    metadata: '/bell/metadata.json',
    photo: { base: '/assets/homes/bell-real', w: [960, 1600] },            // direccion-visual/bell/bell-real-v1
    photoTall: { base: '/assets/homes/bell-real-tall', w: [600, 1200] },
    cmp: { base: '/assets/homes/bell-card34', w: [960, 1600] },
    illustrative: true,                // 'Illustrative image' note on the selector and the Home preview
    image: '/assets/homes-bell-tall',
    thumb: '/assets/home-bell',
    turntable: '/assets/turntable/bell/', turntableReady: true,
    finishes: null
  }
};
/* Official figures, normalised from each metadata file (Kimsa Construction LLC schedules). */
export function facts(id, meta) {
  const a = meta.areas_from_sheet_sqft || meta.official_schedule_ft2 || {};
  return {
    bedrooms: meta.bedrooms_main ?? meta.bedrooms,
    studio: meta.studio_annex || 0,
    bathrooms: meta.bathrooms,
    garage: meta.garage_spaces,
    living: a.living, entry: a.entry, garageArea: a.garage, total: a.total,
    source: [meta.author || meta.source_author, meta.job ? 'Job ' + meta.job : ''].filter(Boolean).join(' · ')
  };
}
