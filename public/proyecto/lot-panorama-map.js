/* North-up locator for lot panoramas. Camera poses are estimates, not GPS readings.
   See docs/panorama-orientation.md for the source and fitting method. */
export const PANORAMA_POSES = {
  'RP-01/DJI_20261029133322_0092_D.jpg': { lat: 29.15524304, lon: -82.36179945, headingOffset: 269.828 },
  'RP-02/DJI_20261029135622_0097_D.jpg': { lat: 29.14823023, lon: -82.37773399, headingOffset: 179.509 },
  'RP-03/DJI_20261029140655_0102_D.jpg': { lat: 29.14820836, lon: -82.37985819, headingOffset: 268.514 },
  'RP-05/IMG_20261029_084259_102.jpg': { lat: 29.14528911, lon: -82.38023539, headingOffset: 94.973 },
  'RP-04/DJI_20261029141726_0106_D.jpg': { lat: 29.14453945, lon: -82.38157798, headingOffset: 5.996 },
  'RP-06/IMG_20261029_133922_106.jpg': { lat: 29.14922087, lon: -82.38139869, headingOffset: 193.911 }
};
const COPY = {
  en: { map: 'Area map', lot: 'Lot', north: 'North', show: 'Show area map', hide: 'Hide area map', approximate: 'Position and direction approximate', unavailable: 'Street map unavailable', uncalibrated: 'Viewing direction not yet calibrated', zin: 'Zoom in on map', zout: 'Zoom out from map' },
  es: { map: 'Mapa de calles', lot: 'Lote', north: 'Norte', show: 'Mostrar mapa de calles', hide: 'Ocultar mapa de calles', approximate: 'Posición y orientación aproximadas', unavailable: 'Mapa de calles no disponible', uncalibrated: 'Dirección de la vista pendiente de calibración', zin: 'Acercar el mapa', zout: 'Alejar el mapa' },
  pt: { map: 'Mapa de ruas', lot: 'Lote', north: 'Norte', show: 'Mostrar mapa de ruas', hide: 'Ocultar mapa de ruas', approximate: 'Posição e direção aproximadas', unavailable: 'Mapa de ruas indisponível', uncalibrated: 'Direção da vista ainda não calibrada', zin: 'Aproximar o mapa', zout: 'Afastar o mapa' }
};
export function viewHeading(yaw, offset) { return ((yaw + offset) % 360 + 360) % 360; }
export function horizontalFov(verticalFov, aspect) {
  return 2 * Math.atan(Math.tan(verticalFov * Math.PI / 360) * aspect) * 180 / Math.PI;
}
export function conePath(fov) {
  const half = Math.max(1, Math.min(179, fov)) * Math.PI / 360, r = 60;
  const x = Math.sin(half) * r, y = -Math.cos(half) * r;
  return `M 0 0 L ${-x} ${y} A ${r} ${r} 0 0 1 ${x} ${y} Z`;
}
export function mountPanoramaMap(frame, lot, item, language, publicNumber) {
  const s = COPY[language] || COPY.en, pose = PANORAMA_POSES[item.file], L = window.L;
  if (!L || !lot?.parcelPolygon) return { update() {}, dispose() {} };
  const host = document.createElement('aside'); host.className = 'pano-locator';
  host.setAttribute('aria-label', `${s.map} · ${s.lot} ${publicNumber}`);
  host.innerHTML = `<button type="button" class="pano-map-toggle" aria-expanded="true" aria-controls="pano-map-panel" aria-label="${s.hide}"><span>${s.map} · ${s.lot} ${publicNumber}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 14 6-6 6 6"/></svg></button><div id="pano-map-panel"><div class="pano-map-canvas" role="region" aria-label="${s.map}"></div><span class="pano-map-north" title="${s.north}" aria-label="${s.north}">↑ N</span><p class="pano-map-note">${pose ? s.approximate : s.uncalibrated}</p><p class="pano-map-error" role="status" hidden>${s.unavailable}</p></div>`;
  frame.append(host);
  const canvas = host.querySelector('.pano-map-canvas');
  const map = L.map(canvas, { zoomControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false, boxZoom: false, touchZoom: false, keyboard: false, zoomAnimation: false, fadeAnimation: false, attributionControl: true });
  map.setView([lot.center.lat, lot.center.lon], 17);
  map.attributionControl.setPrefix(false);
  L.control.zoom({ position: 'topleft', zoomInTitle: s.zin, zoomOutTitle: s.zout }).addTo(map);
  const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>' }).addTo(map);
  let failed = false;
  tiles.on('tileerror', () => { failed = true; host.querySelector('.pano-map-error').hidden = false; });
  tiles.on('loading', () => { failed = false; });
  tiles.on('load', () => { host.querySelector('.pano-map-error').hidden = !failed; });
  const parcel = L.geoJSON(lot.parcelPolygon, { interactive: false, style: { className: 'pano-map-parcel', weight: 2, fillOpacity: .2 } }).addTo(map);
  const bounds = parcel.getBounds();
  let cone = null, svg = null, disposed = false;
  if (pose) {
    bounds.extend([pose.lat, pose.lon]);
    const marker = L.marker([pose.lat, pose.lon], { interactive: false, keyboard: false, icon: L.divIcon({ className: 'pano-map-camera', iconSize: [140, 140], iconAnchor: [70, 70], html: '<svg viewBox="-70 -70 140 140" aria-hidden="true"><g class="pano-map-cone"><path/><path class="pano-map-axis" d="M0 0V-60"/></g><circle r="5"/></svg>' }) }).addTo(map);
    svg = marker.getElement().querySelector('svg'); cone = svg.querySelector('.pano-map-cone');
  }
  let size = '';
  const resize = () => {
    if (disposed || host.classList.contains('is-collapsed') || !canvas.clientWidth || !canvas.clientHeight) return;
    const nextSize = `${canvas.clientWidth}x${canvas.clientHeight}`;
    map.invalidateSize({ pan: false });
    if (size !== nextSize) { map.fitBounds(bounds, { padding: [36, 28], maxZoom: 14, animate: false }); size = nextSize; }
  };
  const observer = new ResizeObserver(resize); observer.observe(canvas); resize();
  host.querySelector('.pano-map-toggle').addEventListener('click', () => {
    const collapsed = host.classList.toggle('is-collapsed');
    const button = host.querySelector('button'); button.setAttribute('aria-expanded', String(!collapsed)); button.setAttribute('aria-label', collapsed ? s.show : s.hide);
    host.querySelector('#pano-map-panel').hidden = collapsed;
    if (!collapsed) resize();
  });
  // Keep keyboard map controls from switching gallery items.
  host.addEventListener('keydown', e => { if (e.key !== 'Escape') e.stopPropagation(); });
  return {
    update({ yaw, fov, aspect }) {
      if (disposed || !cone) return;
      const heading = viewHeading(yaw, pose.headingOffset), hfov = horizontalFov(fov, aspect);
      cone.setAttribute('transform', `rotate(${heading})`); cone.querySelector('path').setAttribute('d', conePath(hfov));
      host.dataset.heading = heading.toFixed(2); host.dataset.fov = hfov.toFixed(2);
    },
    dispose() { disposed = true; observer.disconnect(); map.remove(); host.remove(); }
  };
}
