/* Clouds — reusable legibility layer for big headlines over a scene (3D now, Blender sequence later).
   Layer order: scene → clouds → text. Each cloud uses a photographic cirrus texture with transparent edges.

   rpClouds.mount(stage, { lines, track, from = 0, to = .5 })
     stage  element the clouds are drawn into (positioned, same box as the headline)
     lines  elements to wrap (their boxes are measured; clouds sit behind them)
     track  element whose scroll progress drives the parting (default: stage's section)
     from…to  progress window in which the clouds part left/right and leave the frame
   Reduced motion: clouds stay still behind the text. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  function mount(stage, { lines = [], track, from = 0, to = .5 } = {}) {
    if (!stage || !lines.length) return null;
    const layer = document.createElement('div');
    layer.className = 'rp-clouds';
    layer.setAttribute('aria-hidden', 'true');
    stage.append(layer);
    track = track || stage.closest('section') || stage;
    // For every line: a dense core behind the words plus two softer satellites (parallax at other speeds).
    const clouds = [];
    lines.forEach((line, li) => {
      const side = li % 2 === 0 ? -1 : 1;              // first line parts left, second right
      [{ k: 'core', w: 2.7, h: 3.1, dx: -.85, dy: -.8, speed: 1, op: .88 },
       { k: 'back', w: 2.2, h: 2.2, dx: side < 0 ? -1.25 : .2, dy: -.95, speed: .65, op: .65 },
       { k: 'lift', w: 1.8, h: 1.6, dx: side < 0 ? -.65 : .1, dy: .55, speed: 1.35, op: .5 }].forEach((c, ci) => {
        const el = document.createElement('div');
        el.className = 'rp-cloud rp-cloud--' + c.k;
        el.style.backgroundImage = 'url(/assets/cirrus-overlay.webp)';
        el.style.setProperty('--op', c.op);
        layer.append(el);
        clouds.push({ el, line, side, ...c });
      });
    });
    function place() {
      const s = stage.getBoundingClientRect();
      for (const c of clouds) {
        const prev = c.line.style.transform; c.line.style.transform = 'none';
        const r = c.line.getBoundingClientRect(); c.line.style.transform = prev;
        const w = Math.max(r.width, 120) * c.w, h = r.height * c.h;
        c.el.style.width = w + 'px'; c.el.style.height = h + 'px';
        c.el.style.left = (r.left - s.left + r.width * c.dx) + 'px';
        c.el.style.top = (r.top - s.top + r.height * c.dy) + 'px';
      }
    }
    let raf = 0;
    function update() {
      raf = 0;
      if (reduce.matches) { clouds.forEach(c => { c.el.style.transform = 'none'; c.el.style.opacity = c.op; }); return; }
      const r = track.getBoundingClientRect(), span = Math.max(1, track.offsetHeight - innerHeight);
      const p = Math.min(1, Math.max(0, -r.top / span));
      const k = Math.min(1, Math.max(0, (p - from) / (to - from)));
      const e = k * k * (3 - 2 * k);
      for (const c of clouds) {
        const x = c.side * e * c.speed * innerWidth * .75;
        c.el.style.transform = `translate3d(${x.toFixed(1)}px,${(-e * 30 * c.speed).toFixed(1)}px,0)`;
        c.el.style.opacity = (c.op * (1 - e)).toFixed(3);
      }
    }
    const schedule = () => { if (!raf) raf = requestAnimationFrame(update); };
    reduce.addEventListener('change', schedule);
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', () => { place(); schedule(); });
    new ResizeObserver(() => { place(); schedule(); }).observe(stage);
    document.fonts?.ready.then(() => { place(); schedule(); });
    place(); update();
    requestAnimationFrame(() => layer.classList.add('is-in'));
    return { layer, refresh() { place(); schedule(); } };
  }
  window.rpClouds = { mount };
})();
