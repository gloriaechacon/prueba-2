/* proyecto/viviendas — House models: selector (two tall cards), viewer with two 3D tabs, a full floor plan and a
   spec sheet, and an illustrative home comparison. Real figures from the metadata files;
   asset paths in /homes-config.js. ?house=utah|bell picks the initial home. */
import { HOMES, facts } from '/homes-config.js?v=review2';

const S = {
  en: { bed: n => `${n} bedrooms`, bedStudio: n => `${n} bedrooms + studio annex`, bath: n => `${n} bathrooms`, gar: n => `${n} garage space${n > 1 ? 's' : ''}`, livingL: 'living', explore: n => `Explore ${n}`,
    title: ['Two homes, ', 'one place'], choose: ['Choose your ', 'home'], change: 'Change home', tabs: ['Home view', '3D model', '3D floor plan', 'Floor plan'],
    living: 'Living', entry: 'Entry', garage: 'Garage', total: 'Total', finishes: 'Proposed finishes', finish: 'Finish concept', inquiry: 'Prepare my inquiry',
    drag: 'Drag to rotate', loading: 'Loading the 3D model…', fail: '3D view unavailable on this device.', pdf: 'Open original PDF', zin: 'Zoom in', zout: 'Zoom out', fit: 'Fit',
    note: 'Presentation model · finishes proposed, not official specifications.',
    cmpTitle: ['Side by ', 'side'], rows: ['Living area', 'Entry', 'Garage', 'Total covered area', 'Bedrooms', 'Bathrooms', 'Garage spaces'],
    diff: { living: 'living', entry: 'entry', garageArea: 'garage', total: 'total', bedrooms: 'bedroom', bathrooms: 'bathroom', garage: 'garage space' }, gallery: 'Finishes', close: 'Close', prev: 'Previous', next: 'Next', note2: 'Proposed finishes, not official specifications', finishSub: 'Exterior and kitchen · open the images', illus: 'Illustrative image', full: 'Full screen',
    src: 'Official area schedules from the architectural plans (Kimsa Construction LLC). Utah: job 2025-713 · Bell: job 2024-140.', studio: '+ studio', plan: n => `Floor plan of the ${n} home` },
  es: { bed: n => `${n} dormitorios`, bedStudio: n => `${n} dormitorios + anexo estudio`, bath: n => `${n} baños`, gar: n => `${n} plaza${n > 1 ? 's' : ''} de garaje`, livingL: 'habitables', explore: n => `Explorar ${n}`,
    title: ['Dos casas, ', 'un lugar'], choose: ['Elige tu ', 'casa'], change: 'Cambiar de casa', tabs: ['Vista de la casa', 'Modelo 3D', 'Planta 3D', 'Plano'],
    living: 'Habitable', entry: 'Entrada', garage: 'Garaje', total: 'Total', finishes: 'Acabados propuestos', finish: 'Concepto de acabados', inquiry: 'Preparar mi consulta',
    drag: 'Arrastra para girar', loading: 'Cargando el modelo 3D…', fail: 'Vista 3D no disponible en este dispositivo.', pdf: 'Abrir el PDF original', zin: 'Acercar', zout: 'Alejar', fit: 'Ajustar',
    note: 'Modelo de presentación · acabados propuestos, no especificaciones oficiales.',
    cmpTitle: ['Lado a ', 'lado'], rows: ['Superficie habitable', 'Entrada', 'Garaje', 'Superficie cubierta total', 'Dormitorios', 'Baños', 'Plazas de garaje'],
    diff: { living: 'habitables', entry: 'de entrada', garageArea: 'de garaje', total: 'en total', bedrooms: 'dormitorio', bathrooms: 'baño', garage: 'plaza de garaje' }, gallery: 'Acabados', close: 'Cerrar', prev: 'Anterior', next: 'Siguiente', note2: 'Acabados propuestos, no especificaciones oficiales', finishSub: 'Exterior y cocina · ver las imágenes', illus: 'Imagen ilustrativa', full: 'Pantalla completa',
    src: 'Cuadros de superficies oficiales de los planos arquitectónicos (Kimsa Construction LLC). Utah: expediente 2025-713 · Bell: expediente 2024-140.', studio: '+ estudio', plan: n => `Plano de la casa ${n}` },
  pt: { bed: n => `${n} quartos`, bedStudio: n => `${n} quartos + anexo estúdio`, bath: n => `${n} banheiros`, gar: n => `${n} vaga${n > 1 ? 's' : ''} de garagem`, livingL: 'habitáveis', explore: n => `Explorar ${n}`,
    title: ['Duas casas, ', 'um lugar'], choose: ['Escolha sua ', 'casa'], change: 'Trocar de casa', tabs: ['Vista da casa', 'Modelo 3D', 'Planta 3D', 'Planta'],
    living: 'Habitável', entry: 'Entrada', garage: 'Garagem', total: 'Total', finishes: 'Acabamentos propostos', finish: 'Conceito de acabamentos', inquiry: 'Preparar minha consulta',
    drag: 'Arraste para girar', loading: 'Carregando o modelo 3D…', fail: 'Vista 3D indisponível neste dispositivo.', pdf: 'Abrir o PDF original', zin: 'Aproximar', zout: 'Afastar', fit: 'Ajustar',
    note: 'Modelo de apresentação · acabamentos propostos, não especificações oficiais.',
    cmpTitle: ['Lado a ', 'lado'], rows: ['Área habitável', 'Entrada', 'Garagem', 'Área coberta total', 'Quartos', 'Banheiros', 'Vagas de garagem'],
    diff: { living: 'habitáveis', entry: 'de entrada', garageArea: 'de garagem', total: 'no total', bedrooms: 'quarto', bathrooms: 'banheiro', garage: 'vaga de garagem' }, gallery: 'Acabamentos', close: 'Fechar', prev: 'Anterior', next: 'Próximo', note2: 'Acabamentos propostos, não especificações oficiais', finishSub: 'Exterior e cozinha · ver as imagens', illus: 'Imagem ilustrativa', full: 'Tela cheia',
    src: 'Quadros de áreas oficiais das plantas arquitetônicas (Kimsa Construction LLC). Utah: processo 2025-713 · Bell: processo 2024-140.', studio: '+ estúdio', plan: n => `Planta da casa ${n}` }
};
const lang = () => (window.rpcI18n?.language || new URLSearchParams(location.search).get('lang') || 'en').slice(0, 2);
const t = () => S[lang()] || S.en;
const nf = v => Number(v).toLocaleString({ en: 'en-US', es: 'es-ES', pt: 'pt-BR' }[lang()] || 'en-US');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const ids = ['utah', 'bell'];
// img: a base path (base.webp + base.jpg) or a responsive set { base, w: [widths] } → base-<w>.webp|jpg
const pic = (img, alt, cls = '', sizes = '100vw') => typeof img === 'object' && img ? `<picture class="${cls}"><source type="image/webp" srcset="${img.w.map(w => `${img.base}-${w}.webp ${w}w`).join(', ')}" sizes="${sizes}"><img src="${img.base}-${img.w[0]}.jpg" srcset="${img.w.map(w => `${img.base}-${w}.jpg ${w}w`).join(', ')}" sizes="${sizes}" alt="${alt}" loading="lazy" decoding="async"></picture>` : picBase(img, alt, cls);
// selector card: vertical crop on phones, horizontal on wider screens
const cardPic = h => `<picture class="hm-card-media"><source media="(max-width:760px)" type="image/webp" srcset="${h.photoTall.w.map(w => `${h.photoTall.base}-${w}.webp ${w}w`).join(', ')}" sizes="100vw"><source type="image/webp" srcset="${h.photo.w.map(w => `${h.photo.base}-${w}.webp ${w}w`).join(', ')}" sizes="55vw"><img src="${h.photo.base}-${h.photo.w[0]}.jpg" srcset="${h.photo.w.map(w => `${h.photo.base}-${w}.jpg ${w}w`).join(', ')}" sizes="55vw" alt="" loading="lazy" decoding="async"></picture>`;
const picBase = (base, alt, cls = '') => `<picture class="${cls}"><source srcset="${base}.webp" type="image/webp"><img src="${base}.jpg" alt="${alt}" loading="lazy"></picture>`;
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
let tab = 1, viewer = null, viewerToken = 0;

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
      ${HOMES[id].photo ? cardPic(HOMES[id]) : pic(HOMES[id].image, '', 'hm-card-media')}${HOMES[id].illustrative ? `<small class="t-small hm-illus">${s.illus}</small>` : ''}
      <div class="hm-card-info" data-no-translate><h3 class="t-display hm-card-name">${HOMES[id].name}</h3><span class="t-label">${specLine(id)}</span>
        <a class="btn btn--primary hm-card-go" href="#visor" data-go="${id}"><span>${s.explore(HOMES[id].name)}</span></a></div>
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
    house = id; tab = 1;
    renderViewer(0);
    viewerEl.scrollIntoView({ block: 'start', behavior: 'instant' });
    window.__hmMount?.();
    viewerEl.querySelector('.hm-stage').style.viewTransitionName = 'hm-shared';
  });
  const clear = () => { const st = viewerEl.querySelector('.hm-stage'); if (st) st.style.viewTransitionName = ''; };
  tr ? tr.finished.finally(clear) : clear();
}

