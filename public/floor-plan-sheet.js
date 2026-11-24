const copy = {
  en: { title: n => `The ${n} floor plan`, sub: 'Original architectural drawing. Explore the layout at your own pace.', full: 'Full plan', details: 'View details', note: 'Complete sheet · Original proportions', hint: 'Zoom to read the details; drag to move around the drawing.', error: 'The drawing could not load. Open the original PDF to view the plan.' },
  es: { title: n => `El plano de ${n}`, sub: 'Plano arquitectónico original. Explora la distribución a tu ritmo.', full: 'Plano completo', details: 'Ver detalles', note: 'Lámina completa · Proporciones originales', hint: 'Amplía para leer los detalles; arrastra para recorrer el plano.', error: 'No se pudo cargar el plano. Abre el PDF original para consultarlo.' },
  pt: { title: n => `A planta de ${n}`, sub: 'Desenho arquitetônico original. Explore a distribuição no seu ritmo.', full: 'Planta completa', details: 'Ver detalhes', note: 'Folha completa · Proporções originais', hint: 'Amplie para ler os detalhes; arraste para percorrer a planta.', error: 'Não foi possível carregar a planta. Abra o PDF original para consultá-la.' }
};

export function mountPlanSheet(root, home, house, language, common) {
  const s = copy[language] || copy.en;
  const ratio = house === 'utah' ? 2100 / 1990 : 2720 / 2510;
  const download = ({en:'Download PDF',es:'Descargar PDF',pt:'Baixar PDF'})[language] || 'Download PDF';
  const links = `<a href="${home.planPdf}" target="_blank" rel="noopener">${common.pdf}</a><a href="${home.planPdf}" download="${house}-floor-plan.pdf">${download}</a>`;
  const dialog = document.createElement('dialog'); dialog.className = 'plan-dialog'; dialog.dataset.noTranslate = '';
  dialog.setAttribute('aria-labelledby', 'plan-dialog-title');
  document.body.append(dialog);
  root.innerHTML = `<div class="plan-summary"><h3 class="t-title">${s.title(home.name)}</h3><button type="button" class="plan-open t-button">${s.details}</button><div class="plan-links">${links}</div></div><button type="button" class="plan-preview" aria-haspopup="dialog" aria-label="${s.details} · ${home.name}"><img src="${home.plan}" alt="" loading="lazy" decoding="async"><span aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/></svg></span></button>`;
  dialog.innerHTML = `<header class="plan-dialog-head"><h2 class="t-title" id="plan-dialog-title">${s.title(home.name)}</h2><button type="button" class="plan-close t-button" autofocus>${common.close} <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></header>
    <div class="plan-tools"><div class="plan-zoom"><button type="button" data-plan="out" aria-label="${common.zout}">−</button><button type="button" data-plan="fit">${common.fit}</button><button type="button" data-plan="in" aria-label="${common.zin}">+</button></div><output aria-live="polite">${s.full}</output><div class="plan-links">${links}</div></div>
    <div class="plan-viewport" tabindex="0" role="region" aria-label="${s.title(home.name)}" aria-describedby="plan-hint"><img alt="${s.title(home.name)}" draggable="false"><p class="plan-error" hidden>${s.error}</p></div><p id="plan-hint" class="plan-hint t-small">${s.hint}</p>`;
  const viewport = dialog.querySelector('.plan-viewport'), img = viewport.querySelector('img');
  const abort = new AbortController(), opts = { signal: abort.signal };
  let zoom = 1, width = 0, drag = null, pinch = null, opener = null, previousOverflow = null;
  function resize() {
    if (!dialog.open) return;
    width = Math.min(viewport.clientWidth, viewport.clientHeight / ratio);
    img.style.width = `${width * zoom}px`; img.style.height = `${width * ratio * zoom}px`;
  }
  function setZoom(next, x = viewport.clientWidth / 2, y = viewport.clientHeight / 2) {
    next = Math.max(1, Math.min(4, next));
    const factor = next / zoom, left = (viewport.scrollLeft + x) * factor - x, top = (viewport.scrollTop + y) * factor - y;
    zoom = next; resize();
    viewport.scrollLeft = zoom === 1 ? 0 : left; viewport.scrollTop = zoom === 1 ? 0 : top;
    viewport.classList.toggle('is-zoomed', zoom > 1);
    dialog.querySelector('output').textContent = zoom === 1 ? s.full : `${Math.round(zoom * 100)}%`;
    dialog.querySelector('[data-plan="out"]').disabled = zoom === 1;
    dialog.querySelector('[data-plan="in"]').disabled = zoom === 4;
  }
  function restore() {
    if (previousOverflow !== null) { document.body.style.overflow = previousOverflow; previousOverflow = null; }
    if (opener?.isConnected) opener.focus({ preventScroll: true });
  }
  root.addEventListener('click', e => {
    const button = e.target.closest('.plan-preview, .plan-open'); if (!button) return;
    opener = button; previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; dialog.showModal();
    if (!img.getAttribute('src')) img.src = home.plan;
    setZoom(1);
  }, opts);
  dialog.addEventListener('close', restore, opts);
  dialog.addEventListener('click', e => {
    if (e.target === dialog || e.target.closest('.plan-close')) { dialog.close(); return; }
    const action = e.target.closest('[data-plan]')?.dataset.plan;
    if (action) setZoom(action === 'fit' ? 1 : action === 'details' ? 2 : zoom + (action === 'in' ? .5 : -.5));
  }, opts);
  viewport.addEventListener('wheel', e => { e.preventDefault(); setZoom(zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15)); }, { ...opts, passive: false });
  viewport.addEventListener('keydown', e => {
    if (['+', '=', '-', '0'].includes(e.key)) { e.preventDefault(); setZoom(e.key === '0' ? 1 : zoom + (e.key === '-' ? -.5 : .5)); }
  }, opts);
  img.addEventListener('load', resize, opts);
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
  return () => { observer.disconnect(); abort.abort(); if (dialog.open) dialog.close(); restore(); dialog.remove(); };
}
