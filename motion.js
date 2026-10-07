/* Cuesic motion layer: nav, smooth scroll, reveals, marquees, scroll progress.
   Everything here is an enhancement. Pages read correctly without it. */
(function () {
  'use strict';

  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  root.classList.add('js');
  window.__cuesicMotion = true;   // tells the head failsafe that we are running

  /* ---------- Nav: mobile sheet + scrolled state ---------- */
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');
  function closeMenu() {
    navToggle?.classList.remove('active');
    navMenu?.classList.remove('active');
    navToggle?.setAttribute('aria-expanded', 'false');
  }
  if (navToggle && navMenu) {
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.addEventListener('click', () => {
      const open = navMenu.classList.toggle('active');
      navToggle.classList.toggle('active', open);
      navToggle.setAttribute('aria-expanded', String(open));
    });
    navMenu.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
    document.addEventListener('click', e => {
      if (!e.target.closest('.nav')) closeMenu();
    });
  }

  /* ---------- Smooth scroll (Lenis, optional) ---------- */
  let lenis = null;
  function scrollToTarget(el) {
    if (lenis) lenis.scrollTo(el, { offset: -96 });
    else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (href.length < 2) return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    scrollToTarget(target);
  });

  function startLenis() {
    if (!window.Lenis || lenis) return;
    try {
      lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
    } catch (err) { lenis = null; return; }
    lenis.on('scroll', onScroll);
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    syncModalLock();
  }
  if (!reduce) {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/lenis@1.1.20/dist/lenis.min.js';
    s.async = true;
    s.onload = startLenis;
    document.head.appendChild(s);
  }

  /* The event modal must scroll by itself and hold the page still. */
  const modal = document.getElementById('event-modal');
  function syncModalLock() {
    if (!modal || !lenis) return;
    if (modal.classList.contains('active')) lenis.stop(); else lenis.start();
  }
  if (modal) {
    modal.setAttribute('data-lenis-prevent', '');
    new MutationObserver(syncModalLock).observe(modal, { attributes: true, attributeFilter: ['class'] });
  }

  /* ---------- Headline line split ---------- */
  $$('[data-split], .app-headline, .page-header h1, .sub-hero h1').forEach(h => {
    const lines = [[]];
    Array.from(h.childNodes).forEach(n => {
      if (n.nodeName === 'BR') lines.push([]);
      else lines[lines.length - 1].push(n);
    });
    h.textContent = '';
    lines.forEach((nodes, i) => {
      if (!nodes.some(n => n.textContent.trim())) return;
      const line = document.createElement('span');
      line.className = 'line';
      const inner = document.createElement('span');
      inner.className = 'line-in';
      inner.style.setProperty('--i', i);
      nodes.forEach(n => inner.appendChild(n));
      line.appendChild(inner);
      h.appendChild(line);
      if (i < lines.length - 1) h.appendChild(document.createTextNode(' '));
    });
    requestAnimationFrame(() => requestAnimationFrame(() => h.classList.add('split-in')));
  });

  /* ---------- Gallery grid -> two counter-scrolling rows ---------- */
  if (!reduce) {
    $$('[data-marquee-rows]').forEach(grid => {
      const items = Array.from(grid.children);
      const rows = Math.max(1, parseInt(grid.dataset.marqueeRows, 10) || 2);
      const per = Math.ceil(items.length / rows);
      grid.classList.add('gallery-rows');
      for (let r = 0; r < rows; r++) {
        const m = document.createElement('div');
        m.className = 'marquee';
        m.setAttribute('data-marquee', r % 2 ? 'reverse' : '');
        m.style.setProperty('--speed', '34');
        const track = document.createElement('div');
        track.className = 'marquee-track';
        items.slice(r * per, (r + 1) * per).forEach(it => track.appendChild(it));
        m.appendChild(track);
        grid.appendChild(m);
      }
    });
  }

  /* ---------- Marquees ---------- */
  const marquees = [];
  function buildMarquee(m) {
    const track = m.querySelector('.marquee-track');
    if (!track) return;
    $$('[data-clone]', track).forEach(c => c.remove());
    m.classList.add('is-ready');
    const originals = Array.from(track.children);
    if (!originals.length) return;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const setWidth = track.scrollWidth + gap;   // one full set, including its trailing gap
    if (setWidth <= gap) return;
    const copies = Math.ceil(m.clientWidth / setWidth) + 1;
    for (let c = 0; c < copies; c++) {
      originals.forEach(o => {
        const clone = o.cloneNode(true);
        clone.setAttribute('data-clone', '');
        clone.setAttribute('aria-hidden', 'true');
        $$('a, button', clone).forEach(f => f.setAttribute('tabindex', '-1'));
        track.appendChild(clone);
      });
    }
    const speed = parseFloat(getComputedStyle(m).getPropertyValue('--speed')) || 48; // px per second
    track.style.setProperty('--shift', setWidth + 'px');
    track.style.setProperty('--dur', (setWidth / speed) + 's');
  }
  if (!reduce) {
    $$('[data-marquee]').forEach(m => { marquees.push(m); buildMarquee(m); });
    let rt;
    window.addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(() => marquees.forEach(buildMarquee), 200);
    });
    window.addEventListener('load', () => marquees.forEach(buildMarquee));
    if ('IntersectionObserver' in window) {
      const mo = new IntersectionObserver(es => es.forEach(e =>
        e.target.classList.toggle('is-paused', !e.isIntersecting)));
      marquees.forEach(m => mo.observe(m));
    }
  }

  /* ---------- Reveal on scroll ---------- */
  const STAGGER = '.about-grid, .services-grid, .why-grid, .founders-grid, .cards, ' +
                  '.contact-socials, .feature-text, .gallery-grid:not(.gallery-rows), [data-reveal-stagger]';
  $$(STAGGER).forEach(group => {
    Array.from(group.children).forEach((child, i) => {
      if (!child.hasAttribute('data-reveal')) child.setAttribute('data-reveal', '');
      child.style.setProperty('--i', Math.min(i, 8));
    });
  });

  const revealEls = $$('.fade-up, [data-reveal]');
  function reveal(el) {
    el.classList.add('revealed');
    const i = parseFloat(el.style.getPropertyValue('--i')) || 0;
    // Once the entrance has played, hand the element back to its own styles
    // so hover transitions are not delayed by the stagger.
    setTimeout(() => {
      el.classList.remove('fade-up', 'revealed');
      el.removeAttribute('data-reveal');
    }, 1100 + i * 70);
  }
  if (reduce || !('IntersectionObserver' in window)) {
    revealEls.forEach(el => { el.classList.remove('fade-up'); el.removeAttribute('data-reveal'); });
  } else {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        reveal(entry.target);
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });
    revealEls.forEach(el => io.observe(el));
  }

  /* ---------- Pointer glow on cards ---------- */
  const GLOW = '.card, .org-card, .about-item, .service-card, .why-item, ' +
               '.contact-card, .contact-card-inner, .partnership-card';
  $$(GLOW).forEach(el => el.setAttribute('data-glow', ''));
  if (window.matchMedia('(hover: hover)').matches) {
    document.addEventListener('pointermove', e => {
      const el = e.target.closest?.('[data-glow]');
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, { passive: true });
  }

  /* ---------- Scroll progress (--p from 0 to 1) ----------
     "enter":   0 as the element's top meets the viewport bottom, 1 a little over half a screen later.
     "through": 0 as its top meets the viewport middle, 1 as its bottom does. */
  $$('.org-tree, .feature-row').forEach(el => { if (!el.dataset.progress) el.dataset.progress = 'enter'; });
  $$('.journey-steps').forEach(el => { if (!el.dataset.progress) el.dataset.progress = 'through'; });
  const progressEls = reduce ? [] : $$('[data-progress]');
  const clamp = v => Math.max(0, Math.min(1, v));

  function updateProgress() {
    const vh = window.innerHeight;
    const atEnd = window.scrollY + vh >= root.scrollHeight - 2;
    progressEls.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) return;
      let p;
      if (el.dataset.progress === 'through') p = clamp((vh * 0.5 - r.top) / r.height);
      else p = atEnd ? 1 : clamp((vh - r.top) / (vh * 0.6));
      el.style.setProperty('--p', p.toFixed(4));
    });
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      root.classList.toggle('scrolled', window.scrollY > 40);
      updateProgress();
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
})();
