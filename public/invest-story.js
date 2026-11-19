/* "Ocala en movimiento" (phase 6) — investment story in three acts.
 *   [data-invest-figures="dark|light"] [data-mode="full|short"]  Act 1: carousel of figure cards (one screen)
 *   [data-invest-map]                                            Act 2: fixed map, projects one by one with arrows
 *   [data-invest-dossier]                                        Act 3: numbered source index
 * Data: /proyecto/investment-indicators.json and /inversion/project-map.json.
 * Every figure keeps its qualifiers exactly as written in the JSON (period,
 * source, status, "preliminar", "no capital comprometido"). Values are only
 * re-punctuated for the reading language (decimal/thousands separators), never
 * rounded. Copy is written in Spanish and translated by i18n.js text-node
 * translation (catalog entries tagged PROPOSAL are new). */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const lang = () => (window.rpcI18n?.language || new URLSearchParams(location.search).get('lang') || 'en').slice(0, 2);
  const locale = () => ({ en: 'en-US', es: 'es-ES', pt: 'pt-BR' }[lang()] || 'en-US');
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = n => String(n).padStart(2, '0');
  const ease = t => 1 - Math.pow(1 - t, 3);
  const tween = (ms, step, done) => {
    if (reduce.matches) { step(1); done?.(); return () => {}; }
    let raf, t0;
    const f = now => { t0 ??= now; const k = Math.min(1, (now - t0) / ms); step(ease(k)); if (k < 1) raf = requestAnimationFrame(f); else done?.(); };
    raf = requestAnimationFrame(f);
    return () => cancelAnimationFrame(raf);
  };
  const getJSON = url => fetch(url).then(r => { if (!r.ok) throw Error(url); return r.json(); });
  const indicatorsP = getJSON('/proyecto/investment-indicators.json');
  const mapP = getJSON('/inversion/project-map.json');
  const lotsP = getJSON('/assets/geography/collection-lots.json');

  /* "+48,14%" → { pre:'+', n:48.14, dec:2, suf:'%' }  (values are written in Spanish format) */
  function parseValue(str) {
    const m = /^(\D*?)(\d[\d.,]*)(.*)$/.exec(String(str).trim());
    if (!m) return null;
    const raw = m[2];
    const dec = raw.includes(',') ? raw.split(',')[1].length : 0;
    return { pre: m[1], n: parseFloat(raw.replace(/\./g, '').replace(',', '.')), dec, suf: m[3] };
  }
  const fmt = (n, dec) => n.toLocaleString(locale(), { minimumFractionDigits: dec, maximumFractionDigits: dec, useGrouping: true });

  // aria-roledescription is not covered by the i18n attribute pass: localise it here.
  const ROLE = { carousel: { es: 'carrusel', en: 'carousel', pt: 'carrossel' }, slide: { es: 'diapositiva', en: 'slide', pt: 'slide' } };
  const roleDesc = () => document.querySelectorAll('[data-role-desc]').forEach(el => el.setAttribute('aria-roledescription', ROLE[el.dataset.roleDesc][lang()] || ROLE[el.dataset.roleDesc].en));
  document.addEventListener('rpc:language', roleDesc);

  /* Shared carousel behaviour: arrows, dots, keyboard (← → Home End), swipe, click on the peeking card.
     No autoplay. Reduced motion = instant change (CSS drops the transitions). */
  function carousel(region, { count, onChange }) {
    let index = 0;
    const go = (i, dir) => {
      const next = (i + count) % count;
      if (next === index && dir !== 0) return;
      const d = dir ?? (next > index ? 1 : -1);
      const prev = index;
      index = next;
      onChange(next, prev, d);
    };
    region.addEventListener('keydown', e => {
      if (e.target.closest('input,select,textarea')) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1, 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1, -1); }
      else if (e.key === 'Home') { e.preventDefault(); go(0, -1); }
      else if (e.key === 'End') { e.preventDefault(); go(count - 1, 1); }
    });
    let x0 = null, y0 = 0;
    region.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') { x0 = e.clientX; y0 = e.clientY; } });
    region.addEventListener('pointerup', e => {
      if (x0 == null) return;
      const dx = e.clientX - x0, dy = e.clientY - y0; x0 = null;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) go(index + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
    });
    region.addEventListener('pointercancel', () => { x0 = null; });
    return { go, reset() { index = 0; }, get index() { return index; }, set count(n) { count = n; } };
  }

  /* Arrow helpers shared by both carousels: "Siguiente · <next item>" label and a two-beat nudge
     the first time the section is seen (none with reduced motion). */
  function nextLabel(el, name) {
    if (!el) return;
    el.innerHTML = `<span>Siguiente</span> · <span>${esc(name)}</span>`;
    document.dispatchEvent(new CustomEvent('rpc:content'));
  }
  function nudge(btn) {
    if (!btn || reduce.matches) return;
    btn.classList.add('is-nudging');
    btn.addEventListener('animationend', () => btn.classList.remove('is-nudging'), { once: true });
  }

  /* ---------------- Act 1 · figures (carousel) ---------------- */
  // One schematic visual per figure. They illustrate the kind of figure, never a series or a proportion.
  const VISUAL_BY_NAME = { 'Precios de vivienda': 'trend', 'Población y construcción': 'dots', 'Empleo': 'bars', 'Turismo': 'ring', 'Actividad empresarial': 'blocks' };
  const VISUAL_ORDER = ['trend', 'dots', 'bars', 'ring', 'blocks'];
  const TREND = 'M20 196 C 330 188 620 150 980 34';
  function visualSVG(kind) {
    if (kind === 'trend') return `<svg viewBox="0 0 1000 220" preserveAspectRatio="xMidYMax meet"><path class="ifig-line" d="${TREND}"/><g class="ifig-arrow"><g class="ifig-arrow-float"><path d="M-22 -11 L0 0 L-22 11"/></g></g></svg>`;
    if (kind === 'dots') {
      let out = ''; const cols = 16, rows = 5;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const x = 70 + c * 57, y = 30 + r * 40, d = ((c + r * 0.6) * 0.045).toFixed(3);
        out += `<circle class="ifig-dot-o" cx="${x}" cy="${y}" r="9"/><circle class="ifig-dot" cx="${x}" cy="${y}" r="9" style="--d:${d}s"/>`;
      }
      return `<svg viewBox="0 0 1000 220" preserveAspectRatio="xMidYMax meet">${out}</svg>`;
    }
    if (kind === 'bars') {
      let out = ''; const n = 14;
      for (let i = 0; i < n; i++) { const x = 80 + i * 62; out += `<rect class="ifig-bar" x="${x}" y="40" width="30" height="170" rx="3" style="--d:${(i * 0.06).toFixed(2)}s"/>`; }
      return `<svg viewBox="0 0 1000 220" preserveAspectRatio="xMidYMax meet"><path class="ifig-base" d="M60 211 H940"/>${out}</svg>`;
    }
    if (kind === 'ring') return `<svg viewBox="0 0 1000 220" preserveAspectRatio="xMidYMax meet"><circle class="ifig-ring-track" cx="500" cy="110" r="92"/><circle class="ifig-ring" cx="500" cy="110" r="92" pathLength="1" transform="rotate(-90 500 110)"/><circle class="ifig-ring-dot" cx="500" cy="18" r="7"/></svg>`;
    if (kind === 'blocks') {
      let out = ''; const B = [[330, 150], [470, 150], [610, 150], [400, 84], [540, 84], [470, 18]];
      B.forEach(([x, y], i) => { out += `<rect class="ifig-block" x="${x}" y="${y}" width="128" height="56" rx="6" style="--d:${(i * 0.12).toFixed(2)}s"/>`; });
      return `<svg viewBox="0 0 1000 220" preserveAspectRatio="xMidYMax meet">${out}</svg>`;
    }
    return '';
  }
  function renderFigures(root, items, sources) {
    const short = root.dataset.mode === 'short';
    const theme = root.dataset.investFigures || 'dark';
    const n = items.length;
    root.classList.add('ifig', `ifig--${theme}`, short ? 'ifig--short' : 'ifig--full');
    const card = (it, i) => {
      const v = parseValue(it.value);
      const src = sources.get(it.source);
      const kind = VISUAL_BY_NAME[it.name] || VISUAL_ORDER[i % VISUAL_ORDER.length];
      return `<article class="ifig-card" data-index="${i}" data-visual="${kind}" role="group" data-role-desc="slide" aria-label="${pad(i + 1)} / ${pad(n)}">
        <div class="ifig-copy">
          <span class="ifig-cat">${esc(it.name)}</span>
          <strong class="ifig-num" data-no-translate aria-label="${esc(it.value)}"><span class="ifig-pre">${esc(v?.pre)}</span><span class="ifig-val" data-n="${v?.n}" data-dec="${v?.dec}">${v ? fmt(v.n, v.dec) : esc(it.value)}</span><span class="ifig-suf">${esc(v?.suf)}</span></strong>
          <p class="ifig-label">${esc(it.label)}</p>
        </div>
        <figure class="ifig-visual" aria-hidden="true">${visualSVG(kind)}<figcaption>Visual esquemático · sin serie temporal</figcaption></figure>
        <footer class="ifig-meta">
          <div><span class="ifig-period">${esc(it.period)}</span>${src ? `<span class="ifig-src"><b>Fuente</b> · <span data-no-translate>${esc(src.publisher)}</span></span>` : ''}</div>
          <span class="ifig-status">${esc(it.status)}</span>
        </footer>
      </article>`;
    };
    root.innerHTML = `<div class="ifig-inner" role="region" data-role-desc="carousel" aria-label="Indicadores" tabindex="0">
        <header class="ifig-head"><span class="ifig-kicker">Rainbow Park / Inversión</span>
          <h2 class="ifig-title">El valor del <em>tiempo</em></h2></header>
        <div class="ifig-stagewrap">
          <div class="ifig-viewport"><div class="ifig-track" aria-live="polite">${items.map(card).join('')}</div></div>
          <button type="button" class="ifig-side ifig-side--prev rp-arrow" data-dir="-1" aria-label="Anterior"><span class="rp-arrow-ico"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12H5M11 6l-6 6 6 6"/></svg></span></button>
          <button type="button" class="ifig-side ifig-side--next rp-arrow" data-dir="1" aria-label="Siguiente"><span class="rp-arrow-ico"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg></span><span class="rp-arrow-label" aria-hidden="true"></span></button>
        </div>
        <nav class="ifig-nav" aria-label="Indicadores">
          <div class="rp-progress-wrap"><span class="ifig-count" data-no-translate>01 / ${pad(n)}</span><span class="rp-progress" aria-hidden="true"><i></i></span></div>
          <div class="ifig-dots">${items.map((it, i) => `<button type="button" class="ifig-dotbtn" data-go="${i}"><span class="ifig-sr" data-no-translate>${pad(i + 1)} / ${pad(n)}</span></button>`).join('')}</div>
        </nav>
        ${short ? `<a class="btn btn--primary ifig-more" href="/proyecto/inversion/"><span>Ver la inversión</span><b aria-hidden="true">→</b></a>` : ''}
      </div>`;
    const cards = [...root.querySelectorAll('.ifig-card')];
    const count = root.querySelector('.ifig-count');
    const dots = [...root.querySelectorAll('.ifig-dotbtn')];
    let cancel = [];

    function placeArrow(c, t) {
      const line = c.querySelector('.ifig-line'), arrow = c.querySelector('.ifig-arrow');
      if (!line) return;
      const L = line.getTotalLength();
      line.style.strokeDasharray = L;
      line.style.strokeDashoffset = L * (1 - t);
      const a = line.getPointAtLength(Math.max(0.01, L * t)), b = line.getPointAtLength(Math.max(0, L * t - 6));
      arrow.setAttribute('transform', `translate(${a.x} ${a.y}) rotate(${Math.atan2(a.y - b.y, a.x - b.x) * 180 / Math.PI})`);
      arrow.style.opacity = t > 0.02 ? 1 : 0;
    }
    function play(c) {
      const val = c.querySelector('.ifig-val'), n0 = +val.dataset.n, dec = +val.dataset.dec;
      c.classList.remove('is-played'); void c.offsetWidth; c.classList.add('is-played');
      const float = c.querySelector('.ifig-arrow-float');
      float?.classList.remove('is-floating', 'is-bouncing');
      cancel.push(tween(1500, k => { if (c.dataset.visual === 'trend') placeArrow(c, k); if (!isNaN(n0)) val.textContent = fmt(n0 * k, dec); }, () => {
        if (!float || reduce.matches) return;
        float.classList.add('is-bouncing');
        setTimeout(() => { float.classList.remove('is-bouncing'); float.classList.add('is-floating'); }, 650);
      }));
    }
    function layout(i, dir) {
      cards.forEach((c, k) => {
        const rel = (k - i + n) % n;                 // 0 active, 1 next (peeks), n-1 previous
        const pos = rel === 0 ? 'active' : rel === 1 ? 'next' : rel === n - 1 ? 'prev' : (dir > 0 ? 'after' : 'after');
        c.dataset.pos = pos;
        const on = pos === 'active';
        if (on) c.removeAttribute('aria-hidden'); else c.setAttribute('aria-hidden', 'true');
      });
      count.textContent = `${pad(i + 1)} / ${pad(n)}`;
      root.querySelector('.rp-progress i').style.transform = `scaleX(${(i + 1) / n})`;
      nextLabel(root.querySelector('.ifig-side--next .rp-arrow-label'), items[(i + 1) % n].name);
      dots.forEach((d, k) => d.setAttribute('aria-current', k === i ? 'true' : 'false'));
    }
    function show(i, prev, dir) {
      cancel.forEach(c => c()); cancel = [];
      // A card leaving towards the right (going back) must start from the left side and vice versa.
      root.dataset.dir = dir > 0 ? 'fwd' : 'back';
      layout(i, dir);
      const c = cards[i];
      if (prev != null && prev !== i) { const p = cards[prev]; if (p.dataset.visual === 'trend') placeArrow(p, 0); p.classList.remove('is-played'); p.querySelector('.ifig-val').textContent = fmt(+p.querySelector('.ifig-val').dataset.n || 0, +p.querySelector('.ifig-val').dataset.dec || 0); }
      play(c);
    }
    const ctl = carousel(root.querySelector('.ifig-inner'), { count: n, onChange: show });
    root.querySelectorAll('[data-dir]').forEach(b => b.addEventListener('click', () => ctl.go(ctl.index + Number(b.dataset.dir), Number(b.dataset.dir))));
    dots.forEach(d => d.addEventListener('click', () => { const i = +d.dataset.go; ctl.go(i, i > ctl.index ? 1 : -1); }));
    cards.forEach((c, k) => c.addEventListener('click', () => { if (c.dataset.pos === 'next') ctl.go(k, 1); else if (c.dataset.pos === 'prev') ctl.go(k, -1); }));
    layout(0, 1);
    cards.forEach(c => { if (c.dataset.visual === 'trend') placeArrow(c, 0); const v = c.querySelector('.ifig-val'); if (!isNaN(+v.dataset.n)) v.textContent = fmt(0, +v.dataset.dec); });
    // Start the first figure once the act is on screen.
    new IntersectionObserver(([e], io) => { if (!e.isIntersecting) return; io.disconnect(); show(0, null, 1); nudge(root.querySelector('.ifig-side--next')); }, { threshold: 0.35 }).observe(root);
    document.addEventListener('rpc:language', () => cards.forEach((c, k) => { const v = c.querySelector('.ifig-val'); if (k === ctl.index && c.classList.contains('is-played')) v.textContent = fmt(+v.dataset.n, +v.dataset.dec); }));
  }

  /* ---------------- Act 2 · map (fixed map, arrows) ---------------- */
  // Category labels carry their own translations so i18n fragments never touch proper names.
  const CATEGORY = { wec: { es: 'Corredor ecuestre · WEC', en: 'Equestrian corridor · WEC', pt: 'Corredor equestre · WEC' }, empleo: { es: 'Empleo', en: 'Employment', pt: 'Emprego' }, infraestructura: { es: 'Infraestructura', en: 'Infrastructure', pt: 'Infraestrutura' }, servicios: { es: 'Servicios', en: 'Services', pt: 'Serviços' } };
  const STATUS_CLASS = { acquisition: 'is-reported', planned: 'is-planned', construction: 'is-building', open: 'is-open' };
  const haversine = (a, b) => {
    const R = 6371, r = x => x * Math.PI / 180;
    const s = Math.sin(r(b[0] - a[0]) / 2) ** 2 + Math.cos(r(a[0])) * Math.cos(r(b[0])) * Math.sin(r(b[1] - a[1]) / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
  };
  function renderMap(root, data, origin) {
    if (!window.L) return;
    const all = data.locations.flatMap(loc => loc.projects.map(p => ({ loc, p })));
    const sources = new Map(data.sources.map(s => [s.id, s]));
    const cats = [...new Set(all.map(s => s.p.category))];
    let steps = all, filter = 'all';
    root.classList.add('imap');
    root.innerHTML = `<div class="imap-inner" role="region" data-role-desc="carousel" aria-label="Mapa de proyectos" tabindex="0">
        <header class="imap-head"><h2 class="imap-title">El mapa de la <em>inversión</em></h2><p>${esc(data.mapNote)}</p>
          <div class="imap-filter" role="group" aria-label="Filtrar por categoría"><button type="button" data-cat="all" aria-pressed="true">Todos</button>${cats.map(c => `<button type="button" data-cat="${esc(c)}" aria-pressed="false" data-no-translate>${esc(CATEGORY[c]?.[lang()] || c)}</button>`).join('')}</div></header>
        <div class="imap-body">
          <div class="imap-mapwrap"><div class="imap-map" aria-label="Mapa de proyectos"></div>
            <p class="imap-foot"><span class="imap-precision"></span><span class="imap-asof"></span></p></div>
          <aside class="imap-card"><div class="imap-stack" aria-live="polite"></div>
            <nav class="imap-nav" aria-label="Proyectos"><button type="button" class="imap-arrow imap-arrow--prev rp-arrow" data-dir="-1" aria-label="Anterior"><span class="rp-arrow-ico"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12H5M11 6l-6 6 6 6"/></svg></span></button><div class="rp-progress-wrap"><span class="imap-count" data-no-translate></span><span class="rp-progress" aria-hidden="true"><i></i></span></div><button type="button" class="imap-arrow imap-arrow--next rp-arrow" data-dir="1" aria-label="Siguiente"><span class="rp-arrow-ico"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg></span><span class="rp-arrow-label" aria-hidden="true"></span></button></nav></aside>
        </div>
      </div>`;
    const el = root.querySelector('.imap-map');
    const map = L.map(el, { zoomControl: false, scrollWheelZoom: false, dragging: !matchMedia('(pointer:coarse)').matches, attributionControl: true });
    L.control.zoom({ position: 'topright' }).addTo(map);
    L.tileLayer('https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}', { maxNativeZoom: 16, maxZoom: 18, attribution: 'USDA / USGS The National Map' }).addTo(map);
    const rp = L.marker(origin, { keyboard: false, icon: L.divIcon({ className: 'imap-origin', html: '<span>Rainbow Park</span>', iconSize: null }) }).addTo(map);
    const dots = new Map();
    data.locations.forEach(loc => dots.set(loc.id, L.circleMarker([loc.lat, loc.lon], { className: 'imap-dot', radius: 5, weight: 1.5, fillOpacity: 0.9, interactive: false }).addTo(map)));
    const link = L.polyline([origin, origin], { className: 'imap-link', weight: 2.5, interactive: false }).addTo(map);
    const tag = L.marker(origin, { keyboard: false, interactive: false, icon: L.divIcon({ className: 'imap-distance', html: '', iconSize: null }) }).addTo(map);
    map.fitBounds([origin, ...data.locations.map(l => [l.lat, l.lon])], { padding: [40, 40] });
    const asOf = data.asOf.split('-').reverse().join('/');
    const stack = root.querySelector('.imap-stack');
    const counter = root.querySelector('.imap-count');

    const cardHTML = ({ loc, p }) => {
      const src = p.sources.map(id => sources.get(id)).filter(Boolean)[0];
      const note = p.caveat || p.meaning || '';
      return `<span class="imap-cat" data-no-translate>${esc(CATEGORY[p.category]?.[lang()] || p.category)}</span>
        <h3 class="imap-name">${esc(loc.name)}</h3>
        <span class="imap-status ${STATUS_CLASS[p.statusClass] || ''}">${esc(p.status)}</span>
        <strong class="imap-metric" data-no-translate>${esc(p.metric)}</strong>
        <span class="imap-unit">${esc(p.unit)}</span>
        <dl class="imap-facts"><div><dd>${esc(p.date)}</dd></div><div><dd>${esc(p.location)}</dd></div></dl>
        ${src ? `<p class="imap-source"><em>Fuente:</em> <a href="${esc(src.url)}" target="_blank" rel="noopener" data-no-translate>${esc(src.publisher)}</a> · ${esc(src.date)}</p>` : ''}
        ${note ? `<p class="imap-note">${esc(note)}</p>` : ''}`;
    };
    function show(i, prev, dir = 1, first = false) {
      const step = steps[i];
      const { loc } = step;
      const at = [loc.lat, loc.lon];
      const km = haversine(origin, at);
      dots.forEach((d, id) => { d.setStyle({ radius: id === loc.id ? 9 : 5 }); d.getElement()?.classList.toggle('is-active', id === loc.id); });
      link.setLatLngs([origin, at]);
      const path = link.getElement();
      if (path) { path.setAttribute('pathLength', '1'); path.classList.remove('is-drawn'); void path.getBoundingClientRect(); requestAnimationFrame(() => path.classList.add('is-drawn')); }
      tag.setLatLng([(origin[0] + at[0]) / 2, (origin[1] + at[1]) / 2]);
      const tagEl = tag.getElement();
      if (tagEl) tagEl.innerHTML = `<span><b data-no-translate>${km.toLocaleString(locale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km</b> · en línea recta</span>`;
      map.flyToBounds([origin, at], { padding: [70, 70], maxZoom: 14, duration: reduce.matches || first ? 0 : 1.2 });
      root.querySelector('.imap-precision').textContent = loc.precision;
      root.querySelector('.imap-asof').innerHTML = `<span>Archivo:</span> ${asOf}`;
      counter.textContent = `${pad(i + 1)} / ${pad(steps.length)}`;
      root.querySelector('.imap .rp-progress i, .rp-progress i').style.transform = `scaleX(${(i + 1) / steps.length})`;
      nextLabel(root.querySelector('.imap-arrow--next .rp-arrow-label'), steps[(i + 1) % steps.length].loc.name);
      // Lateral swap of the card content: the old one leaves, the new one enters from the other side.
      const old = stack.querySelector('.imap-slide:not(.is-leaving)');
      const next = document.createElement('div');
      next.className = 'imap-slide';
      next.innerHTML = cardHTML(step);
      if (old && !first && !reduce.matches) {
        next.dataset.from = dir > 0 ? 'right' : 'left';
        old.classList.add('is-leaving'); old.dataset.to = dir > 0 ? 'left' : 'right'; old.setAttribute('aria-hidden', 'true');
        setTimeout(() => old.remove(), 950);
        stack.append(next);
        requestAnimationFrame(() => requestAnimationFrame(() => next.removeAttribute('data-from')));
      } else { stack.replaceChildren(next); }
      document.dispatchEvent(new CustomEvent('rpc:content'));
    }
    const ctl = carousel(root.querySelector('.imap-inner'), { count: steps.length, onChange: (i, prev, dir) => show(i, prev, dir) });
    root.querySelectorAll('.imap-nav [data-dir]').forEach(b => b.addEventListener('click', () => ctl.go(ctl.index + Number(b.dataset.dir), Number(b.dataset.dir))));
    root.querySelectorAll('.imap-filter button').forEach(b => b.addEventListener('click', () => {
      filter = b.dataset.cat;
      root.querySelectorAll('.imap-filter button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      steps = filter === 'all' ? all : all.filter(s => s.p.category === filter);
      ctl.count = steps.length;
      ctl.reset();
      show(0, null, 1);
    }));
    new ResizeObserver(() => map.invalidateSize({ pan: false })).observe(el);
    document.addEventListener('rpc:language', () => {
      root.querySelectorAll('.imap-filter [data-cat]:not([data-cat=all])').forEach(b => { b.textContent = CATEGORY[b.dataset.cat]?.[lang()] || b.dataset.cat; });
      show(ctl.index, null, 1, true);
    });
    show(0, null, 1, true);
    new IntersectionObserver(([e], io) => { if (!e.isIntersecting) return; io.disconnect(); map.invalidateSize(); show(ctl.index, null, 1, true); nudge(root.querySelector('.imap-arrow--next')); }, { threshold: 0.2 }).observe(root);
    rp.getElement()?.setAttribute('aria-hidden', 'true');
  }

  /* ---------------- Act 3 · dossier ---------------- */
  function renderDossier(root, indicators, data) {
    const sources = new Map(data.sources.map(s => [s.id, s]));
    const host = s => { try { const u = new URL(s.url); return (u.hostname.replace(/^www\./, '') + u.pathname).replace(/\/$/, '').slice(0, 48); } catch { return s.url; } };
    const dates = indicators.map(i => (/(\d{2}\/\d{2}\/\d{4})/.exec(i.status) || [])[1]).filter(Boolean)
      .sort((a, b) => a.split('/').reverse().join('').localeCompare(b.split('/').reverse().join('')));
    const latest = dates.at(-1) || '';
    const archive = data.asOf.split('-').reverse().join('/');
    const field = (k, v, cls = '') => v ? `<div class="${cls}"><dt>${k}</dt><dd>${v}</dd></div>` : '';
    const linkHtml = s => `<a href="${esc(s.url)}" target="_blank" rel="noopener" data-no-translate>${esc(host(s))} <span aria-hidden="true">↗</span></a>`;
    const rows = [];
    indicators.forEach(ind => {
      const s = sources.get(ind.source);
      if (!s) return;
      rows.push({ title: s.title, meta: [s.publisher, s.date], body: `<dl class="idos-grid">${field('Publicador', `<span data-no-translate>${esc(s.publisher)}</span>`)}${field('Tipo', esc(s.type))}${field('Período', esc(s.date))}${field('Enlace', linkHtml(s))}${field('Revisión', esc(ind.status))}</dl>` });
    });
    data.locations.forEach(loc => loc.projects.forEach(p => {
      const list = p.sources.map(id => sources.get(id)).filter(Boolean);
      if (!list.length) return;
      rows.push({
        title: `<span>${esc(loc.name)}</span> · <span>${esc(p.status)}</span>`, html: true, meta: [list[0].publisher, list[0].date],
        body: list.map(s => `<dl class="idos-grid">${field('Publicador', `<span data-no-translate>${esc(s.publisher)}</span>`)}${field('Tipo', esc(s.type))}${field('Fecha', esc(s.date))}${field('Enlace', linkHtml(s))}${field('Revisión', '<span>Archivo:</span> ' + archive)}</dl>`).join('')
      });
    }));
    root.classList.add('idos');
    root.innerHTML = `
      <div class="idos-side"><h2 class="idos-title">Detrás de cada <em>cifra</em></h2><span class="idos-kicker">Dossier de fuentes</span></div>
      <ol class="idos-list">${rows.map((r, i) => `<li><details ${i === 0 ? 'open' : ''}><summary><span class="idos-n" data-no-translate>${pad(i + 1)}</span><span class="idos-row-title">${r.html ? r.title : esc(r.title)}</span><span class="idos-meta"><span data-no-translate>${esc(r.meta[0])}</span> · <span>${esc(r.meta[1])}</span></span><i aria-hidden="true"></i></summary><div class="idos-body">${r.body}</div></details></li>`).join('')}</ol>
      <p class="idos-foot"><span>Indicadores: revisión</span> ${esc(latest)} · <span>Archivo de proyectos:</span> ${esc(archive)}</p>`;
  }

  Promise.all([indicatorsP, mapP, lotsP]).then(([indicators, data, lots]) => {
    const sources = new Map(data.sources.map(s => [s.id, s]));
    // Rainbow Park reference = centroid of the collection's lot pins (collection-lots.json).
    const pins = lots.lots.map(l => l.pin);
    const origin = [pins.reduce((s, p) => s + p.lat, 0) / pins.length, pins.reduce((s, p) => s + p.lon, 0) / pins.length];
    document.querySelectorAll('[data-invest-figures]').forEach(r => renderFigures(r, indicators, sources));
    document.querySelectorAll('[data-invest-map]').forEach(r => renderMap(r, data, origin));
    document.querySelectorAll('[data-invest-dossier]').forEach(r => renderDossier(r, indicators, data));
    roleDesc();
    window.rpMotion?.refresh?.();
  }).catch(error => {
    console.warn('Investment story unavailable', error);
    document.querySelectorAll('[data-invest-figures],[data-invest-map],[data-invest-dossier]').forEach(r => { r.innerHTML = '<p class="invest-error">No se pudieron cargar los datos. Recarga la página.</p>'; });
  });
})();
