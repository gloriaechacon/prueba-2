/* proyecto/lotes — fixed side panel over the Cesium map (iframe /a/?embed=lotes2).
   Index 01–06 with arrows and progress, lot sheet (area counts up), Photos | 360° media with
   thumbnails, a single "Ask about this lot" button and a full-screen gallery that opens from the
   tapped thumbnail (shared-element view transition). State goes through the hidden #c-lot select,
   so detail.js keeps ?lot= in the URL and tour-refinement.js keeps the map in step. */
import { panorama } from '/proyecto/lot-panorama.js';

const S = {
  en: { lot: 'Lot', area: 'Area', street: 'Street', status: 'Status', available: 'Available', sold: 'Sold', photos: 'Photos', p360: '360°', mls: 'MLS · supplied by the client', tbc: 'Area to be confirmed', ask: 'Ask about this lot', photo: 'Photo', outline: 'Show outline', note: 'Indicative outline, pending confirmation', close: 'Close', prev: 'Previous', next: 'Next', open: 'Open the gallery', expand: 'Lot details', drag: 'Drag to look around', gmaps: 'Open in Google Maps' },
  es: { lot: 'Lote', area: 'Superficie', street: 'Calle', status: 'Estado', available: 'Disponible', sold: 'Vendido', photos: 'Fotos', p360: '360°', mls: 'MLS · aportado por el cliente', tbc: 'Superficie por confirmar', ask: 'Consultar por este lote', photo: 'Foto', outline: 'Mostrar contorno', note: 'Contorno indicativo, pendiente de confirmación', close: 'Cerrar', prev: 'Anterior', next: 'Siguiente', open: 'Abrir la galería', expand: 'Ficha del lote', drag: 'Arrastra para mirar alrededor', gmaps: 'Abrir en Google Maps' },
  pt: { lot: 'Lote', area: 'Área', street: 'Rua', status: 'Status', available: 'Disponível', sold: 'Vendido', photos: 'Fotos', p360: '360°', mls: 'MLS · fornecido pelo cliente', tbc: 'Área a confirmar', ask: 'Consultar sobre este lote', photo: 'Foto', outline: 'Mostrar contorno', note: 'Contorno indicativo, pendente de confirmação', close: 'Fechar', prev: 'Anterior', next: 'Próximo', open: 'Abrir a galeria', expand: 'Ficha do lote', drag: 'Arraste para olhar ao redor', gmaps: 'Abrir no Google Maps' }
};
const lang = () => (window.rpcI18n?.language || new URLSearchParams(location.search).get('lang') || 'en').slice(0, 2);
const t = () => S[lang()] || S.en;
const locale = () => ({ en: 'en-US', es: 'es-ES', pt: 'pt-BR' }[lang()] || 'en-US');
const pad = n => String(n).padStart(2, '0');
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const base = '/assets/lot-photos/';
const thumbOf = f => base + f.replace(/\.jpg$/i, '-thumb.jpg');
const ARROW = d => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d > 0 ? 'M4 12h15M13 6l6 6-6 6' : 'M20 12H5M11 6l-6 6 6 6'}"/></svg>`;
const ease = 'cubic-bezier(.65,.05,.25,1)';

