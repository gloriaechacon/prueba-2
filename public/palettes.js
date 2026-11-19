/* Palette selector (client comparison). Loaded in <head> on every page.
   - Sets data-palette on <html>; colours live in design-system.css (role tokens).
   - Choice: ?palette=<key> > localStorage > "champana". Shared with same-origin iframes.
   - The floating "Palette" control only exists on test hosts (localhost, Vercel previews).
     Production (rainbow-park.vercel.app, rainbow-park-collection.vercel.app and own domains)
     stays on "champana" and hides it, unless ?palette-panel=1 (remembered; ?palette-panel=0 clears). */
(() => {
  const PALETTES = {
    'champana': { name: 'Champaña', note: 'Current · reference', swatches: ['#26272b', '#f4efe4', '#896714', '#d2b77e', '#d8c49d'] },
    'verde-ocala': { name: 'Verde Ocala', note: 'Forest green & brass', swatches: ['#1F3A2E', '#F4EEE2', '#C29A4B', '#B8653F', '#597446'] },
    'atardecer': { name: 'Atardecer', note: 'Night blue & sunset', swatches: ['#16233B', '#F2E6D3', '#E8875B', '#D9A441', '#8FA58C'] },
    'tierra-ecuestre': { name: 'Tierra ecuestre', note: 'Saddle, pasture & sky', swatches: ['#7A3E22', '#F6F0E4', '#B98B3E', '#2F4A35', '#9DB8C9'] },
    'azul-rey': { name: 'Azul rey', note: 'Royal blue & gold', swatches: ['#1D3F94', '#F7F2E7', '#E2B93B', '#E86F51', '#0F1F4D'] },
    'esmeralda': { name: 'Esmeralda', note: 'Emerald & saffron', swatches: ['#0F6B4F', '#FBF6EC', '#F0B429', '#B5543F', '#0A3D2E'] },
    'cielo-florida': { name: 'Cielo Florida', note: 'Gulf blue & orange', swatches: ['#0E4D6E', '#F6EBD9', '#F28C28', '#3FA7D6', '#0E2F44'] },
    'borgona': { name: 'Borgoña', note: 'Burgundy & sage', swatches: ['#6B1E3A', '#F8F1E6', '#E5B54A', '#9DB49A', '#3D0F22'] },
    'cobalto': { name: 'Cobalto', note: 'Cobalt & terracotta', swatches: ['#2747A8', '#F5EFE4', '#D9673B', '#F2C14E', '#141B33'] }
  };
  const DEFAULT = 'champana';
  const KEY = 'rp-palette', PANEL_KEY = 'rp-palette-panel';
  const root = document.documentElement;
  const params = new URLSearchParams(location.search);
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { /* storage unavailable */ } }
  };
  const host = location.hostname;
  const production = !(host === 'localhost' || host === '127.0.0.1' || host === '' ||
    (host.endsWith('.vercel.app') && !['rainbow-park.vercel.app', 'rainbow-park-collection.vercel.app'].includes(host)));
  if (params.get('palette-panel') === '1') store.set(PANEL_KEY, '1');
  if (params.get('palette-panel') === '0') store.set(PANEL_KEY, null);
  const embedded = window.parent !== window;
  const enabled = !production || store.get(PANEL_KEY) === '1';
  const valid = k => Object.prototype.hasOwnProperty.call(PALETTES, k);

  let current = DEFAULT;
  if (enabled || embedded) {
    const fromUrl = params.get('palette');
    if (valid(fromUrl)) { current = fromUrl; if (enabled) store.set(KEY, fromUrl); }
    else if (valid(store.get(KEY))) current = store.get(KEY);
  }
  root.dataset.palette = current;

  let switching;
  function apply(key, { animate = true, persist = true, broadcast = true } = {}) {
    if (!valid(key)) return;
    if (key !== current && animate && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      root.classList.add('palette-switching');
      clearTimeout(switching);
      switching = setTimeout(() => root.classList.remove('palette-switching'), 450);
    }
    current = key;
    root.dataset.palette = key;
    if (persist && enabled) store.set(KEY, key);
    if (broadcast) document.querySelectorAll('iframe').forEach(f => { try { f.contentWindow.postMessage({ type: 'rainbow-palette', palette: key }, location.origin); } catch { /* cross-origin frame */ } });
    dispatchEvent(new CustomEvent('rp:palettechange', { detail: { palette: key } }));
    syncPanel();
  }
  window.rpPalette = { list: PALETTES, get: () => current, set: key => apply(key) };

  // Same-origin parent (proyecto/lotes map frame, /comparar) drives embedded pages.
  addEventListener('message', e => {
    if (e.origin !== location.origin) return;
    if (e.data?.type === 'rainbow-palette' && e.source === window.parent) apply(e.data.palette, { persist: false });
    if (e.data?.type === 'rainbow-section' && e.source === window.parent) {
      const id = e.data.section;
      if (!['inicio', 'project-intro-title', 'lotes', 'entorno', 'inversion', 'viviendas', 'contacto'].includes(id)) return;
      const target = id === 'project-intro-title' ? document.querySelector('.project-introduction') : document.getElementById(id);
      if (target) { const h = document.querySelector('header')?.getBoundingClientRect().height || 0; scrollTo({ top: scrollY + target.getBoundingClientRect().top - h, behavior: 'instant' }); }
    }
  });
  // Frames created after a change still start from the stored value; keep them in step when they load.
  document.addEventListener('load', e => { if (e.target.tagName === 'IFRAME') try { e.target.contentWindow.postMessage({ type: 'rainbow-palette', palette: current }, location.origin); } catch { /* ignore */ } }, true);

  /* ---------- Floating control ---------- */
  let panel, toggle, list;
  function syncPanel() {
    if (!panel) return;
    panel.querySelector('.rp-palette-current').textContent = PALETTES[current].name;
    list.querySelectorAll('button').forEach(b => b.setAttribute('aria-checked', String(b.dataset.key === current)));
  }
  function build() {
    if (!enabled || embedded || panel) return;
    panel = document.createElement('div');
    panel.className = 'rp-palette';
    panel.setAttribute('data-no-translate', '');
    panel.setAttribute('translate', 'no');
    panel.innerHTML = '<button type="button" class="rp-palette-toggle" aria-expanded="false" aria-controls="rp-palette-list">' +
      '<span class="rp-palette-dot" aria-hidden="true"></span><span>Palette</span> <span class="rp-palette-current"></span><span class="rp-palette-chev" aria-hidden="true">▴</span></button>' +
      '<div class="rp-palette-list" id="rp-palette-list" role="radiogroup" aria-label="Colour palette" hidden></div>';
    toggle = panel.querySelector('.rp-palette-toggle');
    list = panel.querySelector('.rp-palette-list');
    for (const [key, p] of Object.entries(PALETTES)) {
      const b = document.createElement('button');
      b.type = 'button'; b.dataset.key = key; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', 'false');
      b.innerHTML = '<span class="rp-palette-swatches" aria-hidden="true">' + p.swatches.map(c => '<i style="background:' + c + '"></i>').join('') + '</span>' +
        '<span class="rp-palette-name">' + p.name + '<small>' + p.note + '</small></span>';
      b.addEventListener('click', () => { apply(key); });
      list.append(b);
    }
    const open = state => {
      list.hidden = !state; toggle.setAttribute('aria-expanded', String(state));
      if (state) (list.querySelector('[aria-checked="true"]') || list.firstElementChild).focus();
    };
    toggle.addEventListener('click', () => open(list.hidden));
    list.addEventListener('keydown', e => {
      const items = [...list.querySelectorAll('button')];
      const i = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
      else if (e.key === 'Home') { e.preventDefault(); items[0].focus(); }
      else if (e.key === 'End') { e.preventDefault(); items[items.length - 1].focus(); }
      else if (e.key === 'Escape') { e.preventDefault(); open(false); toggle.focus(); }
    });
    document.addEventListener('pointerdown', e => { if (!panel.contains(e.target) && !list.hidden) open(false); });
    document.body.append(panel);
    syncPanel();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
