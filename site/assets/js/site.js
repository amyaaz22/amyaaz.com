/* amyaaz.com — interactions. No dependencies.
   Performance: every animation loop pauses when off screen or when the tab is hidden,
   pointer handlers are batched into requestAnimationFrame, and reduced motion is respected. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  root.classList.add('js');

  function store(key, val) {
    try { if (val === undefined) return localStorage.getItem(key); localStorage.setItem(key, val); } catch (e) { return null; }
  }
  function cssVars(names) {
    var s = getComputedStyle(root), o = {};
    names.forEach(function (k) { o[k] = s.getPropertyValue('--' + k).trim(); });
    return o;
  }
  // Run fn at most once per frame
  function rafThrottle(fn) {
    var queued = false, lastArgs;
    return function () { lastArgs = arguments; if (queued) return; queued = true; requestAnimationFrame(function () { queued = false; fn.apply(null, lastArgs); }); };
  }

  /* ---------- Theme ---------- */
  var themeBtn = document.querySelector('.theme-toggle');
  function applyTheme(t) {
    root.setAttribute('data-theme', t);
    if (themeBtn) themeBtn.setAttribute('aria-label', t === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'light' ? '#f5f5f8' : '#08080c');
    document.dispatchEvent(new CustomEvent('themechange'));
  }
  applyTheme(root.getAttribute('data-theme') === 'light' ? 'light' : 'dark');
  if (themeBtn) themeBtn.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    var swap = function () { applyTheme(next); };
    if (document.startViewTransition && !reduceMotion) document.startViewTransition(swap); else swap();
    store('theme', next);
  });

  /* ---------- Nav ---------- */
  var nav = document.querySelector('.nav');
  var lastY = window.scrollY, menuOpen = false;
  var onScroll = rafThrottle(function () {
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
    nav.classList.toggle('scrolled', y > 10);
    if (!menuOpen) nav.classList.toggle('hidden', y > lastY + 2 && y > 400);
    else nav.classList.remove('hidden');
    if (y < lastY - 2) nav.classList.remove('hidden');
    nav.style.setProperty('--p', p.toFixed(4));
    nav.style.setProperty('--po', y > 40 ? 1 : 0);
    lastY = y;
  });
  if (nav) { window.addEventListener('scroll', onScroll, { passive: true }); onScroll(); }

  // Sliding pill behind the hovered / active nav link
  var navList = document.querySelector('.nav-links');
  if (navList) {
    var pill = document.createElement('span'); pill.className = 'nav-pill'; pill.setAttribute('aria-hidden', 'true'); navList.appendChild(pill);
    var movePill = function (a) {
      if (!a) { pill.style.opacity = 0; return; }
      pill.style.width = a.offsetWidth + 'px';
      pill.style.transform = 'translateX(' + a.parentNode.offsetLeft + 'px)';
      pill.style.opacity = 1;
    };
    navList.addEventListener('pointerover', function (e) { var a = e.target.closest('a'); if (a) movePill(a); });
    navList.addEventListener('pointerleave', function () { movePill(navList.querySelector('a.active')); });
    navList._movePill = movePill;
  }

  /* ---------- Mobile menu ---------- */
  var menuBtn = document.querySelector('.menu-btn');
  var menu = document.getElementById('mobile-menu');
  function setMenu(open) {
    menuOpen = open;
    menu.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) menu.removeAttribute('inert'); else menu.setAttribute('inert', '');
    if (open) nav.classList.remove('hidden');
  }
  if (menuBtn && menu) {
    menu.setAttribute('inert', '');
    menuBtn.addEventListener('click', function () { setMenu(!menuOpen); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menuOpen) { setMenu(false); menuBtn.focus(); } });
    window.addEventListener('resize', function () { if (window.innerWidth > 1080 && menuOpen) setMenu(false); });
  }

  /* ---------- Active section ---------- */
  var navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
  if (navLinks.length && 'IntersectionObserver' in window) {
    var map = {};
    navLinks.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var secObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (a) { a.classList.remove('active'); });
        var a = map[en.target.id];
        if (a) a.classList.add('active');
        if (navList && navList._movePill && !navList.matches(':hover')) navList._movePill(a);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('main section[id]').forEach(function (s) { secObs.observe(s); });
  }

  /* ---------- Reveal on scroll ---------- */
  var reveals = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); obs.unobserve(en.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { obs.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Card spotlight ---------- */
  if (finePointer) {
    document.addEventListener('pointermove', rafThrottle(function (e) {
      var card = e.target.closest && e.target.closest('.card');
      if (!card) return;
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }), { passive: true });
  }

  /* ---------- Magnetic buttons ---------- */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll('.magnetic').forEach(function (b) {
      b.addEventListener('pointermove', rafThrottle(function (e) {
        var r = b.getBoundingClientRect();
        b.style.setProperty('--bx', ((e.clientX - r.left - r.width / 2) * 0.22).toFixed(1) + 'px');
        b.style.setProperty('--by', ((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1) + 'px');
      }));
      b.addEventListener('pointerleave', function () { b.style.setProperty('--bx', '0px'); b.style.setProperty('--by', '0px'); });
    });
  }

  /* ---------- Count-up ---------- */
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length && 'IntersectionObserver' in window && !reduceMotion) {
    var cObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, end = parseInt(el.getAttribute('data-count'), 10), t0 = performance.now();
        cObs.unobserve(el);
        (function step(ts) {
          var k = Math.min(1, (ts - t0) / 1400);
          el.textContent = String(Math.round(end * (1 - Math.pow(1 - k, 3))));
          if (k < 1) requestAnimationFrame(step);
        })(t0);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { c.textContent = '0'; cObs.observe(c); });
  }

  /* ---------- Show all articles ---------- */
  var moreBtn = document.getElementById('more-articles');
  if (moreBtn) moreBtn.addEventListener('click', function () {
    document.querySelectorAll('.arow.hide').forEach(function (c) { c.classList.remove('hide'); c.classList.add('in'); });
    moreBtn.parentNode.remove();
  });

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

  /* ---------- Shared: run a canvas loop only while visible ---------- */
  function visibilityLoop(el, frame) {
    var onScreen = false, rafId = 0, last = 0;
    function tick(ts) {
      var dt = Math.min(48, ts - (last || ts)); last = ts;
      frame(dt, ts);
      rafId = (onScreen && !document.hidden) ? requestAnimationFrame(tick) : 0;
      if (!rafId) last = 0;
    }
    function start() { if (!rafId && onScreen && !document.hidden) rafId = requestAnimationFrame(tick); }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { onScreen = en[0].isIntersecting; start(); }, { rootMargin: '100px' }).observe(el);
    else { onScreen = true; start(); }
    document.addEventListener('visibilitychange', start);
    return { kick: start };
  }
  function fitCanvas(cv, ctx) {
    var r = cv.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w: r.width, h: r.height };
  }

  /* ---------- Hero: live system map (System view <-> Match view) ---------- */
  var sysCanvas = document.getElementById('system-canvas');
  if (sysCanvas) initSystem(sysCanvas);

  function initSystem(cv) {
    var ctx = cv.getContext('2d');
    var W = 0, H = 0, C = {};
    var caption = document.getElementById('system-caption');
    var defaultCaption = caption ? caption.textContent : '';
    var seg = document.getElementById('system-mode');
    // [name, systemX, systemY, matchX, matchY, position, description]
    var N = [
      ['Creator', .50, .50, .50, .50, 'CM', 'The core app: forms, workflows, portals'],
      ['Deluge', .50, .20, .46, .27, 'CM', 'Business logic that glues everything together'],
      ['CRM', .20, .28, .22, .38, 'CB', 'Customers, pipelines and Blueprints'],
      ['Books', .80, .28, .74, .20, 'RW', 'Invoices, VAT and finance automation'],
      ['Flow', .24, .66, .22, .62, 'CB', 'Orchestration across apps and services'],
      ['Catalyst', .76, .66, .46, .73, 'CM', 'Serverless functions, cache and queues'],
      ['Analytics', .50, .84, .25, .87, 'RB', 'Dashboards and reporting'],
      ['MRA API', .95, .50, .80, .50, 'ST', 'Real-time e-invoicing with the MRA'],
      ['Payments', .86, .88, .74, .80, 'LW', 'Online payments and reconciliation'],
      ['Portal', .05, .50, .06, .50, 'GK', 'Customer and staff portals'],
      ['Mobile', .12, .88, .25, .13, 'LB', 'Apps in the field, on any device']
    ];
    var E = [[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[1,5],[1,3],[2,4],[3,7],[5,8],[3,8],[4,9],[2,9],[4,10],[6,2],[6,5],[5,7],[1,2],[10,6]];
    var adj = N.map(function () { return []; });
    E.forEach(function (e, i) { adj[e[0]].push(i); adj[e[1]].push(i); });
    var mode = 0, modeT = 0, modeTarget = 0; // 0 system, 1 match
    var packets = [], spawnT = 0, ball = { from: 0, to: 1, t: 0 }, trail = [];
    var hover = -1, ptr = { x: 0, y: 0, active: false }, par = { x: 0, y: 0 };
    var pts = N.map(function () { return { x: 0, y: 0 }; });

    function colors() { C = cssVars(['accent', 'accent2', 'accent3', 'text', 'muted', 'line', 'line2', 'dim', 'bg', 'surface']); }
    function resize() { var s = fitCanvas(cv, ctx); W = s.w; H = s.h; render(0); }
    var ease = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

    function layout() {
      var padX = Math.max(34, W * .07), top = 64, bottom = 48;
      var iw = W - padX * 2, ih = H - top - bottom;
      var k = ease(modeT);
      for (var i = 0; i < N.length; i++) {
        var n = N[i], depth = i === 0 ? .4 : 1;
        var x = n[1] + (n[3] - n[1]) * k, y = n[2] + (n[4] - n[2]) * k;
        pts[i].x = padX + x * iw + par.x * depth;
        pts[i].y = top + y * ih + par.y * depth;
      }
      return { padX: padX, top: top, iw: iw, ih: ih };
    }

    function drawPitch(g, alpha) {
      if (alpha <= 0.01) return;
      ctx.save(); ctx.globalAlpha = alpha * .55; ctx.strokeStyle = C.line2; ctx.lineWidth = 1;
      var x0 = g.padX - 18, y0 = g.top - 10, w = g.iw + 36, h = g.ih + 20;
      ctx.strokeRect(x0, y0, w, h);
      ctx.beginPath(); ctx.moveTo(x0 + w / 2, y0); ctx.lineTo(x0 + w / 2, y0 + h); ctx.stroke();
      ctx.beginPath(); ctx.arc(x0 + w / 2, y0 + h / 2, Math.min(w, h) * .14, 0, Math.PI * 2); ctx.stroke();
      var bw = w * .14, bh = h * .52;
      ctx.strokeRect(x0, y0 + (h - bh) / 2, bw, bh); ctx.strokeRect(x0 + w - bw, y0 + (h - bh) / 2, bw, bh);
      ctx.restore();
    }

    function drawGrid(alpha) {
      if (alpha <= 0.01) return;
      ctx.save(); ctx.globalAlpha = alpha * .35; ctx.fillStyle = C.dim;
      for (var x = 24; x < W; x += 28) for (var y = 60; y < H - 30; y += 28) ctx.fillRect(x, y, 1, 1);
      ctx.restore();
    }

    function spawnPacket() {
      var ei = (Math.random() * E.length) | 0;
      packets.push({ e: ei, t: 0, dir: Math.random() < .5 ? 1 : -1, sp: .45 + Math.random() * .5, c: Math.random() < .7 ? 'accent' : 'accent2' });
    }

    function render(dt) {
      if (!W) return;
      // mode morph
      if (modeT !== modeTarget) {
        var step = reduceMotion ? 1 : dt / 900;
        modeT = modeTarget > modeT ? Math.min(modeTarget, modeT + step) : Math.max(modeTarget, modeT - step);
      }
      // parallax toward pointer
      var tx = ptr.active ? (ptr.x - W / 2) * -.03 : 0, ty = ptr.active ? (ptr.y - H / 2) * -.03 : 0;
      par.x += (tx - par.x) * .08; par.y += (ty - par.y) * .08;

      ctx.clearRect(0, 0, W, H);
      var g = layout(), k = ease(modeT);
      drawGrid(1 - k); drawPitch(g, k);

      // hover detection
      hover = -1;
      if (ptr.active) {
        var best = 900;
        for (var i = 0; i < pts.length; i++) { var dx = pts[i].x - ptr.x, dy = pts[i].y - ptr.y, d = dx * dx + dy * dy; if (d < best) { best = d; hover = i; } }
      }
      var hl = hover >= 0 ? adj[hover] : null;

      // edges
      for (var j = 0; j < E.length; j++) {
        var a = pts[E[j][0]], b = pts[E[j][1]], on = hl && hl.indexOf(j) >= 0;
        ctx.strokeStyle = on ? C.accent : C.line2;
        ctx.globalAlpha = hl ? (on ? .95 : .25) : (k > .5 ? .45 : .8);
        ctx.lineWidth = on ? 1.4 : 1;
        if (k > .5) ctx.setLineDash([3, 5]); else ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      ctx.setLineDash([]); ctx.globalAlpha = 1;

      // system packets
      var pAlpha = 1 - k;
      if (pAlpha > .01 && !reduceMotion) {
        spawnT += dt;
        if (spawnT > 220 && packets.length < 16) { spawnT = 0; spawnPacket(); }
        for (var p = packets.length - 1; p >= 0; p--) {
          var pk = packets[p], e = E[pk.e];
          pk.t += dt / 1000 * pk.sp;
          if (pk.t >= 1) { packets.splice(p, 1); continue; }
          var s = pts[pk.dir > 0 ? e[0] : e[1]], d2 = pts[pk.dir > 0 ? e[1] : e[0]];
          var px = s.x + (d2.x - s.x) * pk.t, py = s.y + (d2.y - s.y) * pk.t;
          var bright = !hl || hl.indexOf(pk.e) >= 0;
          ctx.globalAlpha = pAlpha * (bright ? 1 : .2);
          ctx.fillStyle = C[pk.c];
          ctx.beginPath(); ctx.arc(px, py, 2.2, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = pAlpha * (bright ? .25 : .05);
          ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      // nodes
      for (var n = 0; n < N.length; n++) {
        var pt = pts[n], isHub = n === 0, isHover = n === hover, linked = hl && E.some(function (ed, ei) { return hl.indexOf(ei) >= 0 && (ed[0] === n || ed[1] === n); });
        var r = isHub ? 8 : 5.5;
        ctx.globalAlpha = hl && !linked && !isHover ? .35 : 1;
        if (isHub || isHover) { ctx.fillStyle = C.accent; ctx.globalAlpha *= .14; ctx.beginPath(); ctx.arc(pt.x, pt.y, r + 10, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = hl && !linked && !isHover ? .35 : 1; }
        ctx.fillStyle = C.bg; ctx.strokeStyle = isHover || isHub ? C.accent : (k > .5 ? C.accent2 : C.text);
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        if (isHub || isHover) { ctx.fillStyle = C.accent; ctx.beginPath(); ctx.arc(pt.x, pt.y, r * .45, 0, Math.PI * 2); ctx.fill(); }
        ctx.font = (isHover ? '700 ' : '400 ') + '10px "Space Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = isHover ? C.text : C.muted;
        var label = k > .5 ? N[n][5] + ' · ' + N[n][0] : N[n][0];
        ctx.fillText(label.toUpperCase(), pt.x, pt.y + r + 15);
      }
      ctx.globalAlpha = 1;

      // match ball: passes between connected players
      if (k > .01) {
        if (!reduceMotion) ball.t += dt / 700;
        if (ball.t >= 1) {
          ball.from = ball.to; ball.t = 0;
          var opts = adj[ball.from].map(function (ei) { return E[ei][0] === ball.from ? E[ei][1] : E[ei][0]; }).filter(function (x) { return x !== 9 || Math.random() < .2; });
          ball.to = opts[(Math.random() * opts.length) | 0];
        }
        var f = pts[ball.from], to = pts[ball.to], bt = ease(Math.min(1, ball.t));
        var bx = f.x + (to.x - f.x) * bt, by = f.y + (to.y - f.y) * bt - Math.sin(bt * Math.PI) * 10;
        trail.push({ x: bx, y: by }); if (trail.length > 10) trail.shift();
        ctx.globalAlpha = k;
        for (var q = 0; q < trail.length; q++) { ctx.fillStyle = C.accent; ctx.globalAlpha = k * q / trail.length * .35; ctx.beginPath(); ctx.arc(trail[q].x, trail[q].y, 2, 0, Math.PI * 2); ctx.fill(); }
        ctx.globalAlpha = k;
        ctx.fillStyle = '#f4f4f8'; ctx.strokeStyle = '#1a1a22'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(bx, by, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.globalAlpha = 1;
      }

      if (caption) {
        var text = hover >= 0 ? N[hover][0] + ' — ' + N[hover][6] : (k > .5 ? 'Same shape, different game: every player connected' : defaultCaption);
        if (caption.textContent !== text) caption.textContent = text;
      }
    }

    var loop = visibilityLoop(cv, function (dt) { render(dt); });
    function setMode(m) {
      modeTarget = m === 'match' ? 1 : 0;
      seg.setAttribute('data-mode', m);
      seg.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-mode') === m)); });
      if (reduceMotion) { modeT = modeTarget; render(0); }
      if (window.gtag) window.gtag('event', 'system_view', { mode: m });
    }
    seg.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) setMode(b.getAttribute('data-mode')); });
    cv.addEventListener('pointermove', function (e) { var r = cv.getBoundingClientRect(); ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top; ptr.active = true; if (reduceMotion) render(0); });
    cv.addEventListener('pointerleave', function () { ptr.active = false; if (reduceMotion) render(0); });
    document.addEventListener('themechange', function () { colors(); render(0); });
    colors();
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(cv); else window.addEventListener('resize', resize);
    resize();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { render(0); });
  }

  /* ---------- Penalty mini-game ---------- */
  var pitch = document.getElementById('pitch');
  if (pitch) initGame(pitch);

  function initGame(cv) {
    var ctx = cv.getContext('2d');
    var W = 0, H = 0, C = {};
    var scoreEl = document.getElementById('score'), shotsEl = document.getElementById('shots'), bestEl = document.getElementById('best');
    var goals = 0, shots = 0, streak = 0, best = parseInt(store('pk-best') || '0', 10) || 0;
    bestEl.textContent = best;
    var aim = { x: 0.5, y: 0.3 }, hovering = false;
    var keeper = { x: 0.5, target: 0.5, w: 0.13, t: 0 };
    var ball = null, msg = null;

    function colors() { C = cssVars(['accent', 'accent2', 'accent3', 'text', 'muted', 'line2', 'dim']); }
    function resize() { var s = fitCanvas(cv, ctx); W = s.w; H = s.h; draw(); }
    function goal() { var gw = Math.min(W * 0.64, 440), gh = H * 0.32; return { x: (W - gw) / 2, y: H * 0.12, w: gw, h: gh }; }
    function spot() { return { x: W / 2, y: H * 0.86 }; }

    function shoot() {
      if (ball) return;
      var g = goal(), s = spot();
      var tx = aim.x * W, ty = aim.y * H;
      shots++; shotsEl.textContent = shots;
      var aimRel = (tx - g.x) / g.w;
      keeper.target = Math.max(0.08, Math.min(0.92, Math.random() < 0.55 ? aimRel : Math.random()));
      ball = { sx: s.x, sy: s.y, tx: tx, ty: ty, t: 0, dur: reduceMotion ? 200 : 620, curve: (Math.random() - 0.5) * 60 };
      loop.kick();
    }
    function resolve() {
      var g = goal(), tx = ball.tx, ty = ball.ty;
      var inside = tx > g.x + 4 && tx < g.x + g.w - 4 && ty > g.y + 4 && ty < g.y + g.h;
      var kx = g.x + keeper.x * g.w, kw = keeper.w * g.w * 1.6;
      var saved = inside && Math.abs(tx - kx) < kw / 2 && ty > g.y + g.h * 0.15;
      if (!inside) { msg = { text: ty <= g.y + 4 ? 'Over the bar' : 'Wide', color: C.muted, t: 0 }; streak = 0; }
      else if (saved) { msg = { text: 'Saved', color: C.accent3, t: 0 }; streak = 0; }
      else {
        goals++; streak++; scoreEl.textContent = goals;
        if (streak > best) { best = streak; bestEl.textContent = best; store('pk-best', String(best)); }
        msg = { text: streak > 2 ? 'Goal · ' + streak + ' in a row' : 'Goal', color: C.accent, t: 0 };
        if (window.gtag) window.gtag('event', 'penalty_goal', { streak: streak });
      }
      setTimeout(function () { ball = null; keeper.target = 0.5; }, reduceMotion ? 300 : 850);
    }
    function frame(dt) {
      keeper.t += dt / 1000;
      if (!ball) keeper.target = 0.5 + Math.sin(keeper.t * 1.6) * 0.22;
      keeper.x += (keeper.target - keeper.x) * Math.min(1, dt / (ball ? 110 : 220));
      if (ball) { ball.t += dt; if (ball.t >= ball.dur && !ball.done) { ball.done = true; resolve(); } }
      if (msg) { msg.t += dt; if (msg.t > 1500) msg = null; }
      draw();
    }
    function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
    function drawBall(x, y, r, rot) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fillStyle = '#f4f4f8'; ctx.fill();
      ctx.lineWidth = Math.max(1, r * 0.08); ctx.strokeStyle = '#1a1a22'; ctx.stroke();
      ctx.fillStyle = '#1a1a22'; ctx.beginPath();
      for (var i = 0; i < 5; i++) { var a = -Math.PI / 2 + i * 2 * Math.PI / 5; ctx.lineTo(Math.cos(a) * r * 0.38, Math.sin(a) * r * 0.38); }
      ctx.closePath(); ctx.fill(); ctx.restore();
    }
    function draw() {
      if (!W) return;
      var g = goal(), s = spot(), by = g.y + g.h;
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = C.line2; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, by); ctx.lineTo(W, by); ctx.stroke();
      var bw = Math.min(W * 0.9, 640); ctx.strokeRect((W - bw) / 2, by, bw, H * 0.55);
      var sw = g.w * 1.25; ctx.strokeRect((W - sw) / 2, by, sw, H * 0.2);
      ctx.beginPath(); ctx.arc(s.x, s.y, 2.5, 0, Math.PI * 2); ctx.fillStyle = C.muted; ctx.fill();
      ctx.save(); ctx.globalAlpha = 0.3; ctx.strokeStyle = C.dim;
      for (var nx = g.x; nx <= g.x + g.w; nx += 14) { ctx.beginPath(); ctx.moveTo(nx, g.y); ctx.lineTo(nx, by); ctx.stroke(); }
      for (var ny = g.y; ny <= by; ny += 14) { ctx.beginPath(); ctx.moveTo(g.x, ny); ctx.lineTo(g.x + g.w, ny); ctx.stroke(); }
      ctx.restore();
      ctx.strokeStyle = C.text; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(g.x, by); ctx.lineTo(g.x, g.y); ctx.lineTo(g.x + g.w, g.y); ctx.lineTo(g.x + g.w, by); ctx.stroke();
      var kw = keeper.w * g.w, kh = g.h * 0.78, kx = g.x + keeper.x * g.w - kw / 2, ky = by - kh;
      ctx.fillStyle = C.accent2; ctx.globalAlpha = 0.9;
      rr(kx, ky + kh * 0.22, kw, kh * 0.78, 6); ctx.fill();
      ctx.beginPath(); ctx.arc(kx + kw / 2, ky + kh * 0.11, kh * 0.11, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = 5; ctx.strokeStyle = C.accent2;
      var lean = (keeper.target - keeper.x) * 60;
      ctx.beginPath(); ctx.moveTo(kx + 2, ky + kh * 0.32); ctx.lineTo(kx - kw * 0.35, ky + kh * 0.1 - lean * 0.2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(kx + kw - 2, ky + kh * 0.32); ctx.lineTo(kx + kw * 1.35, ky + kh * 0.1 + lean * 0.2); ctx.stroke();
      ctx.globalAlpha = 1;
      if (!ball && (hovering || document.activeElement === cv)) {
        var ax = aim.x * W, ay = aim.y * H;
        ctx.strokeStyle = C.accent; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(ax, ay, 12, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ax - 18, ay); ctx.lineTo(ax - 6, ay); ctx.moveTo(ax + 6, ay); ctx.lineTo(ax + 18, ay); ctx.moveTo(ax, ay - 18); ctx.lineTo(ax, ay - 6); ctx.moveTo(ax, ay + 6); ctx.lineTo(ax, ay + 18); ctx.stroke();
        ctx.save(); ctx.setLineDash([3, 6]); ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(ax, ay); ctx.stroke(); ctx.restore();
      }
      var r0 = Math.max(9, Math.min(13, W * 0.022));
      if (ball) {
        var k = Math.min(1, ball.t / ball.dur), e = 1 - Math.pow(1 - k, 2.2);
        var mx = (ball.sx + ball.tx) / 2 + ball.curve, my = Math.min(ball.sy, ball.ty) - 20;
        var bx = (1 - e) * (1 - e) * ball.sx + 2 * (1 - e) * e * mx + e * e * ball.tx;
        var byy = (1 - e) * (1 - e) * ball.sy + 2 * (1 - e) * e * my + e * e * ball.ty;
        drawBall(bx, byy, r0 * (1 - e * 0.45), e * 9);
      } else drawBall(s.x, s.y - r0, r0, 0);
      ctx.textAlign = 'center';
      if (msg) {
        var a = msg.t < 200 ? msg.t / 200 : Math.max(0, 1 - (msg.t - 1000) / 500);
        ctx.globalAlpha = a; ctx.fillStyle = msg.color;
        ctx.font = '400 ' + Math.round(Math.min(44, W * 0.075)) + 'px "DM Serif Display", Georgia, serif';
        ctx.fillText(msg.text, W / 2, H * 0.66); ctx.globalAlpha = 1;
      } else if (!ball && shots === 0) {
        ctx.fillStyle = C.muted; ctx.font = '11px "Space Mono", monospace';
        ctx.fillText(finePointer ? 'AIM AND CLICK TO SHOOT' : 'TAP THE GOAL TO SHOOT', W / 2, H * 0.66);
      }
    }
    function setAim(e) { var r = cv.getBoundingClientRect(); aim.x = Math.max(0.02, Math.min(0.98, (e.clientX - r.left) / r.width)); aim.y = Math.max(0.03, Math.min(0.7, (e.clientY - r.top) / r.height)); }
    cv.addEventListener('pointermove', function (e) { hovering = true; setAim(e); });
    cv.addEventListener('pointerleave', function () { hovering = false; draw(); });
    cv.addEventListener('pointerdown', function (e) { setAim(e); shoot(); });
    cv.addEventListener('keydown', function (e) {
      var st = 0.04;
      if (e.key === 'ArrowLeft') aim.x = Math.max(0.02, aim.x - st);
      else if (e.key === 'ArrowRight') aim.x = Math.min(0.98, aim.x + st);
      else if (e.key === 'ArrowUp') aim.y = Math.max(0.03, aim.y - st);
      else if (e.key === 'ArrowDown') aim.y = Math.min(0.7, aim.y + st);
      else if (e.key === ' ' || e.key === 'Enter') shoot();
      else return;
      e.preventDefault(); draw();
    });
    var resetBtn = document.getElementById('pk-reset');
    if (resetBtn) resetBtn.addEventListener('click', function () { goals = shots = streak = 0; scoreEl.textContent = 0; shotsEl.textContent = 0; msg = null; draw(); });
    document.addEventListener('themechange', function () { colors(); draw(); });
    colors();
    var loop = visibilityLoop(cv, frame);
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(cv); else window.addEventListener('resize', resize);
    resize();
  }
})();
