/* motion.js: greeting, shattering glass field, smooth scroll, scroll-driven type and cards. */
(function () {
  var html = document.documentElement, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var pre = document.getElementById('x-pre'), preLogo = document.getElementById('x-pre-logo'), preW = document.getElementById('x-pre-w');
  var lenis = null, fields = [], heroField = null, playing = false;
  var WORDS = [['Hello', 'en'], ['Bonjour', 'fr'], ['Bonzour', 'mfe'], ['مرحبا', 'ar']];

  /* ---------- glass field ---------- */
  function Field(canvas, o) {
    o = o || {};
    var x = canvas.getContext('2d'), dpr = Math.min(devicePixelRatio || 1, 1.5), W = 0, H = 0, S = [], P = [], sparks = [], vis = true, ptr = { x: -999, y: -999 }, pane = !!o.pane, last = performance.now();
    function size() { W = canvas.clientWidth; H = canvas.clientHeight; canvas.width = W * dpr; canvas.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0); }
    function mk(vs, ix, iy) {
      var cx = (vs[0][0] + vs[1][0] + vs[2][0]) / 3, cy = (vs[0][1] + vs[1][1] + vs[2][1]) / 3;
      return { hx: cx, hy: cy, x: cx, y: cy, rx: cx, ry: cy, vx: 0, vy: 0, rot: 0, vr: 0, tl: Math.random() * 6.28, tv: (Math.random() - .5) * .6, z: .4 + Math.random() * .9, lit: Math.random(),
        v: vs.map(function (p) { return [p[0] - cx, p[1] - cy]; }), broken: false, a: 1 };
    }
    function build() {
      S = []; P = [];
      if (pane) {
        var cols = W < 700 ? 6 : 10, rows = W < 700 ? 8 : 6, pts = [];
        for (var j = 0; j <= rows; j++) { pts[j] = []; for (var i = 0; i <= cols; i++) {
          var px = i / cols * W, py = j / rows * H, jit = (i === 0 || j === 0 || i === cols || j === rows) ? 0 : 1;
          pts[j][i] = [px + (i && i < cols ? (Math.random() - .5) * W / cols * .7 : 0), py + (j && j < rows ? (Math.random() - .5) * H / rows * .7 : 0)]; } }
        for (var j2 = 0; j2 < rows; j2++) for (var i2 = 0; i2 < cols; i2++) {
          var a = pts[j2][i2], b = pts[j2][i2 + 1], c = pts[j2 + 1][i2 + 1], d = pts[j2 + 1][i2];
          if (Math.random() < .5) { S.push(mk([a, b, c])); S.push(mk([a, c, d])); } else { S.push(mk([a, b, d])); S.push(mk([b, c, d])); }
        }
      } else {
        var n = W < 700 ? 8 : 14;
        for (var k = 0; k < n; k++) { var r = 60 + Math.random() * 170, cx = Math.random() * W, cy = Math.random() * H, a0 = Math.random() * 6.28;
          var s = mk([0, 1, 2].map(function (q) { return [cx + Math.cos(a0 + q * 2.094) * r, cy + Math.sin(a0 + q * 2.094) * r * (.7 + Math.random() * .5)]; })); s.broken = true; s.vr = (Math.random() - .5) * .4; S.push(s); }
      }
      var pn = W < 700 ? 50 : 110;
      for (var m = 0; m < pn; m++) P.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * 10, vy: (Math.random() - .5) * 10, r: .6 + Math.random() * 1.8, a: .25 + Math.random() * .55 });
    }
    function shatter(ix, iy, power) {
      power = power || 1;
      S.forEach(function (s) {
        var dx = s.x - ix, dy = s.y - iy, dist = Math.sqrt(dx * dx + dy * dy) + 40, ux = dx / dist, uy = dy / dist;
        var sp = (900 + Math.random() * 500) * power * Math.min(1.6, 600 / dist + .4);
        s.vx = ux * sp; s.vy = uy * sp - 80; s.vr = (Math.random() - .5) * 9; s.tv = (Math.random() - .5) * 7; s.broken = true;
        var k = (.18 + Math.random() * .7) * (W < 700 ? .45 : 1); s.rx = Math.max(-W * .05, Math.min(W * 1.05, s.hx + ux * dist * k)); s.ry = Math.max(-H * .05, Math.min(H * 1.05, s.hy + uy * dist * k));
      });
      for (var i = 0; i < 70; i++) { var an = Math.random() * 6.28, sp2 = 150 + Math.random() * 700; sparks.push({ x: ix, y: iy, vx: Math.cos(an) * sp2, vy: Math.sin(an) * sp2, r: .8 + Math.random() * 2.4, life: 1 }); }
    }
    function reset() { S.forEach(function (s) { s.x = s.hx; s.y = s.hy; s.rx = s.hx; s.ry = s.hy; s.vx = s.vy = s.vr = 0; s.rot = 0; s.broken = false; s.tl = 0; s.tv = 0; }); }
    function burst(ix, iy) { S.forEach(function (s) { var dx = s.x - ix, dy = s.y - iy, d = Math.sqrt(dx * dx + dy * dy) + 60; if (d < 520) { s.vx += dx / d * 600 * (1 - d / 520); s.vy += dy / d * 600 * (1 - d / 520); s.vr += (Math.random() - .5) * 5; } }); }
    function impulse(v) { S.forEach(function (s) { if (s.broken) s.vy += v * s.z; }); }
    function frame(now) {
      requestAnimationFrame(frame); if (!vis) { last = now; return; }
      var dt = Math.min(.04, (now - last) / 1000); last = now;
      x.clearRect(0, 0, W, H);
      // particles
      P.forEach(function (p) {
        p.x += p.vx * dt; p.y += p.vy * dt;
        var dx = p.x - ptr.x, dy = p.y - ptr.y, d2 = dx * dx + dy * dy; if (d2 < 22500) { var d = Math.sqrt(d2) + 1; p.vx += dx / d * 260 * dt; p.vy += dy / d * 260 * dt; }
        p.vx *= .985; p.vy *= .985; p.vx += (Math.random() - .5) * 6 * dt; p.vy += (Math.random() - .5) * 6 * dt;
        if (p.x < 0) p.x += W; if (p.x > W) p.x -= W; if (p.y < 0) p.y += H; if (p.y > H) p.y -= H;
        x.fillStyle = 'rgba(255,255,255,' + p.a + ')'; x.beginPath(); x.arc(p.x, p.y, p.r, 0, 6.28); x.fill();
      });
      // shards
      S.forEach(function (s) {
        if (s.broken) {
          s.vx += (s.rx - s.x) * 2.1 * dt; s.vy += (s.ry - s.y) * 2.1 * dt;
          var dx = s.x - ptr.x, dy = s.y - ptr.y, d2 = dx * dx + dy * dy; if (d2 < 40000) { var d = Math.sqrt(d2) + 1; s.vx += dx / d * 700 * dt; s.vy += dy / d * 700 * dt; }
          var dr = Math.pow(.2, dt); s.vx *= dr; s.vy *= dr; s.x += s.vx * dt; s.y += s.vy * dt;
          s.vr += (.05 - s.vr) * dt * .8; s.rot += s.vr * dt; s.tl += s.tv * dt; s.tv += (.3 - s.tv) * dt * .6;
        }
        var fl = s.broken ? Math.max(.38, Math.abs(Math.cos(s.tl))) : 1;
        x.save(); x.translate(s.x, s.y); x.rotate(s.rot); x.scale(1, fl);
        if (s.broken) { x.beginPath(); x.moveTo(s.v[0][0] + 12 * s.z, s.v[0][1] + 14 * s.z); x.lineTo(s.v[1][0] + 12 * s.z, s.v[1][1] + 14 * s.z); x.lineTo(s.v[2][0] + 12 * s.z, s.v[2][1] + 14 * s.z); x.closePath(); x.fillStyle = 'rgba(4,8,60,.22)'; x.fill(); }
        x.beginPath(); x.moveTo(s.v[0][0], s.v[0][1]); x.lineTo(s.v[1][0], s.v[1][1]); x.lineTo(s.v[2][0], s.v[2][1]); x.closePath();
        var lit = .5 + .5 * Math.sin(s.tl + s.rot * 2 + s.lit * 6), g = x.createLinearGradient(s.v[0][0], s.v[0][1], s.v[2][0], s.v[2][1]);
        if (s.broken) { g.addColorStop(0, 'rgba(255,255,255,' + (.10 + .30 * lit) + ')'); g.addColorStop(1, 'rgba(140,170,255,' + (.05 + .14 * (1 - lit)) + ')'); }
        else { g.addColorStop(0, 'rgba(255,255,255,' + (.04 + .06 * s.lit) + ')'); g.addColorStop(1, 'rgba(255,255,255,.015)'); }
        x.fillStyle = g; x.fill(); x.strokeStyle = 'rgba(255,255,255,' + (s.broken ? .25 + .35 * lit : .22) + ')'; x.lineWidth = s.broken ? 1.2 : 1; x.stroke(); x.restore();
      });
      sparks = sparks.filter(function (p) { p.life -= dt * .9; if (p.life <= 0) return false; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .96; p.vy *= .96; x.fillStyle = 'rgba(255,255,255,' + p.life * .9 + ')'; x.beginPath(); x.arc(p.x, p.y, p.r, 0, 6.28); x.fill(); return true; });
    }
    size(); build();
    var rt; addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { var was = S.some(function (s) { return s.broken; }); size(); build(); if (was && pane) shatter(W / 2, H * .45, .35); }, 200); });
    canvas.parentElement.addEventListener('pointermove', function (e) { var r = canvas.getBoundingClientRect(); ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top; });
    canvas.parentElement.addEventListener('pointerleave', function () { ptr.x = ptr.y = -999; });
    new IntersectionObserver(function (e) { vis = e[0].isIntersecting; }).observe(canvas);
    if (reduce) { S.forEach(function (s) { s.broken = true; }); vis = true; frame(performance.now()); vis = false; } else requestAnimationFrame(frame);
    return { shatter: shatter, reset: reset, burst: burst, impulse: impulse, size: function () { return [W, H]; }, pane: pane };
  }

  /* ---------- greeting ---------- */
  function setWord(i) { preW.textContent = WORDS[i][0]; preW.setAttribute('lang', WORDS[i][1]); preW.setAttribute('dir', WORDS[i][1] === 'ar' ? 'rtl' : 'ltr'); }
  function playHello(cb) {
    if (playing) return; playing = true;
    if (!pre || !window.gsap || reduce) { playing = false; html.classList.remove('pre'); cb && cb(); return; }
    html.classList.add('pre'); gsap.set(pre, { yPercent: 0 }); gsap.set(preW, { opacity: 0, yPercent: 0 }); preW.textContent = '';
    preLogo.classList.remove('glitch'); void preLogo.offsetWidth; preLogo.classList.add('glitch'); gsap.set(preLogo, { opacity: 1 });
    var tl = gsap.timeline({ onComplete: function () { html.classList.remove('pre'); html.classList.add('ready'); playing = false; cb && cb(); } });
    tl.to(preLogo, { opacity: 0, duration: .15 }, .85);
    WORDS.forEach(function (w, k) { tl.call(function () { setWord(k); }, null, 1 + k * .42); tl.set(preW, { opacity: 1 }, 1 + k * .42); });
    tl.to(preW, { yPercent: -110, opacity: 0, duration: .45, ease: 'power3.in' }, 1 + WORDS.length * .42);
    tl.to(pre, { yPercent: -100, duration: .95, ease: 'expo.inOut' }, '>-0.05');
  }
  function heroIntro() {
    if (!window.gsap || reduce) return;
    gsap.set('.x-mega .ln i', { yPercent: 112, opacity: 1 });
    gsap.to('.x-mega .ln i', { yPercent: 0, duration: 1.3, ease: 'expo.out', stagger: .12 });
    gsap.to('.x-hero-foot', { opacity: 1, duration: 1, delay: .6 });
    if (heroField) setTimeout(function () { var s = heroField.size(); heroField.shatter(s[0] / 2, s[1] * .45); }, 450);
  }
  window.__hello = function () {
    if (lenis) lenis.scrollTo(0, { immediate: true }); else scrollTo(0, 0);
    if (heroField) heroField.reset();
    if (window.gsap) gsap.set('.x-mega .ln i', { yPercent: 112 });
    playHello(heroIntro);
  };

  /* ---------- clock + dock spy + logo tint ---------- */
  function clock() { var el = document.getElementById('x-clock'); if (!el) return; function t() { el.textContent = 'Port Louis, ' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Indian/Mauritius' }) + ' GMT+4'; } t(); setInterval(t, 20000); }
  function ui() {
    var nav = document.querySelector('.nav'), links = [].slice.call(document.querySelectorAll('.dock [data-spy]')), dark = [].slice.call(document.querySelectorAll('.x-hero,.ink'));
    function tick() {
      if (nav) { var el = document.elementFromPoint(40, 40), on = !!(el && el.closest && el.closest('.x-hero,.ink,.x-band')); nav.classList.toggle('on-dark', on); }
      links.forEach(function (a) { var s = document.getElementById(a.dataset.spy); if (!s) return; var r = s.getBoundingClientRect(); a.setAttribute('aria-current', r.top < innerHeight * .5 && r.bottom > innerHeight * .4 ? 'true' : 'false'); });
    }
    addEventListener('scroll', tick, { passive: true }); tick();
  }

  /* ---------- scroll ---------- */
  function scroll() {
    if (!window.gsap || !window.ScrollTrigger) return; gsap.registerPlugin(ScrollTrigger);
    if (window.Lenis && !reduce) {
      lenis = new Lenis({ lerp: .085, smoothWheel: true });
      lenis.on('scroll', function (e) { ScrollTrigger.update(); if (heroField) heroField.impulse(e.velocity * 4); fields.forEach(function (f) { f.impulse(e.velocity * 3); }); });
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); }); gsap.ticker.lagSmoothing(0);
      document.querySelectorAll('a[href^="#"]').forEach(function (a) { a.addEventListener('click', function (e) { var id = a.getAttribute('href'); if (id.length > 1 && document.querySelector(id)) { e.preventDefault(); lenis.scrollTo(id, { offset: -20 }); } }); });
    }
    if (reduce) return;
    gsap.to('.x-hero-in', { yPercent: -10, scale: .94, opacity: .3, ease: 'none', scrollTrigger: { trigger: '.x-hero', start: 'top top', end: 'bottom top', scrub: true } });
    var p = document.getElementById('x-words');
    if (p) { p.innerHTML = p.textContent.split(' ').map(function (w) { return '<span>' + w + '</span>'; }).join(' ');
      gsap.fromTo('#x-words span', { opacity: .14 }, { opacity: 1, stagger: .08, ease: 'none', scrollTrigger: { trigger: p, start: 'top 80%', end: 'bottom 45%', scrub: true } }); }
    // headings: line mask rise
    gsap.utils.toArray('.b-h,.x-band-h').forEach(function (h) { gsap.from(h, { yPercent: 40, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 88%' } }); });
    var m = document.getElementById('x-marq');
    if (m) { var xpos = 0; gsap.ticker.add(function () { var v = lenis ? lenis.velocity : 0; xpos -= .5 + Math.min(Math.abs(v) * .35, 14); var half = m.scrollWidth / 2; if (xpos <= -half) xpos += half; gsap.set(m, { x: xpos }); }); }
    var cards = gsap.utils.toArray('.x-card');
    cards.forEach(function (c, i) { var nx = cards[i + 1]; if (!nx) return; gsap.to(c, { scale: .93, yPercent: -2, rotate: i % 2 ? .6 : -.6, ease: 'none', scrollTrigger: { trigger: nx, start: 'top 85%', end: 'top 22%', scrub: true } }); });
    gsap.utils.toArray('.b-steps > div').forEach(function (d, i) { gsap.from(d, { y: 60, opacity: 0, duration: .9, delay: i * .08, ease: 'expo.out', scrollTrigger: { trigger: d, start: 'top 90%' } }); });
    gsap.utils.toArray('.b-qa details,.b-proof li').forEach(function (d, i) { gsap.from(d, { y: 24, opacity: 0, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: d, start: 'top 94%' } }); });
    addEventListener('load', function () { ScrollTrigger.refresh(); });
  }

  function boot() {
    var hc = document.getElementById('x-prisms'); if (hc) heroField = Field(hc, { pane: true });
    document.querySelectorAll('.x-field').forEach(function (c) { fields.push(Field(c, { pane: false })); });
    if (hc) hc.parentElement.addEventListener('click', function (e) { var r = hc.getBoundingClientRect(); heroField.burst(e.clientX - r.left, e.clientY - r.top); });
    clock(); ui(); scroll();
    if (html.classList.contains('pre')) playHello(heroIntro); else { html.classList.add('ready'); heroIntro(); }
  }
  var tries = 0;
  (function wait() { if ((window.gsap && window.ScrollTrigger && window.Lenis) || tries++ > 100) boot(); else setTimeout(wait, 50); })();
  setTimeout(function () { if (html.classList.contains('pre') && !playing) html.classList.remove('pre'); }, 12000);
})();
