const copy = {
  en: { title: n => `The ${n} floor plan`, sub: 'Original architectural drawing. Explore the layout at your own pace.', full: 'Full plan', details: 'View details', note: 'Complete sheet · Original proportions', hint: 'Zoom to read the details; drag to move around the drawing.', error: 'The drawing could not load. Open the original PDF to view the plan.' },
  es: { title: n => `El plano de ${n}`, sub: 'Plano arquitectónico original. Explora la distribución a tu ritmo.', full: 'Plano completo', details: 'Ver detalles', note: 'Lámina completa · Proporciones originales', hint: 'Amplía para leer los detalles; arrastra para recorrer el plano.', error: 'No se pudo cargar el plano. Abre el PDF original para consultarlo.' },
  pt: { title: n => `A planta de ${n}`, sub: 'Desenho arquitetônico original. Explore a distribuição no seu ritmo.', full: 'Planta completa', details: 'Ver detalhes', note: 'Folha completa · Proporções originais', hint: 'Amplie para ler os detalhes; arraste para percorrer a planta.', error: 'Não foi possível carregar a planta. Abra o PDF original para consultá-la.' }
};

export function mountPlanSheet(root, home, house, language, common) {
  const s = copy[language] || copy.en;
  const ratio = house === 'utah' ? 2100 / 1990 : 2720 / 2510;
  root.innerHTML = `<header class="plan-heading"><h3 class="t-display">${s.title(home.name)}</h3><div class="plan-houses" role="group" aria-label="Utah / Bell">${['utah', 'bell'].map(id => `<button type="button" data-house="${id}" aria-pressed="${house === id}">${id === 'utah' ? 'Utah' : 'Bell'}</button>`).join('')}</div></header>
    <p class="plan-intro">${s.sub}</p>
    <div class="plan-tools"><output aria-live="polite">${s.full}</output><div class="plan-zoom"><button type="button" data-plan="out" aria-label="${common.zout}">−</button><button type="button" data-plan="fit">${common.fit}</button><button type="button" data-plan="in" aria-label="${common.zin}">+</button></div><button type="button" data-plan="details">${s.details}</button><a href="${home.planPdf}" target="_blank" rel="noopener">${common.pdf}</a></div>
    <div class="plan-viewport" tabindex="0" role="region" aria-label="${s.title(home.name)}" aria-describedby="plan-hint"><img src="${home.plan}" alt="${s.title(home.name)}" width="${house === 'utah' ? 1990 : 2510}" height="${house === 'utah' ? 2100 : 2720}" loading="lazy" draggable="false"><p class="plan-error" hidden>${s.error}</p></div>
    <div class="plan-caption"><span>Kimsa Construction LLC / ${home.name}</span><span>${s.note}</span></div><p id="plan-hint" class="plan-hint">${s.hint}</p>`;
  const viewport = root.querySelector('.plan-viewport'), img = viewport.querySelector('img');
  const abort = new AbortController(), opts = { signal: abort.signal };
  let zoom = 1, width = 0, drag = null, pinch = null;
  function resize() {
    width = viewport.clientWidth;
    viewport.style.height = `${Math.round(width * ratio)}px`;
    img.style.width = `${width * zoom}px`; img.style.height = `${width * ratio * zoom}px`;
  }
  function setZoom(next, x = viewport.clientWidth / 2, y = viewport.clientHeight / 2) {
    next = Math.max(1, Math.min(4, next));
    const factor = next / zoom, left = (viewport.scrollLeft + x) * factor - x, top = (viewport.scrollTop + y) * factor - y;
    zoom = next; resize();
    viewport.scrollLeft = zoom === 1 ? 0 : left; viewport.scrollTop = zoom === 1 ? 0 : top;
    viewport.classList.toggle('is-zoomed', zoom > 1);
    root.querySelector('output').textContent = zoom === 1 ? s.full : `${Math.round(zoom * 100)}%`;
    root.querySelector('[data-plan="out"]').disabled = zoom === 1;
    root.querySelector('[data-plan="in"]').disabled = zoom === 4;
  }
  root.addEventListener('click', e => {
    const action = e.target.closest('[data-plan]')?.dataset.plan;
    if (action) setZoom(action === 'fit' ? 1 : action === 'details' ? 2 : zoom + (action === 'in' ? .5 : -.5));
  }, opts);
  viewport.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || zoom === 1) return;
    drag = { x: e.clientX, y: e.clientY, left: viewport.scrollLeft, top: viewport.scrollTop };
    viewport.setPointerCapture(e.pointerId); viewport.focus({ preventScroll: true }); e.preventDefault();
  }, opts);
  viewport.addEventListener('pointermove', e => { if (drag) { viewport.scrollLeft = drag.left + drag.x - e.clientX; viewport.scrollTop = drag.top + drag.y - e.clientY; } }, opts);
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) viewport.addEventListener(event, () => { drag = null; }, opts);
  const distance = ts => Math.hypot(ts[0].clientX - ts[1].clientX, ts[0].clientY - ts[1].clientY);
  viewport.addEventListener('touchstart', e => { if (e.touches.length === 2) { pinch = { distance: distance(e.touches), zoom }; e.preventDefault(); } }, { ...opts, passive: false });
  viewport.addEventListener('touchmove', e => {
    if (!pinch || e.touches.length !== 2) return;
    e.preventDefault(); const rect = viewport.getBoundingClientRect();
    setZoom(pinch.zoom * distance(e.touches) / Math.max(1, pinch.distance), (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left, (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top);
  }, { ...opts, passive: false });
  for (const event of ['touchend', 'touchcancel']) viewport.addEventListener(event, () => { pinch = null; }, opts);
  img.addEventListener('error', () => { img.hidden = true; viewport.querySelector('.plan-error').hidden = false; }, opts);
  const observer = new ResizeObserver(resize); observer.observe(viewport); setZoom(1);
  return () => { observer.disconnect(); abort.abort(); };
}
