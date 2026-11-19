/* Clouds — reusable legibility layer for big headlines over a scene (3D now, Blender sequence later).
   Layer order: scene → clouds → text. Each cloud is an SVG with organic edges (turbulence
   displacement over overlapping lobes), warm white and semi-transparent.

   rpClouds.mount(stage, { lines, track, from = 0, to = .5 })
     stage  element the clouds are drawn into (positioned, same box as the headline)
     lines  elements to wrap (their boxes are measured; clouds sit behind them)
     track  element whose scroll progress drives the parting (default: stage's section)
     from…to  progress window in which the clouds part left/right and leave the frame
   Reduced motion: clouds stay still behind the text. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let uid = 0;
  // One cloud: 5–7 lobes, softened and displaced so the outline is irregular (never a plain oval).
  function cloudSVG(seed) {
    const id = 'rpc' + (++uid);
    const rnd = (() => { let s = seed * 9301 + 49297; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); })();
    const lobes = [];
    const n = 5 + Math.floor(rnd() * 3);
    for (let i = 0; i < n; i++) {
      const cx = 60 + (i / (n - 1)) * 280 + (rnd() - .5) * 30;
      const cy = 118 - Math.sin(Math.PI * i / (n - 1)) * (30 + rnd() * 26) + (rnd() - .5) * 12;
      const rx = 52 + rnd() * 40, ry = 34 + rnd() * 26;
      lobes.push(`<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}"/>`);
    }
    lobes.push(`<rect x="70" y="112" width="260" height="38" rx="19"/>`);
    return `<svg viewBox="0 0 400 200" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <defs><filter id="${id}" x="-20%" y="-30%" width="140%" height="160%">
        <feTurbulence type="fractalNoise" baseFrequency="${(.012 + rnd() * .008).toFixed(4)}" numOctaves="3" seed="${seed}" result="n"/>
        <feDisplacementMap in="SourceGraphic" in2="n" scale="${(34 + rnd() * 18).toFixed(0)}" xChannelSelector="R" yChannelSelector="G" result="d"/>
        <feGaussianBlur in="d" stdDeviation="7"/></filter></defs>
      <g filter="url(#${id})" fill="currentColor">${lobes.join('')}</g></svg>`;
  }

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
      [{ k: 'core', w: 1.3, h: 2.2, dx: -.14, dy: -.55, speed: 1, op: .86 },
       { k: 'back', w: .72, h: 1.5, dx: side < 0 ? -.34 : .62, dy: -.62, speed: .65, op: .55 },
       { k: 'lift', w: .62, h: 1.2, dx: side < 0 ? .55 : -.22, dy: .22, speed: 1.35, op: .5 }].forEach((c, ci) => {
        const el = document.createElement('div');
        el.className = 'rp-cloud rp-cloud--' + c.k;
        el.innerHTML = cloudSVG(li * 7 + ci * 3 + 3);
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
        c.el.style.opacity = (c.op * (1 - e * .85)).toFixed(3);
      }
    }
    const schedule = () => { if (!raf) raf = requestAnimationFrame(update); };
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
