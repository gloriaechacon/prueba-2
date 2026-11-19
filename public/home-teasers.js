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
