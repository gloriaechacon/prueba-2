/* Home previews: the Surroundings film plays only while it is on screen (never with reduced
   motion) and always has a visible play / pause control. */
(() => {
  const video = document.querySelector('[data-teaser-video]');
  const toggle = document.querySelector('[data-teaser-toggle]');
  if (!video || !toggle) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const L = { en: ['Pause II', 'Play ▶'], es: ['Pausar II', 'Reproducir ▶'], pt: ['Pausar II', 'Reproduzir ▶'] };
  const lang = () => (window.rpcI18n?.language || new URLSearchParams(location.search).get('lang') || 'en').slice(0, 2);
  toggle.dataset.noTranslate = '';
  let wanted = !reduce.matches, visible = false;
  const label = () => { const t = L[lang()] || L.en; toggle.textContent = video.paused ? t[1] : t[0]; toggle.setAttribute('aria-pressed', String(!video.paused)); };
  const sync = () => { if (wanted && visible) video.play().catch(() => {}); else video.pause(); };
  video.addEventListener('play', label); video.addEventListener('pause', label);
  toggle.addEventListener('click', () => { wanted = video.paused; sync(); if (wanted && !visible) video.play().catch(() => {}); });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); }, { threshold: 0.35 }).observe(video);
  document.addEventListener('rpc:language', label);
  label();
})();
/* Hero clouds behind the first headline; they part left/right with the scroll (clouds.js). */
(() => {
  const stage = document.querySelector('.arrival-stage');
  const lines = [...document.querySelectorAll('.arrival-beat[data-beat="0"] .arrival-line')];
  if (stage && lines.length && window.rpClouds) window.rpClouds.mount(stage, { lines, track: document.querySelector('.arrival'), from: .13, to: .42 });
})();

/* Populate the home inquiry with the same stable parcel IDs as Contact. */
(() => {
  const form = document.querySelector('#home-consultation');
  if (!form || !window.rpcLots) return;
  const options = window.rpcLots.order.map(n => {
    const id = 'RP-' + String(n).padStart(2, '0');
    const option = new Option(window.rpcLots.label(id), id);
    form.elements.lot.add(option);
    return option;
  });
  document.addEventListener('rpc:language', () => options.forEach(o => o.textContent = window.rpcLots.label(o.value)));
})();

(() => {
  const copy = document.querySelector('[data-home-area-copy]');
  const text = {
    en: 'Explore the equestrian venues around Ocala, the waters and trails of Rainbow Springs, and the restaurants and local shops downtown.',
    es: 'Explora los espacios ecuestres de Ocala, las aguas y senderos de Rainbow Springs, y los restaurantes y comercios del centro.',
    pt: 'Explore os espaços equestres de Ocala, as águas e trilhas de Rainbow Springs e os restaurantes e lojas do centro.'
  };
  const update = () => {
    const lang = window.rpcI18n?.language || 'en';
    if (copy) copy.textContent = text[lang] || text.en;
    document.querySelectorAll('.home-lot').forEach((a, i) => {
      a.setAttribute('aria-label', (lang === 'en' ? 'Lot ' : 'Lote ') + String(i + 1).padStart(2, '0'));
    });
  };
  update(); document.addEventListener('rpc:language', update);
})();
