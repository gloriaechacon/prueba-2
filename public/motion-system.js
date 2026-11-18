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
 * prefers-reduced-motion: nothing is hidden or moved; the page renders in its
 * final state. If GSAP fails to load, the inline failsafe in <head> removes the
 * pending state so content is always readable.
 */
(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const EASE = 'expo.out';
  const INK = '#292a2d';
  const CREAM = '#f7f2e7';

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

  /* ---------- Chapter 0 + 1: "La llegada" ---------- */
  function initArrival() {
    const arrival = document.querySelector('.arrival');
    if (!arrival) return;
    const stage = arrival.querySelector('.arrival-stage');
    const portal = arrival.querySelector('.arrival-portal');
    const video = portal.querySelector('video');
    const shade = arrival.querySelector('.arrival-shade');
    const intro = arrival.querySelector('.arrival-intro');
    const left = arrival.querySelector('.arrival-line--left');
    const right = arrival.querySelector('.arrival-line--right');
    const inners = arrival.querySelectorAll('.arrival-line > span');
    const tinted = arrival.querySelectorAll('.arrival-title, .arrival-meta, .arrival-utility');
    const footer = arrival.querySelector('.arrival-footer');
    const nav = document.querySelector('.final-home > .final-nav');

    root.classList.add('motion-arrival');
    const state = { p: 0, o: 1 };
    let g;
    const lerp = (a, b, t) => a + (b - a) * t;

    function geometry() {
      const W = stage.clientWidth, H = stage.clientHeight;
      const mobile = W < 760;
      const w0 = mobile ? W * 0.62 : Math.min(W * 0.3, 470);
      const h0 = Math.min(H * (mobile ? 0.44 : 0.64), w0 * 1.5);
      const top = (H - h0) / 2 + H * (mobile ? 0.05 : 0.04);
      g = { W, H, w0, h0, top, left: (W - w0) / 2, mobile };
    }

    function applyClip() {
      if (!g) geometry();
      const e = state.p;
      const top = lerp(g.top + (1 - state.o) * g.h0, 0, e);
      const side = lerp(g.left, 0, e);
      const bottom = lerp(g.H - g.top - g.h0, 0, e);
      const r = lerp(g.w0 / 2, 0, e);
      portal.style.clipPath = `inset(${top}px ${side}px ${bottom}px ${side}px round ${r}px ${r}px 0px 0px)`;
    }

    /* Start pose for the split headline, measured from its final CSS layout. */
    function startPose(line, isLeft) {
      if (!g) geometry();
      const prev = line.style.transform;
      line.style.transform = 'none';
      const box = line.getBoundingClientRect();
      const sb = stage.getBoundingClientRect();
      line.style.transform = prev;
      const rect = { left: box.left - sb.left, right: box.right - sb.left, top: box.top - sb.top, bottom: box.bottom - sb.top, width: box.width, height: box.height };
      const gutter = Math.max(16, g.W * 0.05);
      const gap = g.mobile ? 14 : 28;
      if (g.mobile) {
        const scale = Math.min(1, (g.W - gutter * 2) / rect.width);
        const y = isLeft
          ? (g.top - gap - rect.height * scale) - rect.top
          : (g.top + g.h0 + gap) - rect.top;
        return { x: 0, y, scale };
      }
      const room = g.left - gap - gutter;
      const scale = Math.min(1, room / rect.width);
      const anchor = g.top + g.h0 * (isLeft ? 0.3 : 0.66);
      const y = anchor - (rect.top + rect.height * scale / 2);
      const x = isLeft ? gutter - rect.left : (g.W - gutter) - rect.right;
      return { x, y, scale };
    }

    gsap.set(left, { transformOrigin: 'left top' });
    gsap.set(right, { transformOrigin: 'right top' });

    const scrollTl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: arrival,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.6,
        invalidateOnRefresh: true,
        onRefreshInit: () => { g = null; },
        onRefresh: () => { geometry(); applyClip(); },
        onUpdate: self => { if (nav) nav.dataset.tone = self.progress < 0.42 ? 'ink' : 'light'; }
      }
    });
    scrollTl
      .to(state, { p: 1, duration: 0.7, ease: 'power2.inOut', onUpdate: applyClip }, 0)
      .fromTo(video, { scale: 1.2 }, { scale: 1, duration: 0.7 }, 0)
      .fromTo(left, { x: () => startPose(left, true).x, y: () => startPose(left, true).y, scale: () => startPose(left, true).scale },
        { x: 0, y: 0, scale: 1, duration: 0.7, ease: 'power2.inOut' }, 0)
      .fromTo(right, { x: () => startPose(right, false).x, y: () => startPose(right, false).y, scale: () => startPose(right, false).scale },
        { x: 0, y: 0, scale: 1, duration: 0.7, ease: 'power2.inOut' }, 0)
      .fromTo(tinted, { color: INK }, { color: CREAM, duration: 0.22 }, 0.3)
      .fromTo(shade, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.35)
      .fromTo(footer, { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 0.16 }, 0.7)
      .to({}, { duration: 0.12 });
    if (nav) nav.dataset.tone = 'ink';

    /* Intro: wordmark draws, lifts, and the portal opens. */
    let seen = false;
    try { seen = sessionStorage.getItem('rp-arrival') === '1'; sessionStorage.setItem('rp-arrival', '1'); } catch {}
    const atTop = scrollY < 10 && !location.hash;
    if (!intro || !atTop) {
      if (intro) intro.hidden = true;
      return;
    }
    const arcs = intro.querySelectorAll('path');
    const words = intro.querySelectorAll('.arrival-intro-line > span');
    const label = intro.querySelectorAll('.arrival-intro-label');
    state.o = 0; applyClip();
    const tl = gsap.timeline({ onComplete: () => { intro.hidden = true; } });
    if (!seen) {
      tl.fromTo(arcs, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut', stagger: 0.12 }, 0)
        .fromTo(words, { y: 0, yPercent: 110 }, { y: 0, yPercent: 0, duration: 1.1, ease: EASE, stagger: 0.08 }, 0.35)
        .fromTo(label, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' }, 0.75)
        .to(intro.querySelector('.arrival-intro-mark'), { y: -40, autoAlpha: 0, duration: 0.7, ease: 'power3.in' }, 1.9);
    } else {
      gsap.set(intro.querySelector('.arrival-intro-mark'), { autoAlpha: 0 });
    }
    const open = seen ? 0 : 2.3;
    tl.to(intro, { autoAlpha: 0, duration: 0.6, ease: 'power1.out' }, open - 0.25)
      .to(state, { o: 1, duration: 1.3, ease: 'expo.out', onUpdate: applyClip }, open)
      .fromTo(inners, { y: 0, yPercent: 110 }, { y: 0, yPercent: 0, duration: 1.2, ease: EASE, stagger: 0.12 }, open + 0.15)
      .fromTo(arrival.querySelectorAll('.arrival-meta, .arrival-utility'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8 }, open + 0.5);
    if (nav) tl.fromTo(nav, { autoAlpha: 0, y: -16 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out', clearProps: 'transform,opacity,visibility' }, open + 0.4);

    const skip = () => { if (tl.isActive()) tl.progress(1); };
    ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(t => addEventListener(t, skip, { once: true, passive: true }));
  }

  /* The arrival lays its labels under the real header height (also without motion). */
  function trackNav() {
    const nav = document.querySelector('.final-home > .final-nav');
    const arrival = document.querySelector('.arrival');
    if (!nav || !arrival || !window.ResizeObserver) return;
    new ResizeObserver(() => arrival.style.setProperty('--arrival-nav', Math.ceil(nav.getBoundingClientRect().height) + 'px')).observe(nav);
  }

  async function start() {
    trackNav();
    if (reduce.matches) { finish(); return; }
    try {
      if (!window.gsap) await load('/vendor/gsap.min.js');
      if (!window.ScrollTrigger) await load('/vendor/ScrollTrigger.min.js');
      // The failsafe already showed the static page: don't re-layout it now.
      if (window.__rpMotionTimedOut) return;
      gsap.registerPlugin(ScrollTrigger);
      root.classList.add('motion-ready');
      initArrival();
      initReveals();
      finish();
      document.addEventListener('toggle', () => ScrollTrigger.refresh(), true);
      document.addEventListener('rpc:language', () => ScrollTrigger.refresh());
      document.fonts?.ready.then(() => ScrollTrigger.refresh());
      addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
      window.rpMotion = { refresh: () => ScrollTrigger.refresh(), bind: initReveals };
    } catch (error) {
      root.classList.remove('motion-ready', 'motion-arrival');
      finish();
      console.info('Motion unavailable; content remains readable.');
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