/* ---------- Viewer ---------- */
function sheetHTML(id) {
  const s = t(), f = facts(id, META[id]), h = HOMES[id];
  const fin = h.finishes || [];
  const c = fin.find(x => x.concept) || fin[0];
  const sw = c ? `<button type="button" class="hm-finish-card" data-fin="${fin.indexOf(c)}"><img src="${c.src}.webp" alt="" loading="lazy" decoding="async"><span class="hm-finish-txt"><span class="t-label">${s.finish}</span><small class="t-small">${s.finishSub}</small></span><svg class="hm-finish-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/></svg></button>` : '';
  return `<h3 class="t-display hm-sheet-name">${h.name}</h3>
    <ul class="hm-rooms"><li class="t-label">${f.studio ? s.bedStudio(f.bedrooms) : s.bed(f.bedrooms)}</li><li class="t-label">${s.bath(f.bathrooms)}</li><li class="t-label">${s.gar(f.garage)}</li></ul>
    <dl class="hm-areas">${[[s.living, f.living], [s.entry, f.entry], [s.garage, f.garageArea]].map(([k, v]) => `<div><dt class="t-label">${k}</dt><dd class="t-label">${nf(v)} ft²</dd></div>`).join('')}
      <div class="hm-total"><dt class="t-label">${s.total}</dt><dd class="t-label">${nf(f.total)} ft²</dd></div></dl>
    ${sw}
    <a class="btn btn--primary btn--block" href="/proyecto/contacto/?house=${id}#c-consultation"><span>${s.inquiry}</span></a>
    `;
}
function renderViewer(dir = 0) {
  const s = t();
  if (!viewerEl.querySelector('.hm-v-head')) {
    viewerEl.innerHTML = `<header class="hm-v-head"><h2 class="t-display" id="hm-viewer-title" data-no-translate>${s.title[0]}<em>${s.title[1]}</em></h2>
</header>
      <div class="hm-controls"><div class="hm-tabs" role="tablist" data-no-translate></div><div class="hm-houses" role="group" aria-label="Utah | Bell" data-no-translate></div></div>
      <div class="hm-body"><div class="hm-stage"><div class="hm-pane"></div></div><aside class="hm-sheet" aria-live="polite" data-no-translate></aside></div>`;
  }
  viewerEl.querySelector('#hm-viewer-title').innerHTML = `${s.title[0]}<em>${s.title[1]}</em>`;
  viewerEl.querySelector('.hm-houses').innerHTML = ids.map(id => `<button type="button" data-house="${id}" aria-pressed="${id === house}">${HOMES[id].name}</button>`).join('');
  viewerEl.querySelector('.hm-tabs').innerHTML = s.tabs.map((n, i) => ({n, i})).filter(({i}) => i === 1 || i === 2).map(({n, i}) => `<button type="button" role="tab" aria-selected="${i === tab}" data-tab="${i}">${n}</button>`).join('');
  const sheet = viewerEl.querySelector('.hm-sheet'), stage = viewerEl.querySelector('.hm-stage');
  slide(sheet, dir, () => { sheet.innerHTML = sheetHTML(house); });
  if (dir) slide(stage, dir, () => mountTab());
  let plan = viewerEl.querySelector('.hm-plan-section');
  if (!plan) { plan = document.createElement('section'); plan.className = 'hm-plan-section'; plan.dataset.noTranslate = ''; viewerEl.append(plan); }
  plan.innerHTML = `<header><h3 class="t-title">${s.plan(HOMES[house].name)}</h3><a class="btn btn--secondary" href="${HOMES[house].planPdf}" target="_blank" rel="noopener">${s.pdf}</a></header><figure class="hm-plan-paper"><img src="${HOMES[house].plan}" alt="${s.plan(HOMES[house].name)}" loading="lazy" decoding="async"></figure>`;
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
async function mountTab() {
  const s = t(), id = house, token = ++viewerToken;
  viewer?.dispose(); viewer = null;
  const pane = viewerEl.querySelector('.hm-pane');
  pane.innerHTML = ''; pane.dataset.tab = tab;
  pane.innerHTML = `<div class="hm-3d" aria-busy="true"><p class="hm-loading t-small">${s.loading}</p></div>`;
  try {
    const { createViewer } = await import('/proyecto/viewer.js?v=review3');
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

/* ---------- Finishes gallery (same style as the Lots gallery) ---------- */
const finDlg = document.createElement('dialog');
finDlg.className = 'lx-gallery hm-fin-gallery'; finDlg.dataset.noTranslate = '';
document.body.append(finDlg);
let finIndex = 0;
const ARR = d => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + (d > 0 ? 'M4 12h15M13 6l6 6-6 6' : 'M20 12H5M11 6l-6 6 6 6') + '"/></svg>';
function finShow(dir = 0) {
  const list = HOMES[house].finishes || [], it = list[finIndex]; if (!it) return;
  const frame = finDlg.querySelector('.lxg-frame');
  const build = () => { frame.innerHTML = '<picture class="hm-fin-pic"><source srcset="' + it.src + '.webp" type="image/webp"><img src="' + it.src + '.jpg" alt="' + it.label + '" decoding="async"></picture>'; };
  if (dir && !reduce.matches && frame.firstChild) {
    const out = dir > 0 ? -60 : 60;
    frame.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateX(' + out + 'px)', opacity: 0 }], { duration: 240 }).onfinish = () => { build(); frame.animate([{ transform: 'translateX(' + (-out) + 'px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 440, easing: 'cubic-bezier(.2,.8,.2,1)' }); };
  } else build();
  finDlg.querySelector('.lxg-count').textContent = it.label + ' · ' + (finIndex + 1) + ' / ' + list.length;
  finDlg.querySelectorAll('[data-gi]').forEach((b, i) => b.setAttribute('aria-pressed', String(i === finIndex)));
}
function openFinishes(i, from) {
  const s = t(), list = HOMES[house].finishes || []; finIndex = Math.max(0, i);
  finDlg.innerHTML = '<header class="lxg-head"><h2 class="t-title">' + HOMES[house].name + ' · ' + s.gallery + '</h2><button type="button" class="lxg-close t-button">' + s.close + ' <span aria-hidden="true">✕</span></button></header>'
    + '<div class="lxg-stage"><div class="lxg-frame"></div><button type="button" class="rp-arrow lxg-prev" data-gdir="-1" aria-label="' + s.prev + '"><span class="rp-arrow-ico">' + ARR(-1) + '</span></button><button type="button" class="rp-arrow lxg-next" data-gdir="1" aria-label="' + s.next + '"><span class="rp-arrow-ico">' + ARR(1) + '</span></button></div>'
    + '<footer class="lxg-foot"><span class="lxg-count t-label"></span><div class="lxg-thumbs">' + list.map((x, k) => '<button type="button" class="lx-thumb" data-gi="' + k + '" aria-label="' + x.label + '"><img src="' + x.src + '.webp" alt="" loading="lazy"></button>').join('') + '</div><p class="t-small lxg-note">' + s.note2 + '</p></footer>';
  finDlg.querySelectorAll('[data-gdir]').forEach(b => { b.hidden = list.length < 2; });
  const img = from && from.querySelector('img');
  if (img) img.style.viewTransitionName = 'hm-fin';
  const tr = vt(() => { if (img) img.style.viewTransitionName = ''; finDlg.showModal(); finShow(0); finDlg.querySelector('.lxg-frame').style.viewTransitionName = 'hm-fin'; });
  const clear = () => { const f = finDlg.querySelector('.lxg-frame'); if (f) f.style.viewTransitionName = ''; };
  tr ? tr.finished.finally(clear) : clear();
}
function closeFinishes() { vt(() => finDlg.close()); }
finDlg.addEventListener('cancel', e => { e.preventDefault(); closeFinishes(); });
finDlg.addEventListener('click', e => {
  if (e.target.closest('.lxg-close')) return closeFinishes();
  const n = (HOMES[house].finishes || []).length;
  const d = e.target.closest('[data-gdir]'); if (d) { finIndex = (finIndex + Number(d.dataset.gdir) + n) % n; finShow(Number(d.dataset.gdir)); return; }
  const g = e.target.closest('[data-gi]'); if (g) { const i = Number(g.dataset.gi), dir = Math.sign(i - finIndex); finIndex = i; finShow(dir); }
});
finDlg.addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); finDlg.querySelector(e.key === 'ArrowRight' ? '.lxg-next' : '.lxg-prev')?.click(); } });
viewerEl.addEventListener('click', e => { const b = e.target.closest('[data-fin]'); if (b) openFinishes(Number(b.dataset.fin), b); });

