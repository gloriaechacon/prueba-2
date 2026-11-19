/* Rainbow Park Collection — motion system (redesign, phase 1).
 *
 * One module for every scroll/entrance animation, built on GSAP + ScrollTrigger
 * from /vendor. Apply it declaratively:
 *
 *   data-reveal="lines"   headline revealed line by line (mask + rise).
 *                         Lines are the authored lines: split at <br> or, if the
 *                         element has [data-line] children, one line per child.
 *                         Text nodes are moved, never rewritten, so i18n.js keeps
 *                         translating them in EN / ES / PT.
 *   data-reveal="fade"    paragraph fade + rise.
 *   data-reveal="clip"    image/figure revealed with clip-path.
 *                         data-reveal-from="bottom|top|left|right" (default bottom).
 *
 *   Optional: data-reveal-delay="0.2"  data-reveal-stagger="0.08"
 *             data-reveal-start="top 85%"
 *
 *   .portal[data-portal]  arched film portal that grows to full screen with
 *                         scroll (see portal.css for the markup contract).
 *   .arrival              the home's 3D hero (arrival-3d.js + hero-path.js).
 *
 * prefers-reduced-motion: nothing is hidden or moved; the page renders in its
 * final state. If GSAP fails to load, the inline failsafe in <head> removes the
 * pending state so content is always readable.
 */
