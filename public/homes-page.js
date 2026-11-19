/* proyecto/viviendas — House models: selector (two tall cards), viewer with four tabs and a
   spec sheet, light comparison with proportional bars. Real figures from the metadata files;
   asset paths in /homes-config.js. ?house=utah|bell picks the initial home. */
import { HOMES, facts } from '/homes-config.js';

const S = {
  en: { bed: n => `${n} bedrooms`, bedStudio: n => `${n} bedrooms + studio annex`, bath: n => `${n} bathrooms`, gar: n => `${n} garage space${n > 1 ? 's' : ''}`, livingL: 'living', explore: n => `Explore ${n}`,
    title: ['Two homes, ', 'one place'], choose: ['Choose your ', 'home'], change: 'Change home', tabs: ['Home view', '3D model', '3D floor plan', 'Floor plan'],
    living: 'Living', entry: 'Entry', garage: 'Garage', total: 'Total', finishes: 'Proposed finishes', finish: 'Finish concept', inquiry: 'Prepare my inquiry',
    drag: 'Drag to rotate', loading: 'Loading the 3D model…', fail: '3D view unavailable on this device.', pdf: 'Open original PDF', zin: 'Zoom in', zout: 'Zoom out', fit: 'Fit',
    note: 'Presentation model · finishes proposed, not official specifications.',
    cmpTitle: ['Side by ', 'side'], rows: ['Living area', 'Entry', 'Garage', 'Total covered area', 'Bedrooms', 'Bathrooms', 'Garage spaces'],
    src: 'Official area schedules from the architectural plans (Kimsa Construction LLC). Utah: job 2025-713 · Bell: job 2024-140.', studio: '+ studio', plan: n => `Floor plan of the ${n} home` },
  es: { bed: n => `${n} dormitorios`, bedStudio: n => `${n} dormitorios + anexo estudio`, bath: n => `${n} baños`, gar: n => `${n} plaza${n > 1 ? 's' : ''} de garaje`, livingL: 'habitables', explore: n => `Explorar ${n}`,
    title: ['Dos casas, ', 'un lugar'], choose: ['Elige tu ', 'casa'], change: 'Cambiar de casa', tabs: ['Vista de la casa', 'Modelo 3D', 'Planta 3D', 'Plano'],
    living: 'Habitable', entry: 'Entrada', garage: 'Garaje', total: 'Total', finishes: 'Acabados propuestos', finish: 'Concepto de acabados', inquiry: 'Preparar mi consulta',
    drag: 'Arrastra para girar', loading: 'Cargando el modelo 3D…', fail: 'Vista 3D no disponible en este dispositivo.', pdf: 'Abrir el PDF original', zin: 'Acercar', zout: 'Alejar', fit: 'Ajustar',
    note: 'Modelo de presentación · acabados propuestos, no especificaciones oficiales.',
    cmpTitle: ['Lado a ', 'lado'], rows: ['Superficie habitable', 'Entrada', 'Garaje', 'Superficie cubierta total', 'Dormitorios', 'Baños', 'Plazas de garaje'],
    src: 'Cuadros de superficies oficiales de los planos arquitectónicos (Kimsa Construction LLC). Utah: expediente 2025-713 · Bell: expediente 2024-140.', studio: '+ estudio', plan: n => `Plano de la casa ${n}` },
  pt: { bed: n => `${n} quartos`, bedStudio: n => `${n} quartos + anexo estúdio`, bath: n => `${n} banheiros`, gar: n => `${n} vaga${n > 1 ? 's' : ''} de garagem`, livingL: 'habitáveis', explore: n => `Explorar ${n}`,
    title: ['Duas casas, ', 'um lugar'], choose: ['Escolha sua ', 'casa'], change: 'Trocar de casa', tabs: ['Vista da casa', 'Modelo 3D', 'Planta 3D', 'Planta'],
    living: 'Habitável', entry: 'Entrada', garage: 'Garagem', total: 'Total', finishes: 'Acabamentos propostos', finish: 'Conceito de acabamentos', inquiry: 'Preparar minha consulta',
    drag: 'Arraste para girar', loading: 'Carregando o modelo 3D…', fail: 'Vista 3D indisponível neste dispositivo.', pdf: 'Abrir o PDF original', zin: 'Aproximar', zout: 'Afastar', fit: 'Ajustar',
    note: 'Modelo de apresentação · acabamentos propostos, não especificações oficiais.',
    cmpTitle: ['Lado a ', 'lado'], rows: ['Área habitável', 'Entrada', 'Garagem', 'Área coberta total', 'Quartos', 'Banheiros', 'Vagas de garagem'],
    src: 'Quadros de áreas oficiais das plantas arquitetônicas (Kimsa Construction LLC). Utah: processo 2025-713 · Bell: processo 2024-140.', studio: '+ estúdio', plan: n => `Planta da casa ${n}` }
};
const lang = () => (window.rpcI18n?.language || new URLSearchParams(location.search).get('lang') || 'en').slice(0, 2);
const t = () => S[lang()] || S.en;
const nf = v => Number(v).toLocaleString({ en: 'en-US', es: 'es-ES', pt: 'pt-BR' }[lang()] || 'en-US');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const ids = ['utah', 'bell'];
const pic = (base, alt, cls = '') => `<picture class="${cls}"><source srcset="${base}.webp" type="image/webp"><img src="${base}.jpg" alt="${alt}" loading="lazy"></picture>`;
const vt = fn => (document.startViewTransition && !reduce.matches) ? document.startViewTransition(fn) : (fn(), null);
const slide = (el, dir, swap) => {
  if (!dir || reduce.matches || !el.animate) { swap(); return; }
  const out = dir > 0 ? -48 : 48;
  el.animate([{ transform: 'none', opacity: 1 }, { transform: `translateX(${out}px)`, opacity: 0 }], { duration: 280, easing: 'cubic-bezier(.65,.05,.25,1)' }).onfinish = () => {
    swap(); el.animate([{ transform: `translateX(${-out}px)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 520, easing: 'cubic-bezier(.2,.8,.2,1)' });
  };
};

const META = {};
let house = ids.includes(new URLSearchParams(location.search).get('house')) ? new URLSearchParams(location.search).get('house') : 'utah';
let tab = 0, viewer = null, viewerToken = 0, planZoom = 1;

const cardsEl = document.querySelector('[data-hm-cards]');
const viewerEl = document.querySelector('[data-hm-viewer]');
const compareEl = document.querySelector('[data-hm-compare]');
const closeCta = document.querySelector('[data-hm-close-cta]');

function specLine(id) {
  const f = facts(id, META[id]), s = t();
  return `${f.studio ? s.bedStudio(f.bedrooms) : s.bed(f.bedrooms)} · ${s.bath(f.bathrooms)} · ${nf(f.living)} ft² ${s.livingL}`;
}

/* ---------- Selector ---------- */
function renderCards() {
  const s = t();
  const ct = document.querySelector("#hm-select-title"); ct.dataset.noTranslate = ""; ct.innerHTML = s.choose[0] + "<em>" + s.choose[1] + "</em>";
  cardsEl.innerHTML = ids.map(id => `<article class="hm-card" data-id="${id}" data-active="${id === house}">
      ${pic(HOMES[id].image, '', 'hm-card-media')}
      <div class="hm-card-info" data-no-translate><h3 class="t-display hm-card-name">${HOMES[id].name}</h3><span class="t-label">${specLine(id)}</span>
        <a class="btn btn--primary hm-card-go" href="#visor" data-go="${id}"><span>${s.explore(HOMES[id].name)}</span><b aria-hidden="true">→</b></a></div>
    </article>`).join('');
  cardsEl.querySelectorAll('.hm-card').forEach(card => {
    const id = card.dataset.id;
    const expand = () => cardsEl.querySelectorAll('.hm-card').forEach(c => c.dataset.active = String(c === card));
    card.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') expand(); });
    card.addEventListener('focusin', expand);
    card.addEventListener('click', e => {
      e.preventDefault();
      const touch = !matchMedia('(hover:hover)').matches;
      if (touch && card.dataset.active !== 'true') { expand(); return; }  // first tap expands, second enters
      enter(id, card);
    });
  });
}
function enter(id, card) {
  const media = card.querySelector('.hm-card-media img');
  if (media) media.style.viewTransitionName = 'hm-shared';
  const tr = vt(() => {
    if (media) media.style.viewTransitionName = '';
    const changed = id !== house;
    house = id; tab = 0;
    renderViewer(0);
    viewerEl.scrollIntoView({ block: 'start', behavior: 'instant' });
    window.__hmMount?.();
    viewerEl.querySelector('.hm-stage').style.viewTransitionName = 'hm-shared';
    if (!changed) mountTab();
  });
  const clear = () => { const st = viewerEl.querySelector('.hm-stage'); if (st) st.style.viewTransitionName = ''; };
  tr ? tr.finished.finally(clear) : clear();
}

/* ---------- Viewer ---------- */
function sheetHTML(id) {
  const s = t(), f = facts(id, META[id]), h = HOMES[id];
  const sw = h.finishes ? `<div class="hm-finishes"><span class="t-label">${s.finishes}</span><div class="hm-swatches">${[0, 1, 2, 3].map(i => `<i style="background-image:url(${h.finishes});--sx:${[12, 38, 64, 88][i]}%"></i>`).join('')}</div><button type="button" class="link-line finish-trigger">${s.finish}</button></div>` : '';
  return `<h3 class="t-display hm-sheet-name">${h.name}</h3>
    <ul class="hm-rooms"><li class="t-label">${f.studio ? s.bedStudio(f.bedrooms) : s.bed(f.bedrooms)}</li><li class="t-label">${s.bath(f.bathrooms)}</li><li class="t-label">${s.gar(f.garage)}</li></ul>
    <dl class="hm-areas">${[[s.living, f.living], [s.entry, f.entry], [s.garage, f.garageArea]].map(([k, v]) => `<div><dt class="t-label">${k}</dt><dd class="t-label">${nf(v)} ft²</dd></div>`).join('')}
      <div class="hm-total"><dt class="t-label">${s.total}</dt><dd class="t-label">${nf(f.total)} ft²</dd></div></dl>
    ${sw}
    <a class="btn btn--primary btn--block" href="/proyecto/contacto/?house=${id}"><span>${s.inquiry}</span><b aria-hidden="true">→</b></a>
    <p class="t-small hm-note">${s.note}</p>`;
}
function renderViewer(dir = 0) {
  const s = t();
  if (!viewerEl.querySelector('.hm-v-head')) {
    viewerEl.innerHTML = `<header class="hm-v-head"><h2 class="t-display" id="hm-viewer-title" data-no-translate>${s.title[0]}<em>${s.title[1]}</em></h2>
        <div class="hm-houses" role="group" data-no-translate></div><a class="link-line hm-change" href="#hm-select-title"></a></header>
      <div class="hm-tabs" role="tablist" data-no-translate></div>
      <div class="hm-body"><div class="hm-stage"><div class="hm-pane"></div></div><aside class="hm-sheet" aria-live="polite" data-no-translate></aside></div>`;
  }
  viewerEl.querySelector('#hm-viewer-title').innerHTML = `${s.title[0]}<em>${s.title[1]}</em>`;
  viewerEl.querySelector('.hm-houses').innerHTML = ids.map(id => `<button type="button" data-house="${id}" aria-pressed="${id === house}">${HOMES[id].name}</button>`).join('');
  viewerEl.querySelector('.hm-change').textContent = s.change;
  viewerEl.querySelector('.hm-tabs').innerHTML = s.tabs.map((n, i) => `<button type="button" role="tab" aria-selected="${i === tab}" data-tab="${i}">${n}</button>`).join('');
  const sheet = viewerEl.querySelector('.hm-sheet'), stage = viewerEl.querySelector('.hm-stage');
  slide(sheet, dir, () => { sheet.innerHTML = sheetHTML(house); });
  if (dir) slide(stage, dir, () => mountTab());
  closeCta.href = '/proyecto/contacto/?house=' + house;
  const u = new URL(location.href); u.searchParams.set('house', house); history.replaceState(null, '', u);
}
viewerEl.addEventListener('click', e => {
  const hb = e.target.closest('[data-house]');
  if (hb && hb.dataset.house !== house) { const dir = ids.indexOf(hb.dataset.house) > ids.indexOf(house) ? 1 : -1; house = hb.dataset.house; renderViewer(dir); return; }
  const tb = e.target.closest('[data-tab]');
  if (tb && Number(tb.dataset.tab) !== tab) { tab = Number(tb.dataset.tab); viewerEl.querySelectorAll('[data-tab]').forEach(b => b.setAttribute('aria-selected', String(b === tb))); crossfade(); return; }
  if (e.target.closest('.hm-change')) { e.preventDefault(); document.querySelector('.hm-select').scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth' }); }
});
viewerEl.addEventListener('keydown', e => {
  const tb = e.target.closest('[role=tab]'); if (!tb || !['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
  const all = [...viewerEl.querySelectorAll('[role=tab]')]; const i = all.indexOf(tb) + (e.key === 'ArrowRight' ? 1 : -1);
  all[(i + all.length) % all.length].focus(); all[(i + all.length) % all.length].click();
});
function crossfade() {
  const pane = viewerEl.querySelector('.hm-pane');
  if (reduce.matches || !pane.animate) { mountTab(); return; }
  pane.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: 'ease' }).onfinish = () => { mountTab(); pane.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 420, easing: 'ease' }); };
}
async function turntable(pane, id) {
  // Blender sequence (when it exists): manifest.json → { frames, desktop: "desktop/frame-%03d.webp", mobile: … }
  try {
    const r = await fetch(HOMES[id].turntable + 'manifest.json', { cache: 'no-store' });
    if (!r.ok) return false;
    const m = await r.json();
    const set = matchMedia('(max-width:760px)').matches ? (m.mobile || m.desktop) : m.desktop;
    if (!m.frames || !set) return false;
    const src = i => HOMES[id].turntable + set.replace(/%0?(\d)d/, (x, n) => String(i).padStart(Number(n), '0'));
    const img = new Image(); img.className = 'hm-turntable'; img.alt = HOMES[id].name; img.draggable = false; img.src = src(0);
    pane.append(img);
    let frame = 0, x0 = null;
    const set_ = f => { frame = (f + m.frames) % m.frames; img.src = src(frame); pane.querySelector('.hm-compass i')?.style.setProperty('--az', (frame / m.frames * 360) + 'deg'); };
    img.addEventListener('pointerdown', e => { x0 = e.clientX; img.setPointerCapture(e.pointerId); });
    img.addEventListener('pointermove', e => { if (x0 == null) return; const d = Math.round((e.clientX - x0) / 12); if (d) { set_(frame - d); x0 = e.clientX; } });
    img.addEventListener('pointerup', () => { x0 = null; });
    img.tabIndex = 0; img.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') set_(frame - 1); if (e.key === 'ArrowRight') set_(frame + 1); });
    for (let i = 1; i < m.frames; i++) { const p = new Image(); p.src = src(i); }
    return true;
  } catch { return false; }
}
async function mountTab() {
  const s = t(), id = house, token = ++viewerToken;
  viewer?.dispose(); viewer = null;
  const pane = viewerEl.querySelector('.hm-pane');
  pane.innerHTML = ''; pane.dataset.tab = tab;
  if (tab === 3) {
    planZoom = 1;
    pane.innerHTML = `<div class="hm-plan"><img src="${HOMES[id].plan}" alt="${s.plan(HOMES[id].name)}"></div>
      <div class="hm-plan-bar"><span class="t-small">${facts(id, META[id]).source}</span><div class="hm-plan-tools"><button type="button" data-z="-1" aria-label="${s.zout}">−</button><button type="button" data-z="1" aria-label="${s.zin}">+</button><button type="button" data-z="0" aria-label="${s.fit}">⤢</button></div><a class="link-line" href="${HOMES[id].planPdf}" target="_blank" rel="noopener">${s.pdf}</a></div>`;
    const img = pane.querySelector('.hm-plan img');
    pane.querySelectorAll('[data-z]').forEach(b => b.onclick = () => { const z = Number(b.dataset.z); planZoom = z ? Math.max(1, Math.min(3, planZoom + z * .5)) : 1; img.style.transform = `scale(${planZoom})`; pane.querySelector('.hm-plan').classList.toggle('is-zoomed', planZoom > 1); });
    return;
  }
  pane.innerHTML = `<div class="hm-3d" aria-busy="true"><p class="hm-loading t-small">${s.loading}</p></div>
    ${tab === 0 ? `<div class="hm-hint t-label"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 0 1 16 0M20 12l-3-3M20 12l3-3"/></svg>${s.drag}</div><div class="hm-compass" aria-hidden="true"><span class="t-label">N</span><i></i></div>` : ''}`;
  if (tab === 0 && await turntable(pane.querySelector('.hm-3d'), id)) { pane.querySelector('.hm-loading')?.remove(); return; }
  try {
    const { createViewer } = await import('/proyecto/viewer.js?v=homes2');
    if (token !== viewerToken) return;
    const host = pane.querySelector('.hm-3d');
    const v = await createViewer(host, id, { model: tab === 2 ? HOMES[id].floor3d : HOMES[id].model3d });
    if (token !== viewerToken) { v.dispose(); return; }
    viewer = v; host.setAttribute('aria-busy', 'false');
    if (tab === 2) { v.roof(false); v.camera('above'); } else v.camera('front');
    const needle = pane.querySelector('.hm-compass i');
    if (needle) v.onRotate(az => needle.style.setProperty('--az', (-az * 180 / Math.PI) + 'deg'));
  } catch (e) { pane.querySelector('.hm-3d').innerHTML = `<p class="hm-loading t-small">${s.fail}</p>`; }
}

/* ---------- Comparison ---------- */
function renderCompare() {
  const s = t(), F = Object.fromEntries(ids.map(id => [id, facts(id, META[id])]));
  const rows = [['living', 'ft2'], ['entry', 'ft2'], ['garageArea', 'ft2'], ['total', 'ft2'], ['bedrooms', 'n'], ['bathrooms', 'n'], ['garage', 'n']];
  compareEl.innerHTML = `<h2 class="t-display" id="hm-compare-title" data-no-translate>${s.cmpTitle[0]}<em>${s.cmpTitle[1]}</em></h2>
    <div class="hm-cmp" data-no-translate><div class="hm-cmp-head"><span></span>${ids.map(id => `<figure>${pic(HOMES[id].thumb, '', 'hm-cmp-img')}<figcaption class="t-title">${HOMES[id].name}</figcaption></figure>`).join('')}</div>
    ${rows.map(([k, u], r) => {
      const vals = ids.map(id => F[id][k]), max = Math.max(...vals);
      return `<div class="hm-cmp-row"><span class="t-label">${s.rows[r]}</span>${ids.map((id, i) => {
        const v = vals[i], top = v === max && vals.some(x => x !== max);
        const label = u === 'ft2' ? `${nf(v)} ft²` : `${v}${k === 'bedrooms' && F[id].studio ? ' ' + s.studio : ''}`;
        return `<div class="hm-cmp-cell${top ? ' is-max' : ''}">${u === 'ft2' ? `<span class="hm-bar" style="--w:${(v / Math.max(...rows.filter(x => x[1] === 'ft2').map(x => Math.max(...ids.map(j => F[j][x[0]])))) * 100).toFixed(1)}%"><i></i></span>` : ''}<strong class="t-title">${label}</strong></div>`;
      }).join('')}</div>`;
    }).join('')}</div>
    <p class="t-small hm-cmp-src">${s.src}</p>`;
  new IntersectionObserver(([e], io) => { if (e.isIntersecting) { compareEl.classList.add('is-drawn'); io.disconnect(); } }, { threshold: .25 }).observe(compareEl.querySelector('.hm-cmp'));
  window.rpMotion?.bind?.();
}

/* ---------- Boot ---------- */
Promise.all(ids.map(id => fetch(HOMES[id].metadata).then(r => r.json()).then(m => { META[id] = m; }))).then(() => {
  renderCards(); renderViewer(0); renderCompare();
  // The GLB (several MB) loads only when the viewer approaches the viewport.
  let mounted = false;
  const mountOnce = () => { if (!mounted) { mounted = true; mountTab(); } };
  new IntersectionObserver(([e], io) => { if (e.isIntersecting) { io.disconnect(); mountOnce(); } }, { rootMargin: "300px 0px" }).observe(viewerEl);
  window.__hmMount = mountOnce;
  document.addEventListener('rpc:language', () => { renderCards(); renderViewer(0); renderCompare(); if (mounted) mountTab(); });
});
