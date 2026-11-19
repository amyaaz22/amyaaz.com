/* Penalty shoot-out: night-stadium scene, rounds of five against a ladder of fictional keepers.
   Beat a keeper by scoring enough of five; each one reads shots better. Progress is saved on this device. */
(function () {
  'use strict';
  var cv = document.getElementById('pitch');
  if (!cv) return;
  var ctx = cv.getContext('2d');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  var KEEPERS = [
    { n: 'Dodo FC', read: 0.34, speed: 120, need: 2 },
    { n: 'Port Louis Pelé', read: 0.44, speed: 100, need: 3 },
    { n: 'Le Pouce Rangers', read: 0.52, speed: 90, need: 3 },
    { n: 'The Wall', read: 0.6, speed: 80, need: 4 },
    { n: 'Keeper Killer', read: 0.68, speed: 70, need: 4 },
    { n: 'Captain Noor', read: 0.76, speed: 60, need: 5 }
  ];
  var ROUND = 5;
  var rivalEl = document.getElementById('pk-rival');
  var scoreEl = document.getElementById('score'), shotsEl = document.getElementById('shots'), bestEl = document.getElementById('best');
  var ladderEl = document.getElementById('pk-ladder');
  var resetBtn = document.getElementById('pk-reset');

  var level = Math.min(KEEPERS.length - 1, parseInt(store('pk-level') || '0', 10) || 0);
  var best = parseInt(store('pk-best') || '0', 10) || 0;
  var goals = 0, shots = 0, streak = 0;
  var W = 0, H = 0, dpr = 1;
  var aim = { x: 0.5, y: 0.34 }, hovering = false;
  var keeper = { x: 0.5, target: 0.5, t: 0, dive: 0 };
  var ball = null, msg = null, over = null, running = false, visible = false, last = 0, flash = 0;
  var crowd = [];

  function KP() { return KEEPERS[level]; }
  function hud() {
    if (rivalEl) rivalEl.textContent = KP().n;
    if (scoreEl) scoreEl.textContent = goals;
    if (shotsEl) shotsEl.textContent = shots;
    if (bestEl) bestEl.textContent = best;
    if (ladderEl) {
      ladderEl.innerHTML = KEEPERS.map(function (k, i) {
        return '<li class="' + (i === level ? 'on' : i < level ? 'done' : '') + '"><span>' + (i + 1) + '</span>' + k.n + '</li>';
      }).join('');
    }
  }
  function resize() {
    var r = cv.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    crowd = [];
    for (var i = 0; i < 260; i++) crowd.push({ x: Math.random(), y: Math.random(), c: Math.random() });
    draw();
  }
  function goal() { var gw = Math.min(W * 0.5, 400), gh = gw * 0.36; return { x: (W - gw) / 2, y: H * 0.2, w: gw, h: gh }; }
  function spot() { return { x: W / 2, y: H * 0.86 }; }

  function shoot() {
    if (over) { over = null; goals = 0; shots = 0; hud(); draw(); return; }
    if (ball) return;
    var g = goal(), s = spot(), k = KP();
    var tx = aim.x * W, ty = aim.y * H;
    shots++; hud();
    var rel = (tx - g.x) / g.w;
    var guess = Math.random() < k.read ? rel : Math.random();
    keeper.target = Math.max(0.1, Math.min(0.9, guess));
    ball = { sx: s.x, sy: s.y, tx: tx, ty: ty, t: 0, dur: reduce ? 250 : 620, curve: (Math.random() - 0.5) * 70 };
    running = true; loop(performance.now());
  }
  function endRound() {
    var k = KP(), won = goals >= k.need, last = level === KEEPERS.length - 1;
    if (won && !last) { level++; store('pk-level', String(level)); }
    over = {
      won: won,
      line1: won ? (last ? 'LADDER CLEARED' : 'ROUND WON') : 'ROUND LOST',
      line2: won ? goals + ' of ' + ROUND + (last ? ' · you beat every keeper' : ' · next keeper: ' + KP().n) : goals + ' of ' + ROUND + ' · needed ' + k.need + ' to beat ' + k.n
    };
    streak = 0; hud();
  }
  function resolve() {
    var g = goal(), tx = ball.tx, ty = ball.ty;
    var inside = tx > g.x + 4 && tx < g.x + g.w - 4 && ty > g.y + 4 && ty < g.y + g.h;
    var kx = g.x + keeper.x * g.w, kw = g.w * 0.2;
    var saved = inside && Math.abs(tx - kx) < kw && ty > g.y + g.h * 0.1;
    if (!inside) { msg = { text: ty <= g.y + 4 ? 'OVER THE BAR' : 'WIDE', color: '#a0a5b0', t: 0 }; streak = 0; }
    else if (saved) { msg = { text: 'SAVED', color: '#e8553a', t: 0 }; streak = 0; }
    else {
      goals++; streak++; flash = 1;
      if (streak > best) { best = streak; store('pk-best', String(best)); }
      msg = { text: streak > 2 ? 'GOAL · ' + streak + ' IN A ROW' : 'GOAL', color: '#f1e8d8', t: 0 };
      if (window.gtag) window.gtag('event', 'penalty_goal', { streak: streak });
    }
    hud();
    setTimeout(function () {
      ball = null; keeper.target = 0.5;
      if (shots >= ROUND) endRound();
      draw();
    }, reduce ? 300 : 950);
  }

  function loop(ts) {
    var dt = Math.min(50, ts - (last || ts)); last = ts;
    keeper.t += dt / 1000;
    if (!ball) keeper.target = 0.5 + Math.sin(keeper.t * 1.5) * 0.18;
    keeper.x += (keeper.target - keeper.x) * Math.min(1, dt / (ball ? KP().speed : 240));
    keeper.dive += ((ball ? keeper.target - 0.5 : 0) - keeper.dive) * Math.min(1, dt / 110);
    if (ball) { ball.t += dt; if (ball.t >= ball.dur && !ball.done) { ball.done = true; resolve(); } }
    if (msg) { msg.t += dt; if (msg.t > 1500) msg = null; }
    flash = Math.max(0, flash - dt / 500);
    draw();
    if (visible || ball) requestAnimationFrame(loop); else { running = false; last = 0; }
  }

  function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  function drawBall(x, y, r, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    var gr = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r);
    gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#c4cad6');
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fillStyle = gr; ctx.fill();
    ctx.fillStyle = '#12151f';
    ctx.beginPath();
    for (var i = 0; i < 5; i++) { var a = -Math.PI / 2 + i * 2 * Math.PI / 5; ctx.lineTo(Math.cos(a) * r * 0.36, Math.sin(a) * r * 0.36); }
    ctx.closePath(); ctx.fill();
    for (var j = 0; j < 5; j++) {
      var b = -Math.PI / 2 + j * 2 * Math.PI / 5 + Math.PI / 5;
      ctx.beginPath(); ctx.arc(Math.cos(b) * r * 0.78, Math.sin(b) * r * 0.78, r * 0.17, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function scene(g, by) {
    // stadium backdrop
    var sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#05070d'); sky.addColorStop(0.42, '#0a1220'); sky.addColorStop(0.43, '#0c1d22'); sky.addColorStop(1, '#0a1a1f');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    // floodlights
    [0.12, 0.88].forEach(function (fx) {
      var fl = ctx.createRadialGradient(W * fx, 0, 0, W * fx, 0, H * 0.7);
      fl.addColorStop(0, 'rgba(180,200,255,0.22)'); fl.addColorStop(1, 'rgba(180,200,255,0)');
      ctx.fillStyle = fl; ctx.fillRect(0, 0, W, H);
    });
    // crowd band
    var cy0 = H * 0.06, cy1 = by - g.h * 0.55;
    crowd.forEach(function (c) {
      var y = cy0 + c.y * (cy1 - cy0) * 0.6;
      ctx.globalAlpha = 0.25 + c.c * 0.35;
      ctx.fillStyle = c.c > 0.85 ? '#e8553a' : c.c > 0.6 ? '#d6b46a' : '#cfc6b4';
      ctx.fillRect(c.x * W, y, 2, 2);
    });
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(5,7,13,0.55)'; ctx.fillRect(0, by - g.h * 0.55, W, g.h * 0.55 + 2);
    // pitch stripes, in perspective
    var hy = by - 1;
    for (var i = 0; i < 9; i++) {
      var t0 = i / 9, t1 = (i + 1) / 9;
      var y0 = hy + (H - hy) * t0 * t0, y1 = hy + (H - hy) * t1 * t1;
      ctx.fillStyle = i % 2 ? 'rgba(28,58,66,0.35)' : 'rgba(14,36,42,0.35)';
      ctx.fillRect(0, y0, W, y1 - y0 + 1);
    }
    // pitch markings
    ctx.strokeStyle = 'rgba(255,255,255,0.32)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, by); ctx.lineTo(W, by); ctx.stroke();
    var s = spot();
    ctx.beginPath();
    ctx.moveTo(g.x - g.w * 0.45, by); ctx.lineTo(W * 0.5 - g.w * 0.95, H * 0.97);
    ctx.moveTo(g.x + g.w * 1.45, by); ctx.lineTo(W * 0.5 + g.w * 0.95, H * 0.97);
    ctx.stroke();
    ctx.beginPath(); ctx.moveTo(g.x - g.w * 0.18, by); ctx.lineTo(g.x - g.w * 0.3, by + (H - by) * 0.2); ctx.lineTo(g.x + g.w * 1.3, by + (H - by) * 0.2); ctx.lineTo(g.x + g.w * 1.18, by); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.ellipse(s.x, s.y, 4, 2, 0, 0, Math.PI * 2); ctx.fill();
  }

  function draw() {
    if (!W) return;
    var g = goal(), by = g.y + g.h;
    ctx.clearRect(0, 0, W, H);
    scene(g, by);
    // net: back plane is smaller than the frame
    var inset = g.w * 0.06, dep = g.h * 0.16;
    ctx.save(); ctx.strokeStyle = 'rgba(210,225,255,0.22)'; ctx.lineWidth = 1;
    var bx0 = g.x + inset, bx1 = g.x + g.w - inset, by0 = g.y + dep;
    for (var nx = 0; nx <= 20; nx++) { var px = bx0 + (bx1 - bx0) * nx / 20, fx = g.x + g.w * nx / 20; ctx.beginPath(); ctx.moveTo(px, by0); ctx.lineTo(px, by - 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(fx, g.y); ctx.lineTo(px, by0); ctx.stroke(); }
    for (var ny = 0; ny <= 8; ny++) { var py = by0 + (by - 2 - by0) * ny / 8; ctx.beginPath(); ctx.moveTo(bx0, py); ctx.lineTo(bx1, py); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(g.x, g.y); ctx.lineTo(bx0, by0); ctx.moveTo(g.x + g.w, g.y); ctx.lineTo(bx1, by0); ctx.stroke();
    ctx.restore();
    // keeper
    var kh = g.h * 0.86, kw = g.w * 0.13;
    var kcx = g.x + keeper.x * g.w, dv = keeper.dive;
    ctx.save();
    ctx.translate(kcx, by); ctx.rotate(dv * 1.1); ctx.translate(0, -Math.abs(dv) * kh * 0.18);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(0, 2, kw * 0.9, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1b1f33'; rr(-kw * 0.36, -kh * 0.36, kw * 0.3, kh * 0.36, 3); ctx.fill(); rr(kw * 0.06, -kh * 0.36, kw * 0.3, kh * 0.36, 3); ctx.fill();
    var jg = ctx.createLinearGradient(0, -kh, 0, -kh * 0.35); jg.addColorStop(0, '#e8553a'); jg.addColorStop(1, '#b83a24');
    ctx.fillStyle = jg; rr(-kw * 0.55, -kh * 0.82, kw * 1.1, kh * 0.5, 7); ctx.fill();
    ctx.strokeStyle = '#e8553a'; ctx.lineCap = 'round'; ctx.lineWidth = kw * 0.2;
    var lift = Math.abs(dv) * kh * 0.5;
    ctx.beginPath(); ctx.moveTo(-kw * 0.5, -kh * 0.76); ctx.lineTo(-kw * 1.05, -kh * 0.7 - lift * (dv < 0 ? 1 : 0.3)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(kw * 0.5, -kh * 0.76); ctx.lineTo(kw * 1.05, -kh * 0.7 - lift * (dv > 0 ? 1 : 0.3)); ctx.stroke();
    ctx.fillStyle = '#f1e8d8';
    ctx.beginPath(); ctx.arc(-kw * 1.08, -kh * 0.7 - lift * (dv < 0 ? 1 : 0.3), kw * 0.2, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(kw * 1.08, -kh * 0.7 - lift * (dv > 0 ? 1 : 0.3), kw * 0.2, 0, 7); ctx.fill();
    ctx.fillStyle = '#e8c9a8'; ctx.beginPath(); ctx.arc(0, -kh * 0.93, kh * 0.1, 0, 7); ctx.fill();
    ctx.restore();
    // goal frame with glow
    ctx.save(); ctx.shadowColor = flash > 0 ? 'rgba(214,180,106,' + flash + ')' : 'rgba(200,215,255,0.35)'; ctx.shadowBlur = 14 + flash * 24;
    ctx.strokeStyle = '#f4f6ff'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(g.x, by); ctx.lineTo(g.x, g.y); ctx.lineTo(g.x + g.w, g.y); ctx.lineTo(g.x + g.w, by); ctx.stroke();
    ctx.restore();
    // aim reticle
    if (!ball && !over && (hovering || document.activeElement === cv)) {
      var ax = aim.x * W, ay = aim.y * H, s0 = spot();
      ctx.save(); ctx.strokeStyle = '#f1e8d8'; ctx.lineWidth = 1.5; ctx.shadowColor = 'rgba(214,180,106,.6)'; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(ax, ay, 13, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ax - 21, ay); ctx.lineTo(ax - 7, ay); ctx.moveTo(ax + 7, ay); ctx.lineTo(ax + 21, ay); ctx.moveTo(ax, ay - 21); ctx.lineTo(ax, ay - 7); ctx.moveTo(ax, ay + 7); ctx.lineTo(ax, ay + 21); ctx.stroke();
      ctx.setLineDash([2, 7]); ctx.globalAlpha = 0.5; ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.moveTo(s0.x, s0.y - 10); ctx.lineTo(ax, ay); ctx.stroke(); ctx.restore();
    }
    // ball with trail
    var s1 = spot(), r0 = Math.max(10, Math.min(16, W * 0.026));
    if (ball) {
      var k = Math.min(1, ball.t / ball.dur), e = 1 - Math.pow(1 - k, 2.2);
      var pos = function (q) {
        var mx = (ball.sx + ball.tx) / 2 + ball.curve, my = Math.min(ball.sy, ball.ty) - 24;
        return { x: (1 - q) * (1 - q) * ball.sx + 2 * (1 - q) * q * mx + q * q * ball.tx, y: (1 - q) * (1 - q) * ball.sy + 2 * (1 - q) * q * my + q * q * ball.ty };
      };
      for (var tr = 5; tr >= 1; tr--) {
        var qe = Math.max(0, e - tr * 0.035), pt = pos(qe);
        ctx.globalAlpha = 0.07 * (6 - tr); ctx.fillStyle = '#dbe4ff';
        ctx.beginPath(); ctx.arc(pt.x, pt.y, r0 * (1 - qe * 0.5) * 0.9, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      var pb = pos(e), sc = 1 - e * 0.5;
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(pb.x, Math.max(pb.y + r0 * sc, by + 6), r0 * sc, r0 * sc * 0.28, 0, 0, Math.PI * 2); ctx.fill();
      drawBall(pb.x, pb.y, r0 * sc, e * 10);
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(s1.x, s1.y, r0, r0 * 0.28, 0, 0, Math.PI * 2); ctx.fill();
      drawBall(s1.x, s1.y - r0, r0, 0);
    }
    // goal flash
    if (flash > 0) { ctx.fillStyle = 'rgba(214,180,106,' + (flash * 0.08) + ')'; ctx.fillRect(0, 0, W, H); }
    // message
    if (msg) {
      var a = msg.t < 180 ? msg.t / 180 : Math.max(0, 1 - (msg.t - 1000) / 500);
      ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = msg.color; ctx.textAlign = 'center';
      ctx.font = '400 ' + Math.round(Math.min(44, W * 0.07)) + 'px "Newsreader", Georgia, serif';
      ctx.fillText(msg.text, W / 2, H * 0.62 - (msg.t < 180 ? (1 - a) * 12 : 0)); ctx.restore();
    } else if (!ball && !over && shots === 0) {
      ctx.fillStyle = 'rgba(200,210,240,0.75)'; ctx.textAlign = 'center'; ctx.font = '11px "Spline Sans Mono", monospace';
      ctx.fillText((fine ? 'AIM AND CLICK TO SHOOT' : 'TAP THE GOAL TO SHOOT') + ' · SCORE ' + KP().need + ' OF ' + ROUND + ' TO BEAT ' + KP().n.toUpperCase(), W / 2, H * 0.62);
    }
    // round result
    if (over) {
      ctx.fillStyle = 'rgba(5,7,13,0.78)'; ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.fillStyle = over.won ? '#f1e8d8' : '#e8553a'; ctx.font = '400 ' + Math.round(Math.min(40, W * 0.07)) + 'px "Newsreader", Georgia, serif';
      ctx.fillText(over.line1, W / 2, H * 0.44);
      ctx.fillStyle = '#cfc6b4'; ctx.font = '12px "Spline Sans Mono", monospace'; ctx.fillText(over.line2.toUpperCase(), W / 2, H * 0.52);
      ctx.fillStyle = '#a0a5b0'; ctx.fillText((fine ? 'CLICK' : 'TAP') + ' OR PRESS SPACE FOR THE NEXT ROUND', W / 2, H * 0.6);
    }
  }

  function setAim(e) {
    var r = cv.getBoundingClientRect();
    aim.x = Math.max(0.02, Math.min(0.98, (e.clientX - r.left) / r.width));
    aim.y = Math.max(0.05, Math.min(0.66, (e.clientY - r.top) / r.height));
  }
  cv.addEventListener('pointermove', function (e) { hovering = true; setAim(e); if (!running) draw(); });
  cv.addEventListener('pointerleave', function () { hovering = false; if (!running) draw(); });
  cv.addEventListener('pointerdown', function (e) { setAim(e); shoot(); });
  cv.addEventListener('keydown', function (e) {
    var st = 0.04;
    if (e.key === 'ArrowLeft') aim.x = Math.max(0.02, aim.x - st);
    else if (e.key === 'ArrowRight') aim.x = Math.min(0.98, aim.x + st);
    else if (e.key === 'ArrowUp') aim.y = Math.max(0.05, aim.y - st);
    else if (e.key === 'ArrowDown') aim.y = Math.min(0.66, aim.y + st);
    else if (e.key === ' ' || e.key === 'Enter') shoot();
    else return;
    e.preventDefault(); if (!running) draw();
  });
  cv.addEventListener('focus', function () { if (!running) draw(); });
  if (resetBtn) resetBtn.addEventListener('click', function () { goals = shots = streak = 0; level = 0; store('pk-level', '0'); msg = null; over = null; ball = null; hud(); draw(); });

  hud();
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(cv); else window.addEventListener('resize', resize);
  resize();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      visible = en[0].isIntersecting;
      if (visible && !running && !reduce) { running = true; loop(performance.now()); }
    }).observe(cv);
  }
})();
