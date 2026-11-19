/* Lots map, embed v2 (/a/?embed=lotes2, used by proyecto/lotes):
   segmented control (Mover / Rotar / Ver entorno), "Sold" tags, floating place card. */
(() => {
  if (new URLSearchParams(location.search).get('embed') !== 'lotes2') return;
  document.body.classList.add('embedded-lotes2');
  const $ = s => document.querySelector(s);
  const SOLD = { en: 'Sold', es: 'Vendido', pt: 'Vendido' };
  const lang = () => (window.rpcI18n?.language || new URLSearchParams(location.search).get('lang') || 'en').slice(0, 2);
  let info = null;

  function close() {
    if (!info || info.hidden) return;
    info.hidden = true;
    document.querySelectorAll('.zone-regional-label').forEach(l => l.setAttribute('aria-pressed', 'false'));
  }

  function init() {
    const world = $('#lot-explorer .zone-world');
    info = $('.zone-place-info');
    // Sold tags
    const AV = { en: 'Available', es: 'Disponible', pt: 'Disponível' };
    const sold = () => { document.querySelectorAll('.zone-pin.is-sold>span').forEach(s => { s.dataset.sold = SOLD[lang()] || SOLD.en; }); document.querySelectorAll('.zone-pin:not(.is-sold)>span').forEach(s => { s.dataset.state = AV[lang()] || AV.en; }); };
    sold();
    document.addEventListener('rpc:language', sold);

    // Segmented control
    const seg = document.createElement('div');
    seg.className = 'lx-seg';
    seg.setAttribute('role', 'group');
    seg.setAttribute('aria-label', 'Controles del mapa');
    // Two separate groups inside the map: movement and view.
    seg.innerHTML = '<div class="lx-seg-group" role="group" aria-label="Movimiento"><button type="button" data-m="pan" aria-pressed="true">Mover</button><button type="button" data-m="orbit" aria-pressed="false">Rotar</button></div><div class="lx-seg-group" role="group" aria-label="Vista"><button type="button" data-m="area" aria-pressed="false">Ver entorno</button><button type="button" data-m="all" aria-pressed="false">Ver todo Rainbow Park</button></div>';
    world.append(seg);
    const [pan, orbit, area, all] = seg.querySelectorAll('button');
    all.onclick = () => { area.setAttribute('aria-pressed', 'false'); close(); window.rpZoneEngine?.clearSelection?.(); parent.postMessage({ type: 'parcel-overview' }, location.origin); };
    pan.onclick = () => { area.setAttribute('aria-pressed', 'false'); $('[data-zone-mode="pan"]')?.click(); pan.setAttribute('aria-pressed', 'true'); orbit.setAttribute('aria-pressed', 'false'); };
    orbit.onclick = () => { area.setAttribute('aria-pressed', 'false'); $('[data-zone-mode="orbit"]')?.click(); orbit.setAttribute('aria-pressed', 'true'); pan.setAttribute('aria-pressed', 'false'); };
    area.onclick = () => {
      const on = area.getAttribute('aria-pressed') !== 'true';
      area.setAttribute('aria-pressed', String(on));
      (on ? $('.zone-region-button') : $('#zone-overview'))?.click();
      if (!on) close();
    };
    document.addEventListener('rpc:lot', () => { area.setAttribute('aria-pressed', 'false'); close(); });

    // After the entrance the numbers stop replaying their pop-in.
    const settle = () => setTimeout(() => document.querySelectorAll('.zone-pin').forEach(p => p.classList.add('was-popped')), 2600);
    if (document.body.classList.contains('lots-entered')) settle();
    else new MutationObserver((m, o) => { if (document.body.classList.contains('lots-entered')) { o.disconnect(); settle(); } }).observe(document.body, { attributes: true, attributeFilter: ['class'] });

    // Floating place card next to its marker
    if (!info) return;
    world.append(info);
    let raf = 0;
    const place = () => {
      raf = 0;
      if (info.hidden) return;
      const label = document.querySelector('.zone-regional-label[aria-pressed="true"]');
      if (label && !label.hidden) {
        info.style.visibility = '';
        const w = world.getBoundingClientRect(), r = label.getBoundingClientRect();
        const x = Math.max(12, Math.min(w.width - info.offsetWidth - 12, r.left - w.left + r.width / 2 - info.offsetWidth / 2));
        const above = r.top - w.top - info.offsetHeight - 16;
        const y = above > 60 ? above : r.bottom - w.top + 16;
        info.style.setProperty('--lx-pos', `translate(${x}px,${y}px)`);
        info.style.transform = `translate(${x}px,${y}px)`;
      } else info.style.visibility = 'hidden';
      raf = requestAnimationFrame(place);
    };
    new MutationObserver(() => {
      if (info.hidden) return;
      info.classList.remove('is-in'); void info.offsetWidth; info.classList.add('is-in');
      if (!raf) raf = requestAnimationFrame(place);
    }).observe(info, { attributes: true, attributeFilter: ['hidden'], childList: true });
    addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    document.addEventListener('pointerdown', e => { if (!info.contains(e.target) && !e.target.closest('.zone-regional-label')) close(); });
  }

  // 'View all Rainbow Park' / initial state from the page: no lot selected, whole area.
  addEventListener('message', e => { if (e.origin === location.origin && e.source === parent && e.data?.type === 'rainbow-overview' && document.querySelector('.zone-pin[aria-pressed="true"]')) window.rpZoneEngine?.clearSelection?.(); });
  // Pins and the place card are created by the explorer once Cesium has loaded.
  const wait = setInterval(() => {
    if ($('#lot-explorer .zone-world') && $('.zone-place-info') && $('.zone-pin')) { clearInterval(wait); init(); }
  }, 300);
})();
