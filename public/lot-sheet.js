/* Lot sheet (phase 3): the redesigned card that sits beside the existing lot map.
 * The map, its polygons, camera, galleries, 360°, public numbering (lot-labels.js)
 * and ?lot= links are untouched; this card only reads the current selection and
 * drives the same selection controls the map already listens to.
 *   Home:           #lot-explorer (zone-explorer.js) — listens to `rpc:lot`,
 *                   selects by clicking #zone-list [data-zone-lot].
 *   proyecto/lotes: .c-lot-card (detail.js + iframe) — listens to #c-lot change,
 *                   selects by setting #c-lot and dispatching `change`.
 * Data: /assets/geography/collection-lots.json (MLS area as supplied by the client;
 * without MLS the area reads "Superficie por confirmar"; no GIS-derived value is shown). */
(() => {
  const T = {
    en: { lot: 'Lot', sold: 'Sold lot', collection: 'The collection', area: 'Area', status: 'Status', available: 'Available', soldState: 'Sold', photos: 'View photos and 360°', prev: 'Previous', next: 'Next', active: 'Active', mls: 'MLS · supplied by the client', gis: 'County GIS · MLS not supplied', tbc: 'Area to be confirmed', pick: 'Select a number on the map, or start with the first lot.', count: n => `${n} available lots`, nav: 'Lot navigation' },
    es: { lot: 'Lote', sold: 'Lote vendido', collection: 'La colección', area: 'Superficie', status: 'Estado', available: 'Disponible', soldState: 'Vendido', photos: 'Ver fotos y 360°', prev: 'Anterior', next: 'Siguiente', active: 'Activo', mls: 'MLS · aportado por el cliente', gis: 'Catastro (GIS) · sin ficha MLS', tbc: 'Superficie por confirmar', pick: 'Selecciona un número en el mapa o empieza por el primer lote.', count: n => `${n} lotes disponibles`, nav: 'Navegación de lotes' },
    pt: { lot: 'Lote', sold: 'Lote vendido', collection: 'A coleção', area: 'Área', status: 'Status', available: 'Disponível', soldState: 'Vendido', photos: 'Ver fotos e 360°', prev: 'Anterior', next: 'Próximo', active: 'Ativo', mls: 'MLS · fornecido pelo cliente', gis: 'Cadastro (GIS) · sem ficha MLS', tbc: 'Área a confirmar', pick: 'Selecione um número no mapa ou comece pelo primeiro lote.', count: n => `${n} lotes disponíveis`, nav: 'Navegação de lotes' }
  };
  const lang = () => (window.rpcI18n?.language || new URLSearchParams(location.search).get('lang') || 'en').slice(0, 2);
  const t = () => T[lang()] || T.en;
  const locale = () => ({ en: 'en-US', es: 'es-ES', pt: 'pt-BR' }[lang()] || 'en-US');
  const fmt = (n, digits = 0) => Number(n).toLocaleString(locale(), { minimumFractionDigits: digits, maximumFractionDigits: digits, useGrouping: true });
  const pad = n => String(n).padStart(2, '0');

  const home = document.querySelector('#lot-explorer .zone-panel');
  const card = document.querySelector('.c-lot-card');
  const host = home || card;
  if (!host || !window.rpcLots) return;
  const L = window.rpcLots;
  const toId = v => (v === null || v === undefined || v === '' || v === 0 || v === '0') ? null : 'RP-' + pad(Number(String(v).replace('RP-', '')));

  const sheet = document.createElement('section');
  sheet.className = 'lot-sheet';
  sheet.dataset.noTranslate = '';
  sheet.dataset.reveal = 'fade';
  sheet.setAttribute('aria-live', 'polite');
  host.prepend(sheet);
  host.classList.add('has-lot-sheet');

  let lots = [], current = null;

  function select(id) {
    if (!id) return;
    if (home) {
      const n = Number(id.replace('RP-', ''));
      document.querySelector(`#zone-list [data-zone-lot="${n}"]`)?.click();
    } else {
      const s = document.querySelector('#c-lot');
      if (s) { s.value = id; s.dispatchEvent(new Event('change')); }
    }
  }
  const available = () => L.order.map(n => 'RP-' + pad(n));
  function step(dir) {
    const list = available();
    const i = list.indexOf(current);
    const next = i < 0 ? (dir > 0 ? list[0] : list[list.length - 1]) : list[(i + dir + list.length) % list.length];
    select(next);
  }

  function render() {
    const s = t();
    const lot = lots.find(l => l.id === current);
    const n = lot ? L.number(lot.id) : null;
    const total = L.order.length;
    const title = !lot ? s.collection : n ? `${s.lot} ${n}` : s.sold;
    let area = '';
    if (lot) {
      const mls = lot.mlsReported && typeof lot.mlsReported.acres === 'number';
      // Without the client's MLS figure the area stays open (lot 02 · RP-14): no derived value is shown.
      if (!mls) area = `<div class="lot-sheet-block"><span class="lot-sheet-label">${s.area}</span><strong class="lot-sheet-tbc">${s.tbc}</strong></div>`;
      const acres = mls ? lot.mlsReported.acres : null;
      const sqft = mls ? lot.mlsReported.areaSqFt : null;
      if (mls) area = `<div class="lot-sheet-block"><span class="lot-sheet-label">${s.area}</span>
        <strong class="lot-sheet-figure">${fmt(acres, 2)} <small>ACRES</small></strong>
        ${sqft ? `<span class="lot-sheet-sub">${fmt(Math.round(sqft))} FT²</span>` : ''}
        <span class="lot-sheet-source">${mls ? s.mls : s.gis}</span></div>`;
    }
    const status = lot ? `<div class="lot-sheet-block"><span class="lot-sheet-label">${s.status}</span>
        <span class="lot-sheet-pill ${n ? 'is-available' : 'is-sold'}">${n ? s.available : s.soldState}</span></div>` : `<p class="lot-sheet-hint">${s.pick}</p>`;
    const gallery = home ? `/proyecto/lotes/?lot=${lot ? L.toURL(lot.id) : ''}&lang=${lang()}#lot-gallery` : '#lot-gallery';
    const photos = lot && n ? `<a class="btn btn--primary btn--block lot-sheet-photos" href="${gallery}"><span>${s.photos}</span><b aria-hidden="true">→</b></a>` : '';
    sheet.innerHTML = `
      <h3 class="lot-sheet-title">${title}</h3>
      ${area}${status}${photos}
      <nav class="lot-sheet-nav" aria-label="${s.nav}">
        <button type="button" data-step="-1"><span aria-hidden="true">‹</span> ${s.prev}</button>
        <span class="lot-sheet-count">${n ? pad(n) : '—'} / ${pad(total)}</span>
        <button type="button" data-step="1">${s.next} <span aria-hidden="true">›</span></button>
      </nav>
      <ul class="lot-sheet-legend">
        <li><i class="is-active"></i>${s.active}</li><li><i class="is-available"></i>${s.available}</li><li><i class="is-sold"></i>${s.soldState}</li>
      </ul>`;
    sheet.querySelectorAll('[data-step]').forEach(b => b.addEventListener('click', () => step(Number(b.dataset.step))));
    const photoLink = sheet.querySelector('.lot-sheet-photos');
    if (photoLink && !home) photoLink.addEventListener('click', e => {
      const g = document.getElementById('lot-gallery');
      if (!g || g.hidden) return;
      e.preventDefault();
      g.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    });
  }

  function sync(value) { current = toId(value); render(); }

  /* proyecto/lotes: reveal the gallery the first time it renders, and honour
   * #lot-gallery when arriving from the home's "View photos & 360°". */
  function watchGallery() {
    const gallery = document.getElementById('lot-gallery');
    if (!gallery) return;
    let revealed = false, jumped = location.hash !== '#lot-gallery';
    const check = () => {
      const stage = gallery.querySelector('.media-stage');
      if (!stage || gallery.hidden) return;
      if (!revealed) {
        revealed = true;
        gallery.querySelector('header')?.setAttribute('data-reveal', 'fade');
        stage.dataset.reveal = 'clip';
        window.rpMotion?.bind?.(gallery);
      }
      if (!jumped) { jumped = true; requestAnimationFrame(() => gallery.scrollIntoView({ block: 'start' })); }
    };
    new MutationObserver(check).observe(gallery, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
    check();
  }

  fetch('/assets/geography/collection-lots.json').then(r => r.json()).then(data => {
    lots = data.lots;
    if (home) {
      document.addEventListener('rpc:lot', e => sync(e.detail));
      sync(document.querySelector('#lot-explorer')?.dataset.selectedLot);
    } else {
      const s = document.querySelector('#c-lot');
      s?.addEventListener('change', () => sync(s.value));
      addEventListener('rpc:lots-ready', () => sync(s?.value));
      sync(s?.value);
    }
    document.addEventListener('rpc:language', render);
    window.rpMotion?.bind?.(host);
    if (!home) watchGallery();
  }).catch(() => { sheet.remove(); host.classList.remove('has-lot-sheet'); });
})();
