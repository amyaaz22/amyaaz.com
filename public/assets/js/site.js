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

  /* ---------- Penalty game ---------- */
  var canvas = document.getElementById('pitch');
  if (canvas) initGame(canvas);

  function initGame(cv) {
    var ctx = cv.getContext('2d');
    var W = 0, H = 0, dpr = 1, colors = {};
    var scoreEl = document.getElementById('score'), shotsEl = document.getElementById('shots'), bestEl = document.getElementById('best');
    var goals = 0, shots = 0, streak = 0, best = parseInt(store('pk-best') || '0', 10) || 0;
    bestEl.textContent = best;
    var aim = { x: 0.5, y: 0.3 }, hovering = false;
    var keeper = { x: 0.5, target: 0.5, w: 0.13, t: 0 };
    var ball = null, msg = null, running = false, visible = false, last = 0;

    function readColors() {
      var s = getComputedStyle(root);
      ['--accent', '--accent2', '--accent3', '--text', '--muted', '--border', '--surface', '--bg', '--dim'].forEach(function (k) { colors[k] = s.getPropertyValue(k).trim(); });
    }
    function resize() {
      var r = cv.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }
    // Goal geometry in canvas pixels
    function goal() { var gw = Math.min(W * 0.64, 460), gh = H * 0.32; return { x: (W - gw) / 2, y: H * 0.12, w: gw, h: gh }; }
    function spot() { return { x: W / 2, y: H * 0.86 }; }

    function shoot() {
      if (ball) return;
      var g = goal(), s = spot();
      var tx = aim.x * W, ty = aim.y * H;
      shots++; shotsEl.textContent = shots;
      // Keeper guesses: reads the shot 60% of the time, otherwise commits to a random side
      var aimRel = (tx - g.x) / g.w;
      var guess = Math.random() < 0.6 ? aimRel : Math.random();
      keeper.target = Math.max(0.08, Math.min(0.92, guess));
      ball = { sx: s.x, sy: s.y, tx: tx, ty: ty, t: 0, dur: reduceMotion ? 250 : 650, curve: (Math.random() - 0.5) * 60 };
      running = true; loop(performance.now());
    }
    function resolve() {
      var g = goal(), tx = ball.tx, ty = ball.ty;
      var inside = tx > g.x + 4 && tx < g.x + g.w - 4 && ty > g.y + 4 && ty < g.y + g.h;
      var kx = g.x + keeper.x * g.w, kw = keeper.w * g.w * 1.6;
      var saved = inside && Math.abs(tx - kx) < kw / 2 && ty > g.y + g.h * 0.15;
      if (!inside) { msg = { text: ty <= g.y + 4 ? 'OVER THE BAR' : 'WIDE', color: colors['--muted'], t: 0 }; streak = 0; }
      else if (saved) { msg = { text: 'SAVED', color: colors['--accent3'], t: 0 }; streak = 0; }
      else {
        goals++; streak++; scoreEl.textContent = goals;
        if (streak > best) { best = streak; bestEl.textContent = best; store('pk-best', String(best)); }
        msg = { text: streak > 2 ? 'GOAL · ' + streak + ' IN A ROW' : 'GOAL', color: colors['--accent'], t: 0 };
        if (window.gtag) window.gtag('event', 'penalty_goal', { streak: streak });
      }
      setTimeout(function () { ball = null; keeper.target = 0.5; }, reduceMotion ? 300 : 900);
    }

    function loop(ts) {
      var dt = Math.min(50, ts - (last || ts)); last = ts;
      keeper.t += dt / 1000;
      if (!ball) keeper.target = 0.5 + Math.sin(keeper.t * 1.6) * 0.22;
      keeper.x += (keeper.target - keeper.x) * Math.min(1, dt / (ball ? 110 : 220));
      if (ball) {
        ball.t += dt;
        if (ball.t >= ball.dur && !ball.done) { ball.done = true; resolve(); }
      }
      if (msg) { msg.t += dt; if (msg.t > 1600) msg = null; }
      draw();
      if (visible || ball) requestAnimationFrame(loop); else { running = false; last = 0; }
    }

    function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

    function drawBall(x, y, r, rot) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fillStyle = '#f4f4f8'; ctx.fill();
      ctx.lineWidth = Math.max(1, r * 0.08); ctx.strokeStyle = '#1a1a22'; ctx.stroke();
      ctx.fillStyle = '#1a1a22';
      ctx.beginPath();
      for (var i = 0; i < 5; i++) { var a = -Math.PI / 2 + i * 2 * Math.PI / 5; ctx.lineTo(Math.cos(a) * r * 0.38, Math.sin(a) * r * 0.38); }
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }

    function draw() {
      if (!W) return;
      var g = goal(), s = spot();
      ctx.clearRect(0, 0, W, H);
      // pitch lines
      ctx.strokeStyle = colors['--border']; ctx.lineWidth = 1;
      var by = g.y + g.h;
      ctx.beginPath(); ctx.moveTo(0, by); ctx.lineTo(W, by); ctx.stroke();
      var bw = Math.min(W * 0.9, 680);
      ctx.strokeRect((W - bw) / 2, by, bw, H * 0.55);
      var sw = g.w * 1.25; ctx.strokeRect((W - sw) / 2, by, sw, H * 0.2);
      ctx.beginPath(); ctx.arc(s.x, s.y, 2.5, 0, Math.PI * 2); ctx.fillStyle = colors['--muted']; ctx.fill();
      // net
      ctx.save(); ctx.globalAlpha = 0.35; ctx.strokeStyle = colors['--dim'];
      for (var nx = g.x; nx <= g.x + g.w; nx += 14) { ctx.beginPath(); ctx.moveTo(nx, g.y); ctx.lineTo(nx, by); ctx.stroke(); }
      for (var ny = g.y; ny <= by; ny += 14) { ctx.beginPath(); ctx.moveTo(g.x, ny); ctx.lineTo(g.x + g.w, ny); ctx.stroke(); }
      ctx.restore();
      // goal frame
      ctx.strokeStyle = colors['--text']; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(g.x, by); ctx.lineTo(g.x, g.y); ctx.lineTo(g.x + g.w, g.y); ctx.lineTo(g.x + g.w, by); ctx.stroke();
      // keeper
      var kw = keeper.w * g.w, kh = g.h * 0.78, kx = g.x + keeper.x * g.w - kw / 2, ky = by - kh;
      ctx.fillStyle = colors['--accent2']; ctx.globalAlpha = 0.9;
      roundRect(kx, ky + kh * 0.22, kw, kh * 0.78, 6); ctx.fill();
      ctx.beginPath(); ctx.arc(kx + kw / 2, ky + kh * 0.11, kh * 0.11, 0, Math.PI * 2); ctx.fill();
      // arms
      ctx.lineWidth = 5; ctx.strokeStyle = colors['--accent2']; ctx.lineCap = 'round';
      var lean = (keeper.target - keeper.x) * 60;
      ctx.beginPath(); ctx.moveTo(kx + 2, ky + kh * 0.32); ctx.lineTo(kx - kw * 0.35, ky + kh * 0.1 - lean * 0.2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(kx + kw - 2, ky + kh * 0.32); ctx.lineTo(kx + kw * 1.35, ky + kh * 0.1 + lean * 0.2); ctx.stroke();
      ctx.globalAlpha = 1;
      // aim reticle
      if (!ball && (hovering || document.activeElement === cv)) {
        var ax = aim.x * W, ay = aim.y * H;
        ctx.strokeStyle = colors['--accent']; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(ax, ay, 12, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ax - 18, ay); ctx.lineTo(ax - 6, ay); ctx.moveTo(ax + 6, ay); ctx.lineTo(ax + 18, ay); ctx.moveTo(ax, ay - 18); ctx.lineTo(ax, ay - 6); ctx.moveTo(ax, ay + 6); ctx.lineTo(ax, ay + 18); ctx.stroke();
        ctx.save(); ctx.setLineDash([3, 6]); ctx.globalAlpha = 0.5;
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(ax, ay); ctx.stroke(); ctx.restore();
      }
      // ball
      var r0 = Math.max(9, Math.min(14, W * 0.022));
      if (ball) {
        var k = Math.min(1, ball.t / ball.dur), e = 1 - Math.pow(1 - k, 2.2);
        var mx = (ball.sx + ball.tx) / 2 + ball.curve, my = Math.min(ball.sy, ball.ty) - 20;
        var bx = (1 - e) * (1 - e) * ball.sx + 2 * (1 - e) * e * mx + e * e * ball.tx;
        var byy = (1 - e) * (1 - e) * ball.sy + 2 * (1 - e) * e * my + e * e * ball.ty;
        ctx.save(); ctx.globalAlpha = 0.25; ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.ellipse(bx, byy + r0, r0 * (1 - e * 0.45), r0 * 0.3, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        drawBall(bx, byy, r0 * (1 - e * 0.45), e * 9);
      } else {
        drawBall(s.x, s.y - r0, r0, 0);
      }
      // message
      if (msg) {
        var a = msg.t < 200 ? msg.t / 200 : Math.max(0, 1 - (msg.t - 1100) / 500);
        ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = msg.color; ctx.textAlign = 'center';
        ctx.font = '400 ' + Math.round(Math.min(46, W * 0.075)) + 'px "DM Serif Display", Georgia, serif';
        ctx.fillText(msg.text, W / 2, H * 0.66 - (msg.t < 200 ? (1 - a) * 12 : 0));
        ctx.restore();
      } else if (!ball && shots === 0) {
        ctx.fillStyle = colors['--muted']; ctx.textAlign = 'center';
        ctx.font = '12px "Space Mono", monospace';
        ctx.fillText(finePointer ? 'AIM AND CLICK TO SHOOT' : 'TAP THE GOAL TO SHOOT', W / 2, H * 0.66);
      }
    }

    function setAim(e) {
      var r = cv.getBoundingClientRect();
      aim.x = Math.max(0.02, Math.min(0.98, (e.clientX - r.left) / r.width));
      aim.y = Math.max(0.03, Math.min(0.7, (e.clientY - r.top) / r.height));
    }
    cv.addEventListener('pointermove', function (e) { hovering = true; setAim(e); if (!running) draw(); });
    cv.addEventListener('pointerleave', function () { hovering = false; if (!running) draw(); });
    cv.addEventListener('pointerdown', function (e) { setAim(e); shoot(); });
    cv.addEventListener('keydown', function (e) {
      var step = 0.04;
      if (e.key === 'ArrowLeft') aim.x = Math.max(0.02, aim.x - step);
      else if (e.key === 'ArrowRight') aim.x = Math.min(0.98, aim.x + step);
      else if (e.key === 'ArrowUp') aim.y = Math.max(0.03, aim.y - step);
      else if (e.key === 'ArrowDown') aim.y = Math.min(0.7, aim.y + step);
      else if (e.key === ' ' || e.key === 'Enter') { shoot(); }
      else return;
      e.preventDefault(); if (!running) draw();
    });
    cv.addEventListener('focus', function () { if (!running) draw(); });
    var resetBtn = document.getElementById('pk-reset');
    if (resetBtn) resetBtn.addEventListener('click', function () { goals = shots = streak = 0; scoreEl.textContent = 0; shotsEl.textContent = 0; msg = null; draw(); });

    document.addEventListener('themechange', function () { readColors(); draw(); });
    readColors();
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(cv); else window.addEventListener('resize', resize);
    resize();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        visible = en[0].isIntersecting;
        if (visible && !running && !reduceMotion) { running = true; loop(performance.now()); }
      }).observe(cv);
    }
  }
})();