const select = document.querySelector('#c-lot');
const panel = document.querySelector('.lx-panel');
if (select && panel) {
  const RP = window.rpcLots;
  const ids = RP.order.map(n => 'RP-' + pad(n));
  let lots = [], catalog = {}, current = null, type = 'photo', mediaIndex = 0, outlineOn = true;

  /* ---------- Static parts of the panel ---------- */
  const index = panel.querySelector('.lx-index');
  index.innerHTML = ids.map((id, i) => `<button type="button" data-lot="${id}" aria-pressed="false" data-no-translate>${pad(i + 1)}</button>`).join('');
  const nav = panel.querySelector('.lx-nav');
  nav.innerHTML = `<button type="button" class="rp-arrow" data-dir="-1"><span class="rp-arrow-ico">${ARROW(-1)}</span></button>
    <div class="rp-progress-wrap"><span class="lx-count" data-no-translate>01 / ${pad(ids.length)}</span><span class="rp-progress" aria-hidden="true"><i></i></span></div>
    <button type="button" class="rp-arrow" data-dir="1"><span class="rp-arrow-ico">${ARROW(1)}</span></button>`;
  const sheet = panel.querySelector('.lx-sheet');
  const media = panel.querySelector('.lx-media');
  const cta = panel.querySelector('.lx-cta');
  const handle = panel.querySelector('.lx-handle');

  const choose = id => { if (!id || id === select.value) return; select.value = id; select.dispatchEvent(new Event('change')); };
  index.addEventListener('click', e => { const b = e.target.closest('[data-lot]'); if (b) choose(b.dataset.lot); });
  nav.addEventListener('click', e => {
    const b = e.target.closest('[data-dir]'); if (!b) return;
    const i = ids.indexOf(select.value); const k = i < 0 ? 0 : (i + Number(b.dataset.dir) + ids.length) % ids.length;
    choose(ids[k]);
  });
  handle?.addEventListener('click', () => { const on = !panel.classList.contains('is-expanded'); panel.classList.toggle('is-expanded', on); handle.setAttribute('aria-expanded', String(on)); });
  // Swipe on the handle (phone sheet)
  let y0 = null;
  handle?.addEventListener('pointerdown', e => { y0 = e.clientY; });
  addEventListener('pointerup', e => { if (y0 == null) return; const dy = e.clientY - y0; y0 = null; if (Math.abs(dy) > 30) { panel.classList.toggle('is-expanded', dy < 0); handle.setAttribute('aria-expanded', String(dy < 0)); } });

  /* ---------- Rendering ---------- */
  function swap(el, html, dir) {
    if (!dir || reduce.matches || !el.animate || !el.innerHTML.trim()) { el.innerHTML = html; return Promise.resolve(); }
    const out = dir > 0 ? -40 : 40;
    el.getAnimations().forEach(a => a.cancel());
    return new Promise(res => {
      el.animate([{ transform: 'translateX(0)', opacity: 1 }, { transform: `translateX(${out}px)`, opacity: 0 }], { duration: 300, easing: ease, fill: 'forwards' }).onfinish = () => {
        el.innerHTML = html;
        el.animate([{ transform: `translateX(${-out}px)`, opacity: 0 }, { transform: 'translateX(0)', opacity: 1 }], { duration: 560, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' });
        res();
      };
    });
  }
  function countUp(el, value, dec) {
    const fmt = v => v.toLocaleString(locale(), { minimumFractionDigits: dec, maximumFractionDigits: dec });
    if (reduce.matches) { el.textContent = fmt(value); return; }
    const t0 = performance.now(), ms = 900;
    const step = now => { const k = Math.min(1, (now - t0) / ms); el.textContent = fmt(value * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  function sheetHTML(lot) {
    const s = t(), n = RP.number(lot.id), mls = lot.mlsReported && typeof lot.mlsReported.acres === 'number';
    const area = mls
      ? `<dd><span class="lx-acres t-title"><span data-count="${lot.mlsReported.acres}" data-no-translate>0</span> acres</span><span class="t-label" data-no-translate>${Math.round(lot.mlsReported.areaSqFt).toLocaleString(locale())} ft²</span><small class="t-small">${s.mls}</small></dd>`
      : `<dd><span class="lx-acres t-title">${s.tbc}</span></dd>`;
    const maps = lot.sourceURL || `https://www.google.com/maps/search/?api=1&query=${lot.pin.lat},${lot.pin.lon}`;
    return `<div class="lx-sheet-in" data-no-translate>
      <h2 class="t-title lx-lotname">${n ? `${s.lot} ${n}` : s.sold}</h2>
      <dl class="lx-facts">
        <div class="lx-fact-area"><dt class="t-label">${s.area}</dt>${area}</div>
        <div><dt class="t-label">${s.street}</dt><dd><a class="link-line" href="${esc(maps)}" target="_blank" rel="noopener" title="${s.gmaps}">${esc(lot.front?.nearestStreet || '—')}</a></dd></div>
        <div><dt class="t-label">${s.status}</dt><dd><span class="lx-pill t-label ${n ? '' : 'is-sold'}">${n ? s.available : s.sold}</span></dd></div>
      </dl></div>`;
  }
  function items(id) { return (catalog[id] || []).filter(x => !x.hidden); }
  function mediaHTML(id) {
    const s = t(), list = items(id), photos = list.filter(x => x.type === 'photo'), panos = list.filter(x => x.type === '360');
    if (!list.length) return '';
    if (type === 'photo' && !photos.length) type = '360';
    if (type === '360' && !panos.length) type = 'photo';
    const cur = type === 'photo' ? photos : panos;
    mediaIndex = Math.min(mediaIndex, cur.length - 1);
    const tabs = `<div class="lx-tabs" role="tablist" data-no-translate>
      <button type="button" role="tab" aria-selected="${type === 'photo'}" data-type="photo" ${photos.length ? '' : 'disabled'}>${s.photos}</button>
      <button type="button" role="tab" aria-selected="${type === '360'}" data-type="360" ${panos.length ? '' : 'disabled'}>${s.p360}</button></div>`;
    const thumbs = cur.map((it, i) => `<button type="button" class="lx-thumb" data-i="${i}" aria-pressed="${i === mediaIndex}" style="--i:${i}" aria-label="${type === 'photo' ? s.photo + ' ' + (i + 1) : '360° ' + (i + 1)}"><img src="${thumbOf(it.file)}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${base + it.file}'">${type === '360' ? '<span class="lx-badge t-label">360°</span>' : ''}</button>`).join('');
    return `${tabs}<button type="button" class="lx-main" aria-label="${s.open}"><span class="lx-main-frame"></span>${type === '360' ? '<span class="lx-badge t-label">360°</span>' : ''}</button><div class="lx-thumbs">${thumbs}</div>`;
  }
  function showMain(animate) {
    const list = items(current).filter(x => x.type === type), it = list[mediaIndex];
    const frame = media.querySelector('.lx-main-frame'); if (!frame || !it) return;
    const img = new Image(); img.alt = ''; img.className = 'lx-main-img'; img.src = base + it.file;
    const old = [...frame.querySelectorAll('img')];
    const done = () => { frame.append(img); requestAnimationFrame(() => img.classList.add('is-in', animate && !reduce.matches ? 'is-kb' : 'is-still')); setTimeout(() => old.forEach(o => o.remove()), 800); };
    if (img.complete) done(); else { img.onload = done; img.onerror = done; }
    media.querySelectorAll('.lx-thumb').forEach((b, i) => b.setAttribute('aria-pressed', String(i === mediaIndex)));
  }
  async function render(id, dir = 0) {
    const lot = lots.find(l => l.id === id); if (!lot) return;
    const changed = id !== current;
    current = id;
    if (changed) { type = 'photo'; mediaIndex = 0; }
    const n = RP.number(id), i = ids.indexOf(id);
    index.querySelectorAll('[data-lot]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lot === id)));
    nav.querySelector('.lx-count').textContent = `${n ? pad(n) : '—'} / ${pad(ids.length)}`;
    nav.querySelector('.rp-progress i').style.transform = `scaleX(${n ? n / ids.length : 0})`;
    nav.querySelector('[data-dir="-1"]').setAttribute('aria-label', t().prev);
    nav.querySelector('[data-dir="1"]').setAttribute('aria-label', t().next);
    handle?.setAttribute('aria-label', t().expand);
    cta.hidden = !n;
    cta.href = '/proyecto/contacto/' + (n ? '?lot=' + n : '');
    cta.querySelector('span').textContent = t().ask;
    await Promise.all([swap(sheet, sheetHTML(lot), changed ? dir : 0), swap(media, mediaHTML(id), changed ? dir : 0)]);
    const c = sheet.querySelector('[data-count]'); if (c) countUp(c, Number(c.dataset.count), 2);
    media.classList.toggle('is-empty', !items(id).length);
    if (changed && !reduce.matches) media.querySelectorAll('.lx-thumb').forEach(b => b.classList.add('is-entering'));
    showMain(changed);
    if (i >= 0) index.querySelector(`[data-lot="${id}"]`)?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduce.matches ? 'auto' : 'smooth' });
  }
  media.addEventListener('click', e => {
    const tab = e.target.closest('[data-type]');
    if (tab && !tab.disabled) { type = tab.dataset.type; mediaIndex = 0; media.innerHTML = mediaHTML(current); media.querySelectorAll('.lx-thumb').forEach(b => b.classList.add('is-entering')); showMain(true); return; }
    const th = e.target.closest('.lx-thumb');
    if (th) { const i = Number(th.dataset.i); if (i === mediaIndex) openGallery(th.querySelector('img')); else { mediaIndex = i; showMain(true); } return; }
    if (e.target.closest('.lx-main')) openGallery(media.querySelector('.lx-main-img:last-child'));
  });
  select.addEventListener('change', () => { const prev = ids.indexOf(current), next = ids.indexOf(select.value); render(select.value, prev < 0 || next < 0 ? 1 : Math.sign(next - prev) || 1); });
  document.addEventListener('rpc:language', () => { const id = current; current = null; render(id, 0); });

  /* ---------- Full-screen gallery ---------- */
  const dlg = document.createElement('dialog');
  dlg.className = 'lx-gallery';
  dlg.setAttribute('aria-label', 'Galería');
  dlg.dataset.noTranslate = '';
  document.body.append(dlg);
  let dispose = null, gType = 'photo', gIndex = 0;
  const vt = fn => (document.startViewTransition && !reduce.matches) ? document.startViewTransition(fn) : (fn(), null);
  function galleryHTML() {
    const s = t(), lot = lots.find(l => l.id === current), n = RP.number(current);
    const list = items(current).filter(x => x.type === gType);
    return `<header class="lxg-head"><h2 class="t-title">${s.lot} ${n} · ${esc(lot.front?.nearestStreet || '')}</h2>
      <div class="lx-tabs" role="tablist"><button type="button" role="tab" data-gtype="photo" aria-selected="${gType === 'photo'}" ${items(current).some(x => x.type === 'photo') ? '' : 'disabled'}>${s.photos}</button><button type="button" role="tab" data-gtype="360" aria-selected="${gType === '360'}" ${items(current).some(x => x.type === '360') ? '' : 'disabled'}>${s.p360}</button></div>
      <label class="lxg-switch t-label"><span>${s.outline}</span><button type="button" role="switch" aria-checked="${outlineOn}" class="lxg-toggle"><i></i></button></label>
      <button type="button" class="lxg-close t-button">${s.close} <span aria-hidden="true">✕</span></button></header>
      <div class="lxg-stage"><div class="lxg-frame"></div>
        <button type="button" class="rp-arrow lxg-prev" data-gdir="-1" aria-label="${s.prev}"><span class="rp-arrow-ico">${ARROW(-1)}</span></button>
        <button type="button" class="rp-arrow lxg-next" data-gdir="1" aria-label="${s.next}"><span class="rp-arrow-ico">${ARROW(1)}</span></button></div>
      <footer class="lxg-foot"><span class="lxg-count t-label"></span><div class="lxg-thumbs">${list.map((it, i) => `<button type="button" class="lx-thumb" data-gi="${i}" aria-pressed="${i === gIndex}"><img src="${thumbOf(it.file)}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${base + it.file}'"></button>`).join('')}</div><p class="t-small lxg-note">${s.note}</p></footer>`;
  }
  function gShow(dir = 0) {
    dispose?.(); dispose = null;
    const s = t(), list = items(current).filter(x => x.type === gType), it = list[gIndex]; if (!it) return;
    const frame = dlg.querySelector('.lxg-frame');
    dlg.querySelector('.lxg-count').textContent = `${gType === 'photo' ? s.photo : '360°'} ${gIndex + 1} / ${list.length}`;
    dlg.querySelectorAll('[data-gi]').forEach((b, i) => b.setAttribute('aria-pressed', String(i === gIndex)));
    dlg.querySelector('.lxg-switch').hidden = !it.outline;
    dlg.querySelector('.lxg-note').hidden = !it.outline || !outlineOn;
    const build = () => {
      frame.innerHTML = '';
      if (gType === 'photo') {
        const box = document.createElement('div'); box.className = 'lxg-photo';
        const img = new Image(); img.src = base + it.file; img.alt = `${s.photo} ${gIndex + 1}`;
        box.append(img);
        if (it.outline) {
          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svg.setAttribute('viewBox', '0 0 1 1'); svg.setAttribute('preserveAspectRatio', 'none'); svg.setAttribute('aria-hidden', 'true');
          svg.innerHTML = `<polygon pathLength="1" points="${it.outline.map(p => p.join(',')).join(' ')}"/>`;
          svg.classList.toggle('is-on', outlineOn);
          box.append(svg);
        }
        const fit = () => { if (img.naturalWidth) box.style.aspectRatio = img.naturalWidth + ' / ' + img.naturalHeight; };
        img.complete ? fit() : img.addEventListener('load', fit);
        frame.append(box);
        if (it.outline && outlineOn) requestAnimationFrame(() => requestAnimationFrame(() => box.querySelector('svg')?.classList.add('is-drawn')));
      } else {
        const stage = document.createElement('div'); stage.className = 'lxg-pano'; stage.tabIndex = 0; stage.setAttribute('aria-label', s.drag);
        frame.append(stage);
        const hint = document.createElement('span'); hint.className = 'lxg-hint t-label'; hint.textContent = s.drag; frame.append(hint);
        dispose = panorama(stage, base + it.file, { ...it, showOutline: outlineOn });
      }
    };
    if (dir && !reduce.matches && frame.animate && frame.firstChild) {
      const out = dir > 0 ? -60 : 60;
      frame.animate([{ transform: 'translateX(0)', opacity: 1 }, { transform: `translateX(${out}px)`, opacity: 0 }], { duration: 260, easing: ease }).onfinish = () => { build(); frame.animate([{ transform: `translateX(${-out}px)`, opacity: 0 }, { transform: 'translateX(0)', opacity: 1 }], { duration: 480, easing: 'cubic-bezier(.2,.8,.2,1)' }); };
    } else build();
  }
  function openGallery(fromImg) {
    gType = type; gIndex = mediaIndex;
    dlg.innerHTML = galleryHTML();
    if (fromImg) fromImg.style.viewTransitionName = 'lx-shared';
    const tr = vt(() => {
      if (fromImg) fromImg.style.viewTransitionName = '';
      dlg.showModal(); gShow(0);
      const target = dlg.querySelector('.lxg-frame'); target.style.viewTransitionName = 'lx-shared';
    });
    const clear = () => { const f = dlg.querySelector('.lxg-frame'); if (f) f.style.viewTransitionName = ''; };
    tr ? tr.finished.finally(clear) : clear();
  }
  function closeGallery() {
    if (!dlg.open) return;
    const thumb = media.querySelectorAll('.lx-thumb img')[gIndex] && gType === type ? media.querySelectorAll('.lx-thumb img')[gIndex] : media.querySelector('.lx-main-frame');
    const frame = dlg.querySelector('.lxg-frame'); if (frame) frame.style.viewTransitionName = 'lx-shared';
    const tr = vt(() => { if (frame) frame.style.viewTransitionName = ''; dispose?.(); dispose = null; dlg.close(); if (thumb) thumb.style.viewTransitionName = 'lx-shared'; });
    const clear = () => { if (thumb) thumb.style.viewTransitionName = ''; };
    tr ? tr.finished.finally(clear) : clear();
  }
  dlg.addEventListener('cancel', e => { e.preventDefault(); closeGallery(); });
  dlg.addEventListener('click', e => {
    if (e.target.closest('.lxg-close')) return closeGallery();
    const tab = e.target.closest('[data-gtype]'); if (tab && !tab.disabled) { gType = tab.dataset.gtype; gIndex = 0; dlg.innerHTML = galleryHTML(); gShow(0); return; }
    if (e.target.closest('.lxg-toggle')) { outlineOn = !outlineOn; e.target.closest('.lxg-toggle').setAttribute('aria-checked', String(outlineOn)); gShow(0); return; }
    const d = e.target.closest('[data-gdir]'); if (d) { const n = items(current).filter(x => x.type === gType).length; gIndex = (gIndex + Number(d.dataset.gdir) + n) % n; gShow(Number(d.dataset.gdir)); return; }
    const g = e.target.closest('[data-gi]'); if (g) { const i = Number(g.dataset.gi); const dir = Math.sign(i - gIndex); gIndex = i; gShow(dir); }
  });
  dlg.addEventListener('keydown', e => {
    if (e.target.closest('.lxg-pano')) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); dlg.querySelector(e.key === 'ArrowRight' ? '.lxg-next' : '.lxg-prev')?.click(); }
  });

  /* ---------- Data ---------- */
  Promise.all([
    fetch('/assets/geography/collection-lots.json').then(r => r.json()),
    fetch(base + 'catalog.json').then(r => r.json()).catch(() => ({}))
  ]).then(([data, cat]) => {
    lots = data.lots; catalog = cat;
    const start = () => render(select.value || ids[0], 0);
    if (select.value) start(); else addEventListener('rpc:lots-ready', start, { once: true });
    setTimeout(() => { if (!current) start(); }, 1500);
  });
}
