/* amyaaz.com — interactions shared by every page. No dependencies. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  root.classList.add('js');

  function store(key, val) {
    try { if (val === undefined) return localStorage.getItem(key); localStorage.setItem(key, val); } catch (e) { return null; }
  }

  /* ---------- Theme ---------- */
  var themeBtn = document.querySelector('.theme-toggle');
  function applyTheme(t) {
    root.setAttribute('data-theme', t);
    if (themeBtn) themeBtn.setAttribute('aria-label', t === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'light' ? '#f6f6f9' : '#0a0a0f');
    document.dispatchEvent(new CustomEvent('themechange'));
  }
  applyTheme(root.getAttribute('data-theme') === 'light' ? 'light' : 'dark');
  if (themeBtn) themeBtn.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    var swap = function () { applyTheme(next); };
    if (document.startViewTransition && !reduceMotion) document.startViewTransition(swap); else swap();
    store('theme', next);
  });

  /* ---------- Nav: background, hide on scroll down, progress ball ---------- */
  var nav = document.querySelector('.nav');
  var lastY = window.scrollY, ticking = false;
  var menuOpen = false;
  function onScroll() {
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
    if (nav) {
      nav.classList.toggle('scrolled', y > 10);
      if (!menuOpen) nav.classList.toggle('hidden', y > lastY && y > 300);
      nav.style.setProperty('--p', p.toFixed(4));
      nav.style.setProperty('--po', y > 40 ? 1 : 0);
    }
    lastY = y; ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  var menuBtn = document.querySelector('.menu-btn');
  var menu = document.getElementById('mobile-menu');
  function setMenu(open) {
    menuOpen = open;
    menu.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) { nav.classList.remove('hidden'); menu.removeAttribute('inert'); } else { menu.setAttribute('inert', ''); }
  }
  if (menuBtn && menu) {
    menu.setAttribute('inert', '');
    menuBtn.addEventListener('click', function () { setMenu(!menuOpen); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menuOpen) { setMenu(false); menuBtn.focus(); } });
    window.addEventListener('resize', function () { if (window.innerWidth > 1080 && menuOpen) setMenu(false); });
  }

  /* ---------- Active section in nav ---------- */
  var navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
  if (navLinks.length && 'IntersectionObserver' in window) {
    var map = {};
    navLinks.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var secObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && map[en.target.id]) {
          navLinks.forEach(function (a) { a.classList.remove('active'); });
          map[en.target.id].classList.add('active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) secObs.observe(s); });
  }

  /* ---------- Reveal on scroll ---------- */
  var reveals = document.querySelectorAll('[data-reveal], .plan');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); obs.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { obs.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Card spotlight ---------- */
  document.querySelectorAll('.card').forEach(function (card) {
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ---------- Portrait tilt ---------- */
  var portrait = document.querySelector('.portrait');
  if (portrait && finePointer && !reduceMotion) {
    var pc = portrait.querySelector('.portrait-card');
    portrait.addEventListener('pointermove', function (e) {
      var r = portrait.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      pc.style.setProperty('--ry', ((x - 0.5) * 10).toFixed(2) + 'deg');
      pc.style.setProperty('--rx', ((0.5 - y) * 10).toFixed(2) + 'deg');
      pc.style.setProperty('--gx', (x * 100).toFixed(1) + '%');
      pc.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
    });
    portrait.addEventListener('pointerleave', function () { pc.style.setProperty('--rx', '0deg'); pc.style.setProperty('--ry', '0deg'); });
  }

  /* ---------- Magnetic buttons ---------- */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll('.magnetic').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.setProperty('--bx', ((e.clientX - r.left - r.width / 2) * 0.25).toFixed(1) + 'px');
        b.style.setProperty('--by', ((e.clientY - r.top - r.height / 2) * 0.35).toFixed(1) + 'px');
      });
      b.addEventListener('pointerleave', function () { b.style.setProperty('--bx', '0px'); b.style.setProperty('--by', '0px'); });
    });
  }

  /* ---------- Count-up stats ---------- */
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length && 'IntersectionObserver' in window && !reduceMotion) {
    var cObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, end = parseInt(el.getAttribute('data-count'), 10), t0 = null;
        cObs.unobserve(el);
        (function step(ts) {
          if (!t0) t0 = ts;
          var k = Math.min(1, (ts - t0) / 1400);
          el.firstChild.nodeValue = String(Math.round(end * (1 - Math.pow(1 - k, 3))));
          if (k < 1) requestAnimationFrame(step);
        })(performance.now());
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { c.firstChild.nodeValue = '0'; cObs.observe(c); });
  }

  /* ---------- Show all articles ---------- */
  var moreBtn = document.getElementById('more-articles');
  if (moreBtn) moreBtn.addEventListener('click', function () {
    document.querySelectorAll('.article-card.hide').forEach(function (c) { c.classList.remove('hide'); c.classList.add('in'); });
    moreBtn.parentNode.remove();
  });

  /* ---------- Custom cursor ---------- */
  if (finePointer && !reduceMotion) {
    var cur = document.getElementById('cursor'), ring = document.getElementById('cursor-ring');
    if (cur && ring) {
      document.body.classList.add('has-cursor');
      var mx = -100, my = -100, rx = -100, ry = -100;
      document.addEventListener('pointermove', function (e) {
        mx = e.clientX; my = e.clientY;
        cur.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
      }, { passive: true });
      (function loop() {
        rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
        ring.style.transform = 'translate(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px)';
        requestAnimationFrame(loop);
      })();
      document.addEventListener('pointerover', function (e) {
        var t = e.target;
        document.body.classList.toggle('cursor-hover', !!t.closest('a, button, .card, summary'));
        document.body.classList.toggle('cursor-text', !!t.closest('input, textarea'));
        document.body.classList.toggle('cursor-game', !!t.closest('canvas'));
      });
      document.addEventListener('pointerleave', function () { mx = my = -100; });
    }
  }

  /* ---------- Contact form (Netlify Forms) ---------- */
  var form = document.getElementById('contact-form');
  if (form) {
    var statusEl = document.getElementById('form-status');
    var okMsg = 'Thanks — your message is in. I will get back to you shortly.';
    if (new URLSearchParams(location.search).get('sent') === '1') { statusEl.textContent = okMsg; statusEl.className = 'form-status ok'; }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      btn.disabled = true; statusEl.className = 'form-status'; statusEl.textContent = 'Sending…';
      fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(new FormData(form)).toString() })
        .then(function (res) {
          if (!res.ok) throw new Error(res.status);
          form.reset(); statusEl.textContent = okMsg; statusEl.className = 'form-status ok';
          if (window.gtag) window.gtag('event', 'generate_lead', { method: 'contact_form' });
        })
        .catch(function () { statusEl.textContent = 'Something went wrong. Please email aumeeramyaaz@gmail.com directly.'; statusEl.className = 'form-status err'; })
        .then(function () { btn.disabled = false; });
    });
  }

})();