/* ---------- Comparison ---------- */
function renderCompare() {
  const s = t(), F = Object.fromEntries(ids.map(id => [id, facts(id, META[id])]));
  const rows = [['living', 'ft2'], ['entry', 'ft2'], ['garageArea', 'ft2'], ['total', 'ft2'], ['bedrooms', 'n'], ['bathrooms', 'n'], ['garage', 'n']];
  compareEl.innerHTML = `<h2 class="t-display" id="hm-compare-title" data-no-translate>${s.cmpTitle[0]}<em>${s.cmpTitle[1]}</em></h2>
    <div class="hm-cmp" data-no-translate><div class="hm-cmp-head"><span></span>${ids.map(id => `<figure>${pic(HOMES[id].photo || HOMES[id].thumb, HOMES[id].name, 'hm-cmp-img', '(max-width:760px) 50vw, 40vw')}<figcaption class="t-display hm-cmp-name">${HOMES[id].name}</figcaption></figure>`).join('')}</div>
    ${rows.map(([k, u], r) => {
      const vals = ids.map(id => F[id][k]), max = Math.max(...vals);
      return `<div class="hm-cmp-row"><span class="t-label">${s.rows[r]}</span>${ids.map((id, i) => {
        const v = vals[i], other = vals[1 - i], top = v === max && vals.some(x => x !== max);
        const diff = v - other;
        const note = diff > 0 ? `<small class="t-small hm-cmp-diff">+${nf(diff)}${u === 'ft2' ? ' ft²' : ''} ${s.diff[k]}</small>` : '';
        const label = u === 'ft2' ? `${nf(v)} ft²` : `${v}${k === 'bedrooms' && F[id].studio ? ' ' + s.studio : ''}`;
        return `<div class="hm-cmp-cell${top ? ' is-max' : ''}"><strong class="t-title">${label}</strong>${note}</div>`;
      }).join('')}</div>`;
    }).join('')}</div>
    <p class="t-small hm-cmp-src">${s.src}</p>`;
  window.rpMotion?.bind?.();
}

/* ---------- Boot ---------- */
Promise.all(ids.map(id => fetch(HOMES[id].metadata).then(r => r.json()).then(m => { META[id] = m; }))).then(() => {
  renderCards(); renderViewer(0); renderCompare();
  // The GLB (several MB) loads only when the viewer approaches the viewport.
  let mounted = false;
  const mountOnce = () => { if (!mounted) { mounted = true; mountTab(); } };
  new IntersectionObserver(([e], io) => { if (e.isIntersecting) { io.disconnect(); (window.requestIdleCallback || setTimeout)(mountOnce, { timeout: 600 }); } }, { rootMargin: "0px 0px -15% 0px" }).observe(viewerEl);
  window.__hmMount = () => { mounted = true; mountTab(); };
  document.addEventListener('rpc:language', () => { renderCards(); renderViewer(0); renderCompare(); if (mounted) mountTab(); });
});
