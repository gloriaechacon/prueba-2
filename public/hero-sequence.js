/* Hero "La llegada" — Blender image sequence on a canvas, driven by the scroll progress.
   /assets/hero-sequence/manifest.json + desktop|mobile/frame_NNNN.webp (frame i = progress (i-1)/(n-1)).
   Loading: frame 1 first (it is also the poster), then every 10th frame, then the rest; while a frame
   is missing the nearest loaded one is drawn, so fast scrolling never flashes empty.
   The three.js hero (arrival-3d.js, hero-path.js) stays in the repo as a fallback and is not loaded.
   SEQUENCE_VERSION busts the cache of the manifest and frames; keep it in sync with index.html. */
const SEQUENCE_VERSION = 'losa20261126';
export async function mountSequence(host, { variant } = {}) {
  const manifest = await fetch('/assets/hero-sequence/manifest.json?v=' + SEQUENCE_VERSION).then(r => r.json());
  const v = manifest.variants[variant] || manifest.variants.desktop;
  const n = v.frames;
  const dir = '/assets/hero-sequence/' + (manifest.variants[variant] ? variant : 'desktop') + '/';
  const url = i => dir + 'frame_' + String(i + 1).padStart(4, '0') + '.webp?v=' + SEQUENCE_VERSION;
  const canvas = document.createElement('canvas');
  canvas.className = 'arrival-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  host.append(canvas);
  const ctx = canvas.getContext('2d', { alpha: false });
  const frames = new Array(n);           // ImageBitmap | HTMLImageElement once decoded
  let progress = 0, drawn = -1, raf = 0, visible = true;

  const nearest = i => {
    if (frames[i]) return i;
    for (let d = 1; d < n; d++) { if (frames[i - d]) return i - d; if (frames[i + d]) return i + d; }
    return -1;
  };
  function size() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = Math.round(host.clientWidth * dpr), h = Math.round(host.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; drawn = -1; }
  }
  function draw() {
    raf = 0;
    if (!visible) return;
    size();
    const want = Math.round(progress * (n - 1)), k = nearest(want);
    if (k < 0 || k === drawn) return;
    const img = frames[k], iw = img.width, ih = img.height, cw = canvas.width, ch = canvas.height;
    const s = Math.max(cw / iw, ch / ih), w = iw * s, h = ih * s;   // cover
    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
    drawn = k;
  }
  const request = () => { if (!raf) raf = requestAnimationFrame(draw); };
  async function load(i) {
    if (frames[i]) return;
    try {
      const blob = await fetch(url(i)).then(r => { if (!r.ok) throw Error(r.status); return r.blob(); });
      frames[i] = 'createImageBitmap' in window ? await createImageBitmap(blob) : await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = URL.createObjectURL(blob); });
      if (Math.abs(i - Math.round(progress * (n - 1))) <= Math.abs(drawn - Math.round(progress * (n - 1)))) { drawn = -1; request(); }
    } catch { /* keep the nearest frame */ }
  }
  // Progressive queue: 1, every 10th, then the rest (a few requests in parallel, idle-friendly).
  const order = [0];
  for (let i = 10; i < n; i += 10) order.push(i);
  order.push(n - 1);
  for (let i = 0; i < n; i++) if (!order.includes(i)) order.push(i);
  const ready = load(0).then(() => { drawn = -1; draw(); });
  (async () => {
    await ready;
    let next = 1;
    const worker = async () => { while (next < order.length) { const i = order[next++]; await load(i); } };
    await Promise.all([worker(), worker(), worker(), worker()]);
  })();
  new ResizeObserver(() => { drawn = -1; request(); }).observe(host);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) { drawn = -1; request(); } }).observe(host);
  return {
    manifest: v, door: manifest.door, ready,
    setProgress(p) { progress = Math.min(1, Math.max(0, p)); request(); },
    loaded: () => frames.filter(Boolean).length
  };
}