(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const EASE = 'expo.out';

  const load = src => new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src; s.onload = resolve; s.onerror = reject;
    document.head.append(s);
  });

  const finish = () => {
    root.classList.remove('motion-pending');
    clearTimeout(window.__rpMotionFailsafe);
  };

  /* ---------- line splitting (structure only, text nodes preserved) ---------- */
  function splitLines(el) {
    if (el.dataset.split === 'done') return [...el.querySelectorAll(':scope > .motion-line > span')];
    const groups = [];
    const explicit = el.querySelectorAll(':scope > [data-line]');
    if (explicit.length) {
      explicit.forEach(child => groups.push([child]));
    } else {
      let current = [];
      [...el.childNodes].forEach(node => {
        if (node.nodeName === 'BR') { groups.push(current); current = []; node.remove(); }
        else current.push(node);
      });
      groups.push(current);
    }
    const inners = [];
    groups.filter(g => g.some(n => n.nodeType === 1 || n.textContent.trim())).forEach(nodes => {
      const line = document.createElement('span');
      const inner = document.createElement('span');
      line.className = 'motion-line';
      line.append(inner);
      nodes[0].before(line);
      nodes.forEach(n => inner.append(n));
      inners.push(inner);
    });
    el.dataset.split = 'done';
    return inners;
  }

  const num = (v, d) => (v === undefined || v === '' || isNaN(+v) ? d : +v);

  const clipFrom = {
    bottom: 'inset(100% 0% 0% 0%)',
    top: 'inset(0% 0% 100% 0%)',
    left: 'inset(0% 100% 0% 0%)',
    right: 'inset(0% 0% 0% 100%)'
  };

  /* ---------- declarative reveals ---------- */
  function initReveals(scope = document) {
    scope.querySelectorAll('[data-reveal]:not([data-reveal-bound])').forEach(el => {
      el.setAttribute('data-reveal-bound', '');
      const type = el.dataset.reveal;
      const delay = num(el.dataset.revealDelay, 0);
      const stagger = num(el.dataset.revealStagger, 0.09);
      const start = el.dataset.revealStart || 'top 86%';
      let tween;

      if (type === 'lines') {
        const lines = splitLines(el);
        gsap.set(el, { autoAlpha: 1 });
        tween = gsap.fromTo(lines, { y: 0, yPercent: 110 }, {
          y: 0, yPercent: 0, duration: 1.15, ease: EASE, stagger, delay, paused: true
        });
      } else if (type === 'clip') {
        const from = clipFrom[el.dataset.revealFrom] || clipFrom.bottom;
        const media = el.querySelector('img,video') || el;
        gsap.set(el, { autoAlpha: 1 });
        tween = gsap.timeline({ paused: true, delay })
          .fromTo(el, { clipPath: from }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.inOut' }, 0)
          .fromTo(media === el ? [] : media, { scale: 1.15 }, { scale: 1, duration: 1.6, ease: EASE }, 0);
      } else {
        tween = gsap.fromTo(el, { autoAlpha: 0, y: 28 }, {
          autoAlpha: 1, y: 0, duration: 1, ease: 'power3.out', delay, paused: true
        });
      }
      ScrollTrigger.create({ trigger: el, start, once: true, onEnter: () => tween.play() });
    });
  }

  /* ---------- Portal intro component (phase-1 arrival, extracted unchanged) ----------
   * Any .portal[data-portal]: arched frame + film grows to full screen with scroll,
   * split headline travels from beside the frame into place. */
  /* Portal: the whole geometry lives in portal.css as a function of --portal-p (0 = small arch,
     1 = full screen). CSS paints the arch before any JS; here GSAP only scrubs the variables with the
     scroll, so scrolling back up closes the film to the arch again. No one-off entrance. */
  /* Portal: the whole geometry lives in portal.css as a function of --portal-p (0 = small arch,
     1 = full screen). CSS paints the arch before any JS; here GSAP only scrubs the variables with the
     scroll, so scrolling back up closes the film to the arch again. No one-off entrance. */
  function initPortal(portal) {
    portal.classList.add('is-live');
    gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: portal, start: 'top top', end: 'bottom bottom', scrub: 0.6 }
    })
      .fromTo(portal, { '--portal-p': 0 }, { '--portal-p': 1, duration: 0.7, ease: 'power2.inOut' }, 0)
      .fromTo(portal, { '--portal-tint': 0 }, { '--portal-tint': 1, duration: 0.22 }, 0.3)
      .fromTo(portal, { '--portal-shade': 0 }, { '--portal-shade': 1, duration: 0.3 }, 0.35)
      .fromTo(portal, { '--portal-foot': 0 }, { '--portal-foot': 1, duration: 0.2 }, 0.56)
      .to({}, { duration: 0.12 });
  }
  const portalStatic = () => document.querySelectorAll('[data-portal]').forEach(p => p.classList.add('portal--static'));

  /* Inner-page intro: nav over media + gentle parallax (parallax only with motion). */
  function pageIntroNav() {
    const intro = document.querySelector('.page-intro');
    const nav = document.querySelector('.final-nav');
    if (!intro || !nav) return;
    document.body.classList.add('has-page-intro');
    const update = () => nav.classList.toggle('is-over-media', intro.getBoundingClientRect().bottom > nav.offsetHeight * 2);
    addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
    addEventListener('resize', update);
    update();
  }
  function pageIntroMotion() {
    if (root.classList.contains('skip-page-intro')) return;
    const intro = document.querySelector('.page-intro');
    const img = intro?.querySelector('.page-intro-media img');
    if (!img) return;
    gsap.fromTo(img, { scale: 1.12 }, { scale: 1, duration: 2.4, ease: 'power2.out' });
    gsap.to(img, { yPercent: 10, ease: 'none', scrollTrigger: { trigger: intro, start: 'top top', end: 'bottom top', scrub: true } });
  }

  /* Film controls for portals: work with and without motion. */
  function portalFilms() {
    document.querySelectorAll('[data-portal]').forEach(portal => {
      const video = portal.querySelector('video');
      const toggle = portal.querySelector('[data-portal-toggle]');
      if (!video) return;
      const label = () => {
        if (!toggle) return;
        const lang = window.rpcI18n?.language || 'en';
        const words = { en: ['Play ▶', 'Pause II'], es: ['Reproducir ▶', 'Pausar II'], pt: ['Reproduzir ▶', 'Pausar II'] }[lang] || ['Play ▶', 'Pause II'];
        toggle.textContent = video.paused ? words[0] : words[1];
        toggle.setAttribute('aria-pressed', String(!video.paused));
      };
      let manual = false;
      if (reduce.matches) { video.removeAttribute('autoplay'); video.pause(); }
      video.addEventListener('play', label); video.addEventListener('pause', label);
      document.addEventListener('rpc:language', label);
      toggle?.addEventListener('click', () => { manual = !video.paused; if (video.paused) video.play().catch(label); else video.pause(); });
      new IntersectionObserver(([e]) => {
        if (e.isIntersecting && !manual && !reduce.matches) video.play().catch(label);
        else if (!e.isIntersecting) video.pause();
      }, { threshold: 0.15 }).observe(video);
      label();
    });
  }

  /* ---------- Chapter 0 + 1: "La llegada" — 3D approach to Casa Utah ---------- */
  function initArrival() {
    const arrival = document.querySelector('.arrival');
    if (!arrival) return;
    const sceneEl = arrival.querySelector('.arrival-scene');
    const poster = arrival.querySelector('.arrival-poster');
    const intro = arrival.querySelector('.arrival-intro');
    const beats = [...arrival.querySelectorAll('.arrival-beat')];
    const lines = b => b.querySelectorAll('.arrival-line');
    const inners = b => b.querySelectorAll('.arrival-line > span');
    const footer = arrival.querySelector('.arrival-footer');
    const cue = arrival.querySelector('.arrival-scroll');
    const nav = document.querySelector('.final-home > .final-nav');
    const params = new URLSearchParams(location.search);
    const debug = params.get('debug') === 'camera' ? arrival.querySelector('.arrival-debug') : null;
    if (debug) debug.hidden = false;
    const mobile = innerWidth < 760;

    root.classList.add('motion-arrival');
    let ctrl = null, posterZoom = false, progress = 0;

    const use3D = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } })();
    // The 3D scene starts once the page has loaded and the main thread is idle (the poster shows
    // meanwhile), so the first taps and clicks are not delayed by model parsing / GPU warm-up.
    const afterLoad = () => new Promise(r => { const go = () => (window.requestIdleCallback || setTimeout)(r, { timeout: 1500 }); document.readyState === 'complete' ? go() : addEventListener('load', go, { once: true }); });
    if (use3D) {
      afterLoad().then(() => import('/arrival-3d.js')).then(m => {
        ctrl = m.mountArrival(sceneEl, { mobile, debug });
        ctrl.setProgress(progress);
        return ctrl.ready;
      }).then(() => { sceneEl.classList.add('is-live'); window.__arrivalReady = true; })
        .catch(error => { console.info('3D arrival unavailable; showing the poster.', error?.message || ''); posterZoom = true; sceneEl.classList.remove('is-live'); });
    } else posterZoom = true;

    const tl = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      scrollTrigger: {
        trigger: arrival, start: 'top top', end: 'bottom bottom', scrub: 1,
        onUpdate: self => {
          progress = self.progress;
          ctrl?.setProgress(progress);
          if (posterZoom && poster) gsap.set(poster, { scale: 1 + 0.22 * progress });
          if (debug && !ctrl) debug.textContent = `progress ${progress.toFixed(3)}\n(poster — 3D not loaded)`;
        }
      }
    });
    tl.to({}, { duration: 1 }, 0)
      .to(cue, { autoAlpha: 0, duration: 0.05 }, 0.01)
      .to(lines(beats[0])[0], { xPercent: -25, autoAlpha: 0, duration: 0.08 }, 0.16)
      .to(lines(beats[0])[1], { xPercent: 25, autoAlpha: 0, duration: 0.08 }, 0.16);
    if (beats[1]) tl
      .fromTo(inners(beats[1]), { y: 0, yPercent: 110 }, { yPercent: 0, duration: 0.07, stagger: 0.02 }, 0.30)
      .to(lines(beats[1]), { y: -30, autoAlpha: 0, duration: 0.07 }, 0.55);
    if (beats[2]) tl
      .fromTo(inners(beats[2]), { y: 0, yPercent: 110 }, { yPercent: 0, duration: 0.07, stagger: 0.02 }, 0.68);
    tl.fromTo(footer, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.06 }, 0.86);
    if (nav) nav.dataset.tone = 'ink';

    /* Intro wordmark: once per session, then the first headline rises. */
    let seen = false;
    try { seen = sessionStorage.getItem('rp-arrival') === '1'; sessionStorage.setItem('rp-arrival', '1'); } catch {}
    const atTop = scrollY < 10 && !location.hash;
    if (!intro || !atTop) {
      if (intro) intro.hidden = true;
      return;
    }
    const first = inners(beats[0]);
    const chrome = arrival.querySelectorAll('.arrival-meta, .arrival-utility');
    const it = gsap.timeline({ onComplete: () => { intro.hidden = true; } });
    if (!seen) {
      it.fromTo(intro.querySelectorAll('path'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut', stagger: 0.12 }, 0)
        .fromTo(intro.querySelectorAll('.arrival-intro-line > span'), { y: 0, yPercent: 110 }, { y: 0, yPercent: 0, duration: 1.1, ease: EASE, stagger: 0.08 }, 0.35)
        .fromTo(intro.querySelectorAll('.arrival-intro-label'), { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' }, 0.75)
        .to(intro.querySelector('.arrival-intro-mark'), { y: -40, autoAlpha: 0, duration: 0.7, ease: 'power3.in' }, 1.9);
    } else {
      gsap.set(intro.querySelector('.arrival-intro-mark'), { autoAlpha: 0 });
    }
    const open = seen ? 0.1 : 2.3;
    it.to(intro, { autoAlpha: 0, duration: 0.8, ease: 'power1.out' }, open - 0.25)
      .fromTo(first, { y: 0, yPercent: 110 }, { y: 0, yPercent: 0, duration: 1.2, ease: EASE, stagger: 0.12 }, open + 0.1)
      .fromTo(chrome, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8 }, open + 0.5);
    if (nav) it.fromTo(nav, { autoAlpha: 0, y: -16 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out', clearProps: 'transform,opacity,visibility' }, open + 0.4);
    const skip = () => { if (it.isActive()) it.progress(1); };
    ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(t => addEventListener(t, skip, { once: true, passive: true }));
  }

  async function start() {
    portalFilms();
    pageIntroNav();
    if (reduce.matches) { finish(); return; }
    try {
      if (!window.gsap) await load('/vendor/gsap.min.js');
      if (!window.ScrollTrigger) await load('/vendor/ScrollTrigger.min.js');
      // The failsafe already showed the static page: don't re-layout it now.
      if (window.__rpMotionTimedOut) { portalStatic(); return; }
      gsap.registerPlugin(ScrollTrigger);
      root.classList.add('motion-ready');
      initArrival();
      document.querySelectorAll('[data-portal]').forEach(initPortal);
      pageIntroMotion();
      initReveals();
      finish();
      document.addEventListener('toggle', () => ScrollTrigger.refresh(), true);
      document.addEventListener('rpc:language', () => ScrollTrigger.refresh());
      document.fonts?.ready.then(() => ScrollTrigger.refresh());
      addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
      window.rpMotion = { refresh: () => ScrollTrigger.refresh(), bind: initReveals };
    } catch (error) {
      root.classList.remove('motion-ready', 'motion-arrival');
      portalStatic();
      finish();
      console.info('Motion unavailable; content remains readable.');
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
