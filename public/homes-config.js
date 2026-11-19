/* House models — the single place to change asset paths.
   When the improved GLB v3 files arrive (same node names), point model3d / floor3d at them here.
   turntable: folder with the Blender 360° sequence (desktop|mobile + manifest.json); until it exists
   the Home view falls back to the 3D viewer. */
export const HOMES = {
  utah: {
    name: 'Utah',
    model3d: '/utah/utah-exterior-v2.glb',
    floor3d: '/utah/utah-exterior-v2.glb',
    plan: '/utah/floorplan-v3.png',
    planPdf: '/utah/utah-floor-plan.pdf',
    metadata: '/utah/metadata-plan-v3.json',
    image: '/assets/homes-utah-tall',
    thumb: '/assets/home-utah',
    turntable: '/assets/turntable/utah/',
    finishes: '/assets/utah-finishes.webp'   // swatches; the full-size concept opens in the Finish concept modal
  },
  bell: {
    name: 'Bell',
    model3d: '/bell/bell-exterior-v2.glb',
    floor3d: '/bell/bell-exterior-v2.glb',
    plan: '/bell/floorplan.png',
    planPdf: '/bell/bell-model.pdf',
    metadata: '/bell/metadata.json',
    image: '/assets/homes-bell-tall',
    thumb: '/assets/home-bell',
    turntable: '/assets/turntable/bell/',
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
