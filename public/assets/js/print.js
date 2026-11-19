/* Fingerprint hook. Hold to leave a print made of particles; it joins a wall that stays on this device.
   First visit: a gate. Return visits: the wall is already there and you can add more. */
(function () {
  var root = document.getElementById('prologue'); if (!root) return;
  var cv = document.getElementById('print-canvas'), ctx = cv.getContext('2d');
  var html = document.documentElement, gateUi = document.getElementById('gate-ui'), keyBtn = document.getElementById('gate-key'), skipBtn = document.getElementById('gate-skip');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var KEY = 'print-v1', gate = html.classList.contains('gate');
  var W = 0, H = 0, dpr = 1, wallCv = document.createElement('canvas'), wctx = wallCv.getContext('2d');
  var dust = [], wall = [], live = null, flash = null, raf = 0, last = 0, running = false;
  var INK = '#efe9dd', ACC = '#e8553a';
  window.__printReady = true;

  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  /* a fingertip: nested ridges with a drifting core, ridge breaks and a mask; outer ridges open at the base like a loop */
  function makePrint(seed) {
    var r = rng(seed), pts = [], ecc = 0.74 + r() * 0.1, loop = (r() - 0.5) * 0.6, p1 = r() * 6.28, p2 = r() * 6.28, gap = 0.05 + r() * 0.012, n = Math.floor(1 / gap);
    for (var k = 1; k <= n; k++) {
      var base = k * gap, steps = Math.max(28, Math.floor(base * 300)), on = true, tog = r() * 40 + 24;
      for (var i = 0; i <= steps; i++) {
        var th = i / steps * 6.2832;
        if (--tog <= 0) { on = !on; tog = on ? r() * 46 + 26 : r() * 3 + 1; }
        if (!on) continue;
        if (k > n * 0.52 && Math.sin(th) > 0.5) continue;
        var wob = 1 + 0.07 * Math.sin(2 * th + p1 + k * 0.33) + 0.045 * Math.sin(3 * th + p2 - k * 0.21), rr = base * wob;
        var cx = loop * base * base * 0.7, cy = -0.03 * base + base * base * 0.1 * loop;
        var x = cx + Math.cos(th) * rr * ecc, y = cy + Math.sin(th) * rr;
        if ((x * x) / (ecc * ecc * 0.96) + (y * y) / 0.98 > 1) continue;
        pts.push(x, y, k);
      }
    }
    return pts;
  }
  function size() {
    dpr = Math.min(2, devicePixelRatio || 1); var r = root.getBoundingClientRect(); W = r.width; H = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); wallCv.width = cv.width; wallCv.height = cv.height; paintWall();
    if (!dust.length) for (var i = 0; i < (W < 700 ? 70 : 140); i++) dust.push({ x: Math.random() * W, y: Math.random() * H, v: 4 + Math.random() * 10, a: Math.random() * 6.28, s: Math.random() * 1.2 + 0.4 });
  }
  /* wall */
  function load() { try { wall = JSON.parse(localStorage.getItem('prints') || '[]'); } catch (e) { wall = []; } }
  function save() { try { localStorage.setItem('prints', JSON.stringify(wall.slice(-40))); localStorage.setItem(KEY, '1'); } catch (e) {} }
  function paintWall() {
    wctx.setTransform(dpr, 0, 0, dpr, 0, 0); wctx.clearRect(0, 0, W, H);
    wall.forEach(function (w) { drawPrint(wctx, makePrint(w.seed), w.x * W, w.y * H, w.r, w.rot, 0.26); });
  }
  function drawPrint(c, pts, cx, cy, R, rot, a) {
    c.fillStyle = 'rgba(239,233,221,' + a + ')'; var cs = Math.cos(rot), sn = Math.sin(rot), s = Math.max(1, R / 70);
    for (var i = 0; i < pts.length; i += 3) { var x = pts[i] * R, y = pts[i + 1] * R; c.fillRect(cx + x * cs - y * sn, cy + x * sn + y * cs, s, s); }
  }
  function slot(R) {
    for (var t = 0; t < 40; t++) {
      var x = 0.04 + Math.random() * 0.92, y = 0.06 + Math.random() * 0.88, ok = true;
      for (var i = 0; i < wall.length; i++) { var dx = (wall[i].x - x) * W, dy = (wall[i].y - y) * H; if (dx * dx + dy * dy < R * R * 1.9) { ok = false; break; } }
      if (ok) return { x: x, y: y };
    }
    return { x: Math.random(), y: Math.random() };
  }
  /* live print */
  function begin(x, y) {
    if (live) return;
    var R = Math.min(W, H) * (W < 700 ? 0.2 : 0.17); R = Math.max(70, Math.min(150, R));
    var pts = makePrint((Math.random() * 1e9) | 0), n = pts.length / 3, ps = [];
    for (var i = 0; i < n; i++) { var a = Math.random() * 6.28, d = R * (0.9 + Math.random() * 0.7); ps.push({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, vx: 0, vy: 0, a: a, d: d }); }
    live = { x: x, y: y, R: R, rot: (Math.random() - 0.5) * 0.7, pts: pts, ps: ps, n: n, p: 0, t0: performance.now(), state: 'hold', seed: 0 };
    live.seed = 0; gateUi.classList.add('is-holding'); start();
  }
  function release() { if (live && live.state === 'hold') { live.state = 'drop'; live.t1 = performance.now(); } }
  function stamp() {
    live.state = 'stamp'; live.t1 = performance.now(); flash = { x: live.x, y: live.y, t: performance.now() };
    if (navigator.vibrate) try { navigator.vibrate(14); } catch (e) {}
    var R = 70 + Math.random() * 40, sl = slot(R); live.to = { x: sl.x * W, y: sl.y * H, R: R };
    live.from = { x: live.x, y: live.y, R: live.R }; live.seedFixed = (Math.random() * 1e9) | 0;
    /* regenerate with a seed we can persist: remap particle targets */
    live.pts = makePrint(live.seedFixed); live.n = live.pts.length / 3; while (live.ps.length < live.n) live.ps.push({ x: live.x, y: live.y, vx: 0, vy: 0, a: 0, d: 0 }); live.ps.length = live.n;
  }
  function finish() {
    var w = { seed: live.seedFixed, x: live.to.x / W, y: live.to.y / H, r: live.to.R, rot: live.rot }; wall.push(w); save(); paintWall(); live = null;
    if (gate) { gate = false; html.classList.remove('gate'); root.classList.add('is-done'); window.__printDone = performance.now(); } 
    gateUi.classList.remove('is-holding');
  }
  /* loop */
  function start() { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(loop); }
  function ease(t) { return 1 - Math.pow(1 - t, 3); }
  function loop(now) {
    var dt = Math.min(0.05, (now - last) / 1000); last = now; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    ctx.drawImage(wallCv, 0, 0, W, H);
    ctx.fillStyle = 'rgba(239,233,221,0.28)';
    for (var i = 0; i < dust.length; i++) { var d = dust[i]; d.a += dt * 0.2; d.x += Math.cos(d.a) * d.v * dt; d.y += Math.sin(d.a) * d.v * dt - d.v * 0.2 * dt; if (d.y < -4) d.y = H + 4; if (d.x < -4) d.x = W + 4; if (d.x > W + 4) d.x = -4; ctx.fillRect(d.x, d.y, d.s, d.s); }
    if (live) {
      var L = live, cs, sn;
      if (L.state === 'hold') { L.p = Math.min(1, (now - L.t0) / 1500); if (L.p >= 1) stamp(); }
      else if (L.state === 'drop') { L.p = Math.max(0, L.p - dt * 1.6); if (now - L.t1 > 700 || L.p <= 0) { live = null; gateUi.classList.remove('is-holding'); } }
      if (live) {
        var cx = L.x, cy = L.y, R = L.R;
        if (L.state === 'stamp') { var q = Math.min(1, Math.max(0, (now - L.t1 - 420) / 900)), e = ease(q); cx = L.from.x + (L.to.x - L.from.x) * e; cy = L.from.y + (L.to.y - L.from.y) * e; R = L.from.R + (L.to.R - L.from.R) * e; L.p = 1; if (q >= 1) { finish(); L = null; } }
        if (L) {
          cs = Math.cos(L.rot); sn = Math.sin(L.rot); var reveal = Math.floor(L.p * L.n), s = Math.max(1, R / 70), k = L.state === 'stamp' ? 0.2 : 0.09;
          ctx.fillStyle = L.state === 'stamp' ? 'rgba(239,233,221,0.95)' : 'rgba(239,233,221,0.9)';
          for (var j = 0; j < L.n; j++) {
            var P = L.ps[j], tx, ty;
            if (j < reveal) { var x = L.pts[j * 3] * R, y = L.pts[j * 3 + 1] * R; tx = cx + x * cs - y * sn; ty = cy + x * sn + y * cs; P.vx += (tx - P.x) * k; P.vy += (ty - P.y) * k; P.vx *= 0.8; P.vy *= 0.8; }
            else { P.a += dt * (0.6 + (j % 5) * 0.1); var dd = R * (1.05 + 0.25 * Math.sin(P.a * 2 + j)); tx = cx + Math.cos(P.a + j) * dd; ty = cy + Math.sin(P.a + j) * dd; P.vx += (tx - P.x) * 0.03; P.vy += (ty - P.y) * 0.03; P.vx *= 0.9; P.vy *= 0.9; }
            P.x += P.vx; P.y += P.vy;
            if (j < reveal) ctx.fillRect(P.x, P.y, s, s); else { ctx.globalAlpha = 0.45; ctx.fillRect(P.x, P.y, 1.2, 1.2); ctx.globalAlpha = 1; }
          }
          if (L.state === 'hold' || L.state === 'drop') { ctx.strokeStyle = ACC; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, R * 1.28, -Math.PI / 2, -Math.PI / 2 + L.p * 6.2832); ctx.stroke(); }
        }
      }
    }
    if (flash) { var ft = (now - flash.t) / 700; if (ft >= 1) flash = null; else { ctx.strokeStyle = 'rgba(232,85,58,' + (1 - ft) + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(flash.x, flash.y, 40 + ft * 220, 0, 6.2832); ctx.stroke(); } }
    if (live || flash || !reduce) raf = requestAnimationFrame(loop); else running = false;
  }
  /* input */
  function interactive(t) { return t.closest && t.closest('a,button,input,textarea,select,h1,p,ul,li,.swap-ctl,.proof,.hero-ctas'); }
  root.addEventListener('pointerdown', function (e) {
    if (e.button > 0) return; if (!gate && interactive(e.target)) return;
    var r = root.getBoundingClientRect(); begin(e.clientX - r.left, e.clientY - r.top); try { root.setPointerCapture(e.pointerId); } catch (x) {}
  });
  ['pointerup', 'pointercancel'].forEach(function (t) { root.addEventListener(t, release); });
  root.addEventListener('contextmenu', function (e) { if (gate || live) e.preventDefault(); });
  keyBtn.addEventListener('keydown', function (e) { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); begin(W / 2, H / 2); } });
  keyBtn.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') release(); });
  skipBtn.addEventListener('click', function () { try { localStorage.setItem(KEY, '1'); } catch (e) {} gate = false; html.classList.remove('gate'); root.classList.add('is-done'); window.__printDone = performance.now(); });
  addEventListener('resize', function () { size(); start(); });
  /* boot */
  load(); size();
  if (!gate) { root.classList.add('is-done'); window.__printDone = performance.now(); }
  if (gate) { root.classList.add('is-gate'); if (wall.length === 0 && !reduce) {} }
  paintWall(); start();
  new IntersectionObserver(function (en) { if (en[0].isIntersecting) start(); else running = false; }).observe(root);
})();

(function () {
  var el = document.getElementById('gate-hello'); if (!el || !document.documentElement.classList.contains('gate')) return;
  var w = ['Hello', 'Bonjour', 'Bonzour'], i = 0;
  var t = setInterval(function () {
    if (!document.documentElement.classList.contains('gate')) { clearInterval(t); return; }
    i = (i + 1) % w.length; el.textContent = w[i]; el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
  }, 1700);
})();
