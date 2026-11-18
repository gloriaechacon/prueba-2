/* "Ocala en movimiento" (phase 6) — investment story in three acts.
 *   [data-invest-figures="dark|light"] [data-mode="full|short"]  Act 1: one figure per screen
 *   [data-invest-map]                                            Act 2: project-to-project map
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

  /* Sticky scroll sequence: maps the section's scroll progress to a step index. */
  function sequence(section, steps, onStep) {
    let current = -1;
    const update = () => {
      const r = section.getBoundingClientRect(), span = section.offsetHeight - innerHeight;
      const p = span > 0 ? Math.min(0.9999, Math.max(0, -r.top / span)) : 0;
      const i = Math.floor(p * steps);
      if (i !== current) { current = i; onStep(i); }
    };
    addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
    addEventListener('resize', update);
    update();
    return {
      go(i) {
        i = Math.max(0, Math.min(steps - 1, i));
        const span = section.offsetHeight - innerHeight;
        scrollTo({ top: section.getBoundingClientRect().top + scrollY + span * (i + 0.5) / steps, behavior: reduce.matches ? 'auto' : 'smooth' });
      },
      get index() { return current; }
    };
  }

  /* ---------------- Act 1 · figures ---------------- */
  const TREND = 'M20 196 C 330 188 620 150 980 34';
  function renderFigures(root, items, sources) {
    const short = root.dataset.mode === 'short';
    const theme = root.dataset.investFigures || 'dark';
    const n = items.length;
    root.classList.add('ifig', `ifig--${theme}`, short ? 'ifig--short' : 'ifig--full');
    const stacked = reduce.matches;
    if (stacked) root.classList.add('ifig--stacked');
    const slide = (it, i) => {
      const v = parseValue(it.value);
      const src = sources.get(it.source);
      return `<article class="ifig-slide" data-index="${i}" ${stacked || i === 0 ? '' : 'aria-hidden="true"'}>
        <span class="ifig-cat">${esc(it.name)}</span>
        <strong class="ifig-num" data-no-translate aria-label="${esc(it.value)}"><span class="ifig-pre">${esc(v?.pre)}</span><span class="ifig-val" data-n="${v?.n}" data-dec="${v?.dec}">${v ? fmt(stacked ? v.n : 0, v.dec) : esc(it.value)}</span><span class="ifig-suf">${esc(v?.suf)}</span></strong>
        <p class="ifig-label">${esc(it.label)}</p>
        <figure class="ifig-trend" aria-hidden="true">
          <svg viewBox="0 0 1000 220" preserveAspectRatio="xMinYMax meet"><path class="ifig-line" d="${TREND}"/><g class="ifig-arrow"><g class="ifig-arrow-float"><path d="M-22 -11 L0 0 L-22 11"/></g></g></svg>
          <figcaption>Tendencia esquemática · Sin serie temporal</figcaption>
        </figure>
        <footer class="ifig-meta">
          <div><span class="ifig-period">${esc(it.period)}</span>${src ? `<span class="ifig-src"><b>Fuente</b> · <span data-no-translate>${esc(src.publisher)}</span></span>` : ''}</div>
          <span class="ifig-status">${esc(it.status)}</span>
        </footer>
      </article>`;
    };
    root.innerHTML = `<div class="ifig-pin">
        <header class="ifig-head"><span class="ifig-kicker">Rainbow Park / Inversión</span>
          <h2 class="ifig-title">El valor del <em>tiempo</em></h2></header>
        <div class="ifig-stage">${items.map(slide).join('')}</div>
        <nav class="ifig-nav" aria-label="Indicadores"><button type="button" data-dir="-1" aria-label="Anterior">←</button><span class="ifig-count" data-no-translate>01 / ${pad(n)}</span><button type="button" data-dir="1" aria-label="Siguiente">→</button></nav>
        ${short ? `<a class="link-line ifig-more" href="/proyecto/inversion/">Ver la evidencia completa <span aria-hidden="true">↗</span></a>` : ''}
      </div>`;
    root.style.setProperty('--ifig-steps', n);
    const slides = [...root.querySelectorAll('.ifig-slide')];
    const count = root.querySelector('.ifig-count');
    let cancel = [];

    function placeArrow(s, t) {
      const line = s.querySelector('.ifig-line'), arrow = s.querySelector('.ifig-arrow');
      const L = line.getTotalLength();
      line.style.strokeDasharray = L;
      line.style.strokeDashoffset = L * (1 - t);
      const a = line.getPointAtLength(Math.max(0.01, L * t)), b = line.getPointAtLength(Math.max(0, L * t - 6));
      const ang = Math.atan2(a.y - b.y, a.x - b.x) * 180 / Math.PI;
      arrow.setAttribute('transform', `translate(${a.x} ${a.y}) rotate(${ang})`);
      arrow.style.opacity = t > 0.02 ? 1 : 0;
    }
    function play(s) {
      const val = s.querySelector('.ifig-val'), n0 = +val.dataset.n, dec = +val.dataset.dec;
      const float = s.querySelector('.ifig-arrow-float');
      float.classList.remove('is-floating', 'is-bouncing');
      cancel.push(tween(1700, k => { placeArrow(s, k); if (!isNaN(n0)) val.textContent = fmt(n0 * k, dec); }, () => {
        if (reduce.matches) return;
        float.classList.add('is-bouncing');
        setTimeout(() => { float.classList.remove('is-bouncing'); float.classList.add('is-floating'); }, 650);
      }));
    }
    function show(i) {
      cancel.forEach(c => c()); cancel = [];
      count.textContent = `${pad(i + 1)} / ${pad(n)}`;
      slides.forEach((s, k) => {
        const on = k === i;
        s.classList.toggle('is-active', on);
        if (on) s.removeAttribute('aria-hidden'); else s.setAttribute('aria-hidden', 'true');
        if (!on) { const t0 = Number(s.dataset.t || 0); cancel.push(tween(350, k2 => placeArrow(s, t0 * (1 - k2)))); s.dataset.t = 0; }
      });
      slides[i].dataset.t = 1;
      play(slides[i]);
    }
    if (stacked) {
      slides.forEach(s => { s.classList.add('is-active'); placeArrow(s, 1); });
      root.querySelector('.ifig-nav').hidden = true;
      return;
    }
    // Draw only once the act is on screen; the scroll then picks the figure.
    let seq;
    new IntersectionObserver(([e], io) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      seq = sequence(root, n, show);
    }, { threshold: 0, rootMargin: '0px 0px -50% 0px' }).observe(root);
    root.querySelectorAll('[data-dir]').forEach(b => b.addEventListener('click', () => seq?.go((seq.index < 0 ? 0 : seq.index) + Number(b.dataset.dir))));
    document.addEventListener('rpc:language', () => slides.forEach(s => {
      const val = s.querySelector('.ifig-val');
      if (s.classList.contains('is-active')) val.textContent = fmt(+val.dataset.n, +val.dataset.dec);
    }));
  }

  /* ---------------- Act 2 · map ---------------- */
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
    const steps = data.locations.flatMap(loc => loc.projects.map(p => ({ loc, p })));
    const sources = new Map(data.sources.map(s => [s.id, s]));
    const n = steps.length;
    const stacked = reduce.matches;
    root.classList.add('imap');
    if (stacked) root.classList.add('imap--static');
    root.style.setProperty('--imap-steps', n);
    root.innerHTML = `<div class="imap-pin">
        <header class="imap-head"><h2 class="imap-title">El mapa de la <em>inversión</em></h2><p>${esc(data.mapNote)}</p></header>
        <div class="imap-body">
          <div class="imap-mapwrap"><div class="imap-map" aria-label="Mapa de proyectos"></div>
            <p class="imap-foot"><span class="imap-precision"></span><span class="imap-asof"></span></p></div>
          <aside class="imap-card" aria-live="polite"></aside>
        </div>
      </div>`;
    const el = root.querySelector('.imap-map');
    const map = L.map(el, { zoomControl: false, scrollWheelZoom: false, dragging: !matchMedia('(pointer:coarse)').matches, attributionControl: true });
    L.control.zoom({ position: 'topright' }).addTo(map);
    L.tileLayer('https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}', { maxNativeZoom: 16, maxZoom: 18, attribution: 'USDA / USGS The National Map' }).addTo(map);
    const rp = L.marker(origin, { keyboard: false, icon: L.divIcon({ className: 'imap-origin', html: '<span>Rainbow Park</span>', iconSize: null }) }).addTo(map);
    const dots = new Map();
    data.locations.forEach(loc => dots.set(loc.id, L.circleMarker([loc.lat, loc.lon], { radius: 5, color: '#f7f2e7', weight: 1.5, fillColor: '#26272b', fillOpacity: 0.9, interactive: false }).addTo(map)));
    const link = L.polyline([origin, origin], { className: 'imap-link', color: '#d2b77e', weight: 2.5, interactive: false }).addTo(map);
    const tag = L.marker(origin, { keyboard: false, interactive: false, icon: L.divIcon({ className: 'imap-distance', html: '', iconSize: null }) }).addTo(map);
    map.fitBounds([origin, ...data.locations.map(l => [l.lat, l.lon])], { padding: [40, 40] });
    const asOf = data.asOf.split('-').reverse().join('/');
    const card = root.querySelector('.imap-card');

    function show(i) {
      const { loc, p } = steps[i];
      const at = [loc.lat, loc.lon];
      const km = haversine(origin, at);
      dots.forEach((d, id) => d.setStyle(id === loc.id ? { radius: 9, fillColor: '#d2b77e', color: '#26272b' } : { radius: 5, fillColor: '#26272b', color: '#f7f2e7' }));
      link.setLatLngs([origin, at]);
      const path = link.getElement();
      if (path) { path.setAttribute('pathLength', '1'); path.classList.remove('is-drawn'); void path.getBoundingClientRect(); requestAnimationFrame(() => path.classList.add('is-drawn')); }
      tag.setLatLng([(origin[0] + at[0]) / 2, (origin[1] + at[1]) / 2]);
      const tagEl = tag.getElement();
      if (tagEl) tagEl.innerHTML = `<span><b data-no-translate>${km.toLocaleString(locale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km</b> · en línea recta</span>`;
      map.flyToBounds([origin, at], { padding: [70, 70], maxZoom: 14, duration: reduce.matches ? 0 : 1.2 });
      root.querySelector('.imap-precision').textContent = loc.precision;
      root.querySelector('.imap-asof').innerHTML = `<span>Archivo:</span> ${asOf}`;
      const src = p.sources.map(id => sources.get(id)).filter(Boolean)[0];
      const note = p.caveat || p.meaning || '';
      card.innerHTML = `
        <span class="imap-cat" data-no-translate>${esc(CATEGORY[p.category]?.[lang()] || p.category)}</span>
        <h3 class="imap-name">${esc(loc.name)}</h3>
        <span class="imap-status ${STATUS_CLASS[p.statusClass] || ''}">${esc(p.status)}</span>
        <strong class="imap-metric" data-no-translate>${esc(p.metric)}</strong>
        <span class="imap-unit">${esc(p.unit)}</span>
        <dl class="imap-facts"><div><dd>${esc(p.date)}</dd></div><div><dd>${esc(p.location)}</dd></div></dl>
        ${src ? `<p class="imap-source"><em>Fuente:</em> <a href="${esc(src.url)}" target="_blank" rel="noopener" data-no-translate>${esc(src.publisher)}</a> · ${esc(src.date)}</p>` : ''}
        ${note ? `<p class="imap-note">${esc(note)}</p>` : ''}
        <nav class="imap-nav" aria-label="Proyectos"><button type="button" data-dir="-1" aria-label="Anterior">←</button><span data-no-translate>${pad(i + 1)} / ${pad(n)}</span><button type="button" data-dir="1" aria-label="Siguiente">→</button></nav>`;
      card.querySelectorAll('[data-dir]').forEach(b => b.addEventListener('click', () => go(i + Number(b.dataset.dir))));
    }
    let seq = null, idx = 0;
    const go = i => { i = (i + n) % n; if (seq) seq.go(i); else { idx = i; show(i); } };
    new ResizeObserver(() => map.invalidateSize({ pan: false })).observe(el);
    document.addEventListener('rpc:language', () => show(seq ? Math.max(0, seq.index) : idx));
    if (stacked) { show(0); return; }
    new IntersectionObserver(([e], io) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      map.invalidateSize();
      seq = sequence(root, n, show);
    }, { threshold: 0, rootMargin: '0px 0px -50% 0px' }).observe(root);
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
    window.rpMotion?.refresh?.();
  }).catch(error => {
    console.warn('Investment story unavailable', error);
    document.querySelectorAll('[data-invest-figures],[data-invest-map],[data-invest-dossier]').forEach(r => { r.innerHTML = '<p class="invest-error">No se pudieron cargar los datos. Recarga la página.</p>'; });
  });
})();
