/* Blueprint builder: tap systems, watch them connect, send the blueprint. Canvas 2D, touch + mouse. */
(function () {
  var stage = document.getElementById('bld-stage'); if (!stage) return;
  var cv = document.getElementById('bld-canvas'), ctx = cv.getContext('2d');
  var tray = document.getElementById('bld-tray'), sysEl = document.getElementById('bld-sys'), linkEl = document.getElementById('bld-links');
  var hint = document.getElementById('bld-hint');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var APPS = [
    { id: 'creator', n: 'Creator', t: 'a custom Zoho Creator application', link: ['books', 'crm', 'catalyst', 'mra', 'portal'] },
    { id: 'books', n: 'Books', t: 'Zoho Books', link: ['crm', 'mra', 'creator'] },
    { id: 'crm', n: 'CRM', t: 'Zoho CRM', link: ['books', 'desk', 'creator', 'portal'] },
    { id: 'flow', n: 'Flow', t: 'Zoho Flow automations', link: ['*'] },
    { id: 'catalyst', n: 'Catalyst', t: 'a Catalyst backend', link: ['creator'] },
    { id: 'desk', n: 'Desk', t: 'Zoho Desk', link: ['crm'] },
    { id: 'mra', n: 'MRA e-invoice', t: 'MRA e-invoicing', link: ['books', 'creator'] },
    { id: 'portal', n: 'Client portal', t: 'a customer portal', link: ['creator', 'crm'] }
  ];
  var byId = {}; APPS.forEach(function (a) { byId[a.id] = a; });
  var nodes = [], edges = [], parts = [], W = 0, H = 0, dpr = 1, running = false, t0 = performance.now(), last = t0, drag = null, ptr = { x: -999, y: -999, on: false };
  var C = {}; var grav = { x: 0, y: 0, tx: 0, ty: 0 };
  function colors() {
    var cs = getComputedStyle(document.documentElement);
    C.bg = cs.getPropertyValue('--bg').trim(); C.text = cs.getPropertyValue('--text').trim(); C.acc = cs.getPropertyValue('--accent').trim();
    C.brass = cs.getPropertyValue('--accent2').trim(); C.muted = cs.getPropertyValue('--muted').trim();
  }
  function rgba(hex, a) { hex = hex.replace('#', ''); if (hex.length === 3) hex = hex.replace(/(.)/g, '$1$1'); var n = parseInt(hex, 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; }
  function size() {
    dpr = Math.min(2, window.devicePixelRatio || 1); var r = stage.getBoundingClientRect(); W = r.width; H = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function hub() { return nodes[0]; }
  function addNode(id, x, y, silent) {
    if (nodes.some(function (n) { return n.id === id; })) return;
    var h = hub(), a = byId[id] || { n: 'Your business', link: [] };
    var ang = Math.random() * 6.283, d = Math.min(W, H) * 0.2;
    var nd = { id: id, label: a.n, x: x != null ? x : (h ? h.x + Math.cos(ang) * d * 0.3 : W / 2), y: y != null ? y : (h ? h.y + Math.sin(ang) * d * 0.3 : H / 2), vx: 0, vy: 0, r: id === 'hub' ? 34 : 26, pop: 0, born: performance.now() };
    nodes.push(nd);
    if (id !== 'hub') {
      edges.push({ a: h, b: nd, hub: true, k: 7 }); seed(edges[edges.length - 1]);
      nodes.forEach(function (o) {
        if (o === nd || o.id === 'hub') return;
        var ok = a.link.indexOf('*') > -1 || a.link.indexOf(o.id) > -1 || (byId[o.id] && (byId[o.id].link.indexOf('*') > -1 || byId[o.id].link.indexOf(id) > -1));
        if (ok) { var e = { a: o, b: nd, hub: false, k: 12 }; edges.push(e); seed(e); }
      });
      if (!silent) burst(nd.x, nd.y, 26);
    }
    sync();
  }
  function removeNode(id) {
    var nd = nodes.filter(function (n) { return n.id === id; })[0]; if (!nd) return;
    burst(nd.x, nd.y, 18);
    nodes = nodes.filter(function (n) { return n !== nd; }); edges = edges.filter(function (e) { return e.a !== nd && e.b !== nd; }); sync();
  }
  function seed(e) { e.p = []; for (var i = 0; i < e.k; i++) e.p.push({ t: Math.random(), s: 0.12 + Math.random() * 0.2, d: Math.random() < 0.5 ? 1 : -1 }); }
  function burst(x, y, n) { for (var i = 0; i < n; i++) { var a = Math.random() * 6.283, s = 40 + Math.random() * 140; parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, l: 1 }); } }
  function sync() {
    var sys = nodes.length ? nodes.length - 1 : 0, lk = edges.filter(function (e) { return !e.hub; }).length;
    sysEl.textContent = sys; linkEl.textContent = lk;
    Array.prototype.forEach.call(tray.children, function (b) { b.setAttribute('aria-pressed', nodes.some(function (n) { return n.id === b.dataset.id; }) ? 'true' : 'false'); });
  }
  /* physics */
  function step(dt) {
    var cx = W / 2, cy = H * 0.5, h = hub(); if (h) { h.x += (cx - h.x) * Math.min(1, dt * 3); h.y += (cy - h.y) * Math.min(1, dt * 3); }
    var rest = Math.min(W * 0.26, H * 0.42); grav.x += (grav.tx - grav.x) * Math.min(1, dt * 6); grav.y += (grav.ty - grav.y) * Math.min(1, dt * 6);
    for (var i = 0; i < nodes.length; i++) {
      var a = nodes[i]; if (a === drag) continue;
      for (var j = i + 1; j < nodes.length; j++) {
        var b = nodes[j], dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy + 1, d = Math.sqrt(d2), f = 5200 * Math.max(1, W * H / 380000) / d2;
        var fx = dx / d * f, fy = dy / d * f; if (b !== drag && b !== h) { b.vx -= fx; b.vy -= fy; } if (a !== h) { a.vx += fx; a.vy += fy; }
      }
    }
    edges.forEach(function (e) {
      var dx = e.b.x - e.a.x, dy = e.b.y - e.a.y, d = Math.sqrt(dx * dx + dy * dy) + 0.01, L = e.hub ? rest : rest * 0.78, f = (d - L) * (e.hub ? 0.05 : 0.018);
      var fx = dx / d * f, fy = dy / d * f; if (e.a !== h && e.a !== drag) { e.a.vx += fx; e.a.vy += fy; } if (e.b !== h && e.b !== drag) { e.b.vx -= fx; e.b.vy -= fy; }
    });
    nodes.forEach(function (n) {
      if (n === drag || n === h) return;
      n.vx += grav.x * 0.9; n.vy += grav.y * 0.9; n.vx *= 0.86; n.vy *= 0.86; n.x += n.vx; n.y += n.vy;
      var m = n.r + 8; n.x = Math.max(m, Math.min(W - m, n.x)); n.y = Math.max(m + 18, Math.min(H - m - 6, n.y));
    });
  }
  function draw(now) {
    var tt = (now - t0) / 1000; ctx.clearRect(0, 0, W, H);
    /* floor grid: faint ledger rules */
    ctx.strokeStyle = rgba(C.text, 0.045); ctx.lineWidth = 1; ctx.beginPath();
    for (var y = (H % 36) / 2; y < H; y += 36) { ctx.moveTo(0, y + .5); ctx.lineTo(W, y + .5); } ctx.stroke();
    ctx.globalCompositeOperation = 'lighter';
    edges.forEach(function (e) {
      var ax = e.a.x, ay = e.a.y, bx = e.b.x, by = e.b.y, mx = (ax + bx) / 2, my = (ay + by) / 2, nx = -(by - ay), ny = bx - ax, nl = Math.hypot(nx, ny) + .01, off = e.hub ? 0 : 24 * Math.sin(tt * 0.6 + ax * .01);
      var qx = mx + nx / nl * off, qy = my + ny / nl * off;
      ctx.strokeStyle = rgba(e.hub ? C.muted : C.brass, e.hub ? 0.28 : 0.45); ctx.lineWidth = e.hub ? 1 : 1.4; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo(qx, qy, bx, by); ctx.stroke();
      e.p.forEach(function (p) {
        if (!reduce) { p.t += p.s * 0.016 * p.d; if (p.t > 1) p.t -= 1; if (p.t < 0) p.t += 1; }
        var t = p.t, u = 1 - t, x = u * u * ax + 2 * u * t * qx + t * t * bx, y = u * u * ay + 2 * u * t * qy + t * t * by;
        var g = ctx.createRadialGradient(x, y, 0, x, y, e.hub ? 5 : 8); g.addColorStop(0, rgba(e.hub ? C.text : C.acc, e.hub ? .7 : 1)); g.addColorStop(1, rgba(C.acc, 0));
        ctx.fillStyle = g; ctx.fillRect(x - 8, y - 8, 16, 16);
      });
    });
    parts.forEach(function (p) { var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 6); g.addColorStop(0, rgba(C.text, p.l)); g.addColorStop(1, rgba(C.acc, 0)); ctx.fillStyle = g; ctx.fillRect(p.x - 6, p.y - 6, 12, 12); });
    ctx.globalCompositeOperation = 'source-over';
    nodes.forEach(function (n) {
      var age = Math.max(0, Math.min(1, (now - n.born) / 520)), s = n === drag ? 1.12 : 1 - Math.pow(1 - age, 3) * 0 + (age < 1 ? Math.sin(age * 3.14) * 0.18 : 0) * 1 + (age < 1 ? 0 : 0);
      var sc = age < 1 ? (1 - Math.pow(1 - age, 3)) * 1.0 + Math.sin(age * 3.14) * 0.15 : (n === drag ? 1.12 : 1), r = n.r * sc, isHub = n.id === 'hub';
      var halo = ctx.createRadialGradient(n.x, n.y, r * 0.6, n.x, n.y, r * 2.6); halo.addColorStop(0, rgba(isHub ? C.acc : C.brass, isHub ? .32 : .16)); halo.addColorStop(1, rgba(C.acc, 0));
      ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(n.x, n.y, r * 2.6, 0, 6.283); ctx.fill();
      ctx.fillStyle = isHub ? C.acc : C.bg; ctx.strokeStyle = isHub ? C.acc : C.text; ctx.lineWidth = isHub ? 0 : 1.4; ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, 6.283); ctx.fill(); if (!isHub) ctx.stroke();
      ctx.fillStyle = isHub ? C.bg : C.text; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (isHub) { ctx.font = '600 15px Newsreader, Georgia, serif'; ctx.fillText('You', n.x, n.y + 1); }
      else { ctx.font = '600 ' + Math.max(11, Math.round(r * 0.42)) + 'px "Hanken Grotesk", system-ui, sans-serif'; ctx.fillText(n.label.length > 9 ? n.label.split(' ')[0] : n.label, n.x, n.y + 1); if (n.label.length > 9) { ctx.fillStyle = C.muted; ctx.font = '500 10px "Hanken Grotesk", system-ui, sans-serif'; ctx.fillText(n.label.split(' ').slice(1).join(' '), n.x, n.y + r + 13); } }
    });
    if (ptr.on) { var g2 = ctx.createRadialGradient(ptr.x, ptr.y, 0, ptr.x, ptr.y, 60); g2.addColorStop(0, rgba(C.acc, .12)); g2.addColorStop(1, rgba(C.acc, 0)); ctx.fillStyle = g2; ctx.fillRect(ptr.x - 60, ptr.y - 60, 120, 120); }
  }
  function loop(now) {
    if (!running) return; var dt = Math.min(0.05, (now - last) / 1000); last = now;
    step(dt); parts.forEach(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.94; p.vy *= 0.94; p.l -= dt * 1.4; }); parts = parts.filter(function (p) { return p.l > 0; });
    draw(now); requestAnimationFrame(loop);
  }
  function start() { if (running) return; running = true; last = performance.now(); requestAnimationFrame(loop); }
  function stop() { running = false; }
  /* tray */
  APPS.forEach(function (a) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'bld-chip'; b.dataset.id = a.id; b.textContent = a.n; b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', function () { if (hint) hint.style.opacity = 1; if (nodes.some(function (n) { return n.id === a.id; })) removeNode(a.id); else addNode(a.id); auto = false; });
    tray.appendChild(b);
  });
  /* pointer: drag nodes */
  function pos(e) { var r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  function hit(p) { for (var i = nodes.length - 1; i >= 0; i--) { var n = nodes[i]; if (Math.hypot(n.x - p.x, n.y - p.y) < n.r + 12) return n; } return null; }
  cv.addEventListener('pointerdown', function (e) { var p = pos(e), n = hit(p); if (n) { drag = n; cv.setPointerCapture(e.pointerId); auto = false; if (hint) hint.style.opacity = 0; } });
  cv.addEventListener('pointermove', function (e) { var p = pos(e); ptr.x = p.x; ptr.y = p.y; ptr.on = e.pointerType === 'mouse'; if (drag) { drag.x = p.x; drag.y = p.y; drag.vx = drag.vy = 0; } cv.style.cursor = drag ? 'grabbing' : (hit(p) ? 'grab' : 'default'); });
  function up() { drag = null; } cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up); cv.addEventListener('pointerleave', function () { ptr.on = false; });
  /* send blueprint to the contact form */
  document.getElementById('bld-send').addEventListener('click', function () {
    var sys = nodes.filter(function (n) { return n.id !== 'hub'; }).map(function (n) { return byId[n.id].t; });
    var f = document.getElementById('f-msg');
    if (f) {
      var list = sys.length ? sys.join(', ') : 'a custom system';
      f.value = 'Blueprint from the builder: I want ' + list + ' connected into one system.\n\nWhat I need it to do:\n';
      f.dispatchEvent(new Event('input', { bubbles: true }));
    }
    var c = document.getElementById('contact'); if (c) c.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    setTimeout(function () { if (f) f.focus({ preventScroll: true }); }, 700);
  });
  /* tilt: device orientation becomes gravity */
  var tiltBtn = document.getElementById('bld-tilt'), tiltOn = false;
  function onTilt(e) {
    if (e.gamma == null) return;
    var g = Math.max(-40, Math.min(40, e.gamma)) / 40, b = Math.max(-40, Math.min(40, (e.beta || 0) - 45)) / 40;
    var o = (screen.orientation && screen.orientation.angle) || 0, x = g, y = b;
    if (o === 90) { x = b; y = -g; } else if (o === 270 || o === -90) { x = -b; y = g; }
    grav.tx = x * 0.55; grav.ty = y * 0.55;
  }
  function enableTilt() {
    if (tiltOn) { tiltOn = false; removeEventListener('deviceorientation', onTilt); grav.tx = grav.ty = 0; tiltBtn.setAttribute('aria-pressed', 'false'); tiltBtn.textContent = 'Tilt to swing'; return; }
    var go = function () { tiltOn = true; addEventListener('deviceorientation', onTilt); tiltBtn.setAttribute('aria-pressed', 'true'); tiltBtn.textContent = 'Tilt on'; };
    if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission().then(function (r) { if (r === 'granted') go(); }).catch(function () {});
    } else go();
  }
  if (tiltBtn && 'DeviceOrientationEvent' in window && matchMedia('(pointer: coarse)').matches) { tiltBtn.classList.add('show'); tiltBtn.addEventListener('click', enableTilt); }
  /* autoplay a demo build when first seen */
  var auto = true, seen = false, seq = ['creator', 'books', 'mra', 'crm', 'flow'];
  function demo() { var i = 0; (function nx() { if (!auto || i >= seq.length) return; addNode(seq[i++]); setTimeout(nx, 650); })(); }
  colors(); size(); addNode('hub', W / 2, H / 2, true);
  new IntersectionObserver(function (en) {
    en.forEach(function (x) { if (x.isIntersecting) { start(); if (!seen) { seen = true; setTimeout(demo, 500); } } else stop(); });
  }, { threshold: 0.15 }).observe(stage);
  addEventListener('resize', function () { size(); });
  new MutationObserver(colors).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  if (reduce) { seq.forEach(function (id) { addNode(id, null, null, true); }); }
})();
