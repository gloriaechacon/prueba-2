/* Surroundings routes (phase 4): thin animated arcs from Rainbow Park to each
 * destination, drawn over the existing real map (Leaflet: streets/satellite,
 * regional outlines), road distance/time labels and the side "pass".
 * Maps register through window.rpSurroundingsQueue:
 *   { map, container, side, select(key), card }   (see territory.js, region-map.js)
 * Selection is read from the existing buttons' aria-pressed
 * ([data-destination] on the home, [data-place] on proyecto/entorno).
 * Distances/times: /assets/geography/surroundings-routes.json (OSRM, dated,
 * pending verification). Nothing is shown if a value is missing. */
(() => {
  const T = {
    en: { start: 'Starting point', pass: 'Your pass to the area', from: 'From', to: 'To', choose: 'Choose a destination', explore: 'Explore destination', time: 'Drive time', dist: 'Road distance', note: d => `By road · OSRM / OpenStreetMap · ${d} · to be verified`, pending: 'To be verified' },
    es: { start: 'Punto de partida', pass: 'Tu pase al entorno', from: 'Desde', to: 'Hacia', choose: 'Elige un destino', explore: 'Explorar destino', time: 'Tiempo en coche', dist: 'Distancia por carretera', note: d => `Por carretera · OSRM / OpenStreetMap · ${d} · por validar`, pending: 'Por validar' },
    pt: { start: 'Ponto de partida', pass: 'Seu passe para o entorno', from: 'De', to: 'Para', choose: 'Escolha um destino', explore: 'Explorar destino', time: 'Tempo de carro', dist: 'Distância por estrada', note: d => `Por estrada · OSRM / OpenStreetMap · ${d} · a validar`, pending: 'A validar' }
  };
  const lang = () => (window.rpcI18n?.language || new URLSearchParams(location.search).get('lang') || 'en').slice(0, 2);
  const t = () => T[lang()] || T.en;
  const locale = () => ({ en: 'en-US', es: 'es-ES', pt: 'pt-BR' }[lang()] || 'en-US');
  const km = v => Number(v).toLocaleString(locale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' km';
  const min = v => Math.round(v) + ' min';
  const date = iso => new Date(iso + 'T12:00:00').toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: 'numeric' });
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const ICON = {
    clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.2"/></svg>'
  };
  let data = null;
  const loaded = fetch('/assets/geography/surroundings-routes.json').then(r => r.json()).then(d => (data = d)).catch(() => null);

  function arc(a, b) {
    const dLat = b[0] - a[0], dLng = b[1] - a[1];
    let pLat = dLng * 0.24, pLng = -dLat * 0.24;
    if (pLat < 0) { pLat = -pLat; pLng = -pLng; } // bulge northwards
    const c = [(a[0] + b[0]) / 2 + pLat, (a[1] + b[1]) / 2 + pLng];
    const pts = [];
    for (let i = 0; i <= 48; i++) {
      const s = i / 48, u = 1 - s;
      pts.push([u * u * a[0] + 2 * u * s * c[0] + s * s * b[0], u * u * a[1] + 2 * u * s * c[1] + s * s * b[1]]);
    }
    return pts;
  }

  const MAPS = {"rainbow":"https://www.google.com/maps/search/?api=1&query=29.148212%2C-82.379192","wec":"https://www.google.com/maps/search/?api=1&query=World+Equestrian+Center+Ocala+FL","downtown":"https://www.google.com/maps/search/?api=1&query=Downtown+Ocala+FL","nature":"https://www.google.com/maps/search/?api=1&query=Rainbow+Springs+State+Park+FL","classic":"https://www.google.com/maps/search/?api=1&query=Classic+Mile+Training+Center+Ocala+FL","airport":"https://www.google.com/maps/search/?api=1&query=Ocala+International+Airport+FL"};
  const GM = { en: 'View on Google Maps', es: 'Ver en Google Maps', pt: 'Ver no Google Maps' };
  function attach(entry) {
    if (!data || entry.done) return;
    entry.done = true;
    const { map, container, side, select, card, passHost } = entry;
    const origin = [data.origin.lat, data.origin.lon];
    const routes = {};
    container.classList.add('has-routes');

    data.destinations.forEach((d, i) => {
      const end = [d.lat, d.lon];
      const line = L.polyline(arc(origin, end), { className: `route-arc route-${d.key}`, weight: 1.4, opacity: 0.9, interactive: false }).addTo(map);
      const dot = L.circleMarker(end, { className: 'route-dot', radius: 4.5, weight: 1.5, fillOpacity: 1, interactive: false }).addTo(map);
      // Label side per destination keeps neighbours (WEC / airport) apart at the regional zoom.
      const placeSide = { wec: 'n', airport: 's', downtown: 'n', classic: 's', nature: 'w' }[d.key] || (d.lon < data.origin.lon ? 'w' : 'e');
      const label = L.marker(end, { keyboard: false, zIndexOffset: 400, icon: L.divIcon({ className: `route-label route-label--${placeSide}`, iconSize: null, iconAnchor: [0, 0], html: '' }) }).addTo(map);
      routes[d.key] = { d, line, dot, label, delay: i * 0.18 };
    });

    function paintLabels() {
      Object.values(routes).forEach(({ d, label }) => {
        const has = typeof d.roadKm === 'number' && typeof d.driveMin === 'number';
        const html = `<button type="button" data-route="${d.key}"><strong>${d.name}</strong><span>${has ? `${km(d.roadKm)} · ${min(d.driveMin)}` : t().pending}</span></button>`;
        const node = label.getElement();
        if (node) { node.innerHTML = html; node.dataset.noTranslate = ''; node.querySelector('button').onclick = e => { e.stopPropagation(); select(d.key); }; }
      });
    }

    /* Pass (ticket) */
    const pass = document.createElement('aside');
    pass.className = 'route-pass';
    pass.dataset.noTranslate = '';
    pass.setAttribute('aria-live', 'polite');
    if (passHost) {
      passHost.append(pass);
      const descSrc = document.querySelector('#c-place-description');
      if (descSrc) new MutationObserver(() => { const d = pass.querySelector('.route-pass-desc'); if (d && d.textContent !== descSrc.textContent) { d.textContent = descSrc.textContent; if (!reduce.matches && d.animate) d.animate([{ transform: 'translateY(12px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 480, easing: 'cubic-bezier(.2,.8,.2,1)' }); } }).observe(descSrc, { childList: true, characterData: true, subtree: true });
    }
    else if (side) {
      const wrap = document.createElement('div');
      wrap.className = 'route-side';
      side.before(wrap);
      wrap.append(pass, side);
    }
    let active = 'rainbow', painted = false;
    const order = ['rainbow', ...data.destinations.map(d => d.key)];
    // Destination list (proyecto/entorno): "X KM · Y MIN" under each name.
    function paintList() {
      document.querySelectorAll('[data-rt-meta]').forEach(el => {
        const d = routes[el.dataset.rtMeta]?.d;
        el.dataset.noTranslate = '';
        el.textContent = el.dataset.rtMeta === 'rainbow' ? t().start : d && typeof d.roadKm === 'number' ? `${km(d.roadKm)} · ${min(d.driveMin)}` : t().pending;
      });
    }
    const notch = () => { const p = pass.querySelector('.route-pass-perforation'); if (p) pass.style.setProperty('--perf', p.offsetTop + 'px'); };
    new ResizeObserver(notch).observe(pass);
    function passHTML() {
      const s = t(), r = routes[active], d = r?.d;
      const has = d && typeof d.roadKm === 'number';
      return `
        <span class="route-pass-kicker">${s.pass}</span>
        <dl class="route-pass-trip">
          <div><dt>${s.from}</dt><dd>${data.origin.name}</dd></div>
          <div><dt>${s.to}</dt><dd>${d ? d.name : `<em>${s.choose}</em>`}</dd></div>
        </dl>
        ${passHost ? `<p class="t-small route-pass-desc">${document.querySelector('#c-place-description')?.textContent || ''}</p>` : ''}
        <div class="route-pass-perforation" aria-hidden="true"></div>
        <div class="route-pass-stats">
          <div>${ICON.clock}<strong>${has ? min(d.driveMin) : '—'}</strong><small>${s.time}</small></div>
          <div>${ICON.pin}<strong>${has ? km(d.roadKm) : '—'}</strong><small>${s.dist}</small></div>
        </div>
        ${passHost ? `<a class="btn btn--primary btn--block route-pass-go" href="${MAPS[active] || MAPS.rainbow}" target="_blank" rel="noopener"><span>${GM[lang()] || GM.en}</span><b aria-hidden="true">↗</b></a>` : `<button type="button" class="btn btn--primary btn--block route-pass-go"><span>${s.explore}</span><b aria-hidden="true">→</b></button>`}
        `;
    }
    function wire() {
      notch();
      if (passHost) return;   // the pass button is a Google Maps link on proyecto/entorno
      pass.querySelector('.route-pass-go').onclick = () => {
        const link = card?.querySelector('#c-place-link');
        if (passHost && link && active !== 'rainbow') { link.click(); return; }
        if (passHost && active === 'rainbow') { document.querySelector('[data-place]:not([data-place="rainbow"])')?.focus(); return; }
        card?.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'center' });
        const title = card?.querySelector('h2,h3');
        if (title) { title.setAttribute('tabindex', '-1'); title.focus({ preventScroll: true }); }
      };
    }
    // Same lateral swap as the Investment cards: the old data leaves, the new one enters from the other side.
    function paintPass(dir = 0) {
      if (!painted || !dir || reduce.matches || !pass.animate) { pass.innerHTML = passHTML(); wire(); painted = true; return; }
      const out = dir > 0 ? -40 : 40;
      pass.getAnimations().forEach(a => a.cancel());
      pass.animate([{ transform: 'translateX(0)', opacity: 1 }, { transform: `translateX(${out}px)`, opacity: 0 }], { duration: 320, easing: 'cubic-bezier(.65,.05,.25,1)', fill: 'forwards' }).onfinish = () => {
        pass.innerHTML = passHTML(); wire();
        pass.animate([{ transform: `translateX(${-out}px)`, opacity: 0 }, { transform: 'translateX(0)', opacity: 1 }], { duration: 560, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' });
      };
    }
    function setActive(key) {
      const dir = Math.sign(order.indexOf(key) - order.indexOf(active));
      active = key;
      Object.entries(routes).forEach(([k, r]) => {
        const on = k === key;
        r.line.setStyle({ weight: on ? 2.6 : 1.4 });
        r.line.getElement()?.classList.toggle('is-active', on);
        r.dot.setStyle({ radius: on ? 7 : 4.5 });
        r.dot.getElement()?.classList.toggle('is-active', on);
        r.label.getElement()?.classList.toggle('is-active', on);
        if (on) r.line.bringToFront();
        // The selected route redraws itself when chosen.
        const el = r.line.getElement();
        if (on && el && dir && container.classList.contains('routes-drawn') && !reduce.matches) {
          el.style.transition = 'none'; el.style.strokeDashoffset = '1'; void el.getBoundingClientRect();
          requestAnimationFrame(() => { el.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(.65,0,.35,1)'; el.style.strokeDashoffset = '0'; });
        }
      });
      paintPass(dir);
    }
    const buttons = [...document.querySelectorAll(entry.buttons)];
    const read = () => buttons.find(b => b.getAttribute('aria-pressed') === 'true')?.dataset[entry.buttonKey] || 'rainbow';
    new MutationObserver(() => { const k = read(); if (k !== active) setActive(k); }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['aria-pressed'] });

    // Elements exist only once the map has a view (territory.js registers before fitBounds).
    const prepare = () => {
      Object.values(routes).forEach(r => { const el = r.line.getElement(); if (el) { el.setAttribute('pathLength', '1'); el.style.setProperty('--route-delay', r.delay + 's'); } });
      paintLabels();
      paintList();
      setActive(active);
    };
    setActive(read());
    map.whenReady(prepare);
    map.on('zoomend viewreset', prepare);
    document.addEventListener('rpc:language', () => { paintLabels(); paintList(); paintPass(); });

    /* Draw when the map enters the viewport (static with reduced motion). */
    if (reduce.matches) container.classList.add('routes-drawn', 'routes-static');
    else new IntersectionObserver(([e], io) => { if (e.isIntersecting) { container.classList.add('routes-drawn'); io.disconnect(); } }, { threshold: 0.35 }).observe(container);
  }

  function flush() { (window.rpSurroundingsQueue || []).forEach(attach); }
  window.rpSurroundings = { flush };
  loaded.then(flush);
})();
