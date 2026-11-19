/* motion.js: greeting, particle world map, smooth scroll, scroll-driven type and cards. */
(function () {
  var html = document.documentElement, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var pre = document.getElementById('x-pre'), preLogo = document.getElementById('x-pre-logo'), preW = document.getElementById('x-pre-w');
  var lenis = null, fields = [], heroField = null, playing = false;
  var WORDS = [['Hello', 'en'], ['Bonjour', 'fr'], ['Bonzour', 'mfe'], ['مرحبا', 'ar']];

  /* ---------- particle fields: world map (hero) and drifting network (dark sections) ---------- */
  var HUBS = [[57.5, -20.2, 1], [55.3, 25.2], [46.7, 24.7], [36.8, -1.3], [3.4, 6.5], [28.0, -26.2], [31.2, 30.0], [-7.6, 33.6], [39.3, -6.8], [72.8, 19.0]];
  function Field(canvas, o) {
    o = o || {};
    var x = canvas.getContext('2d'), dpr = Math.min(devicePixelRatio || 1, 1.5), W = 0, H = 0, D = [], P = [], rings = [], vis = true, ptr = { x: -999, y: -999 }, map = !!o.map, last = performance.now(), clock = 0, t0 = -1, dots = null, hubs = [];
    function size() { W = canvas.clientWidth; H = canvas.clientHeight; canvas.width = W * dpr; canvas.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0); }
    function proj(lon, lat) { var sc = W < 700 ? W / 96 : Math.min(W * 1.25 / 360, H * 1.0 / 135); return [W / 2 + (lon - 22) * sc, H * (W < 700 ? .6 : .6) - (lat - 8) * sc, sc]; }
    function scatter(d) { var a = Math.random() * 6.28, r = 120 + Math.random() * Math.max(W, H) * .5; d.x = W / 2 + Math.cos(a) * r; d.y = H / 2 + Math.sin(a) * r * .7; d.vx = d.vy = 0; }
    function build() {
      D = []; P = []; hubs = [];
      if (map) {
        if (!dots) return;
        var m0 = proj(57.5, -20.2);
        dots.forEach(function (q) { var p = proj(q[0], q[1]); if (p[0] < -20 || p[0] > W + 20 || p[1] < -20 || p[1] > H + 20) return;
          var d = { hx: p[0], hy: p[1], x: 0, y: 0, vx: 0, vy: 0, mea: q[2], r: Math.max(1.1, p[2] * .3) * (q[2] ? 1.45 : 1), ph: Math.random() * 6.28, dl: Math.hypot(p[0] - m0[0], p[1] - m0[1]) / (W * 1.1) * 1.6 + Math.random() * .25 };
          scatter(d); D.push(d); });
        HUBS.forEach(function (h) { var p = proj(h[0], h[1]); hubs.push({ x: p[0], y: p[1], home: !!h[2], ph: Math.random() * 6.28 }); });
      } else {
        var n = Math.round(Math.min(110, W / 13));
        for (var i = 0; i < n; i++) P.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * 18, vy: (Math.random() - .5) * 18, r: .8 + Math.random() * 1.6 });
      }
    }
    function assemble() { t0 = clock; }
    function reset() { t0 = -1; D.forEach(scatter); rings = []; }
    function burst(ix, iy) { var R = 320; D.forEach(function (d) { var dx = d.x - ix, dy = d.y - iy, r = Math.sqrt(dx * dx + dy * dy) + 30; if (r < R) { var f = (1 - r / R) * 900; d.vx += dx / r * f; d.vy += dy / r * f; } }); P.forEach(function (p) { var dx = p.x - ix, dy = p.y - iy, r = Math.sqrt(dx * dx + dy * dy) + 30; if (r < R) { var f = (1 - r / R) * 500; p.vx += dx / r * f; p.vy += dy / r * f; } }); rings.push({ x: ix, y: iy, r: 0 }); }
    function impulse(v) { var k = Math.max(-60, Math.min(60, v)); D.forEach(function (d) { d.vy += k * (Math.random() * .8 + .2); }); P.forEach(function (p) { p.vy += k * .5; }); }
    function arcPt(a, b, t) { var cx = (a.x + b.x) / 2, cy = Math.min(a.y, b.y) - Math.hypot(a.x - b.x, a.y - b.y) * .28; return [(1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * cx + t * t * b.x, (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * cy + t * t * b.y]; }
    function frame(now) {
      requestAnimationFrame(frame); if (!vis) { last = now; return; }
      var dt = Math.min(.04, (now - last) / 1000); last = now; clock += dt;
      x.clearRect(0, 0, W, H);
      if (map) {
        var R = W < 700 ? 80 : 125, R2 = R * R, since = t0 < 0 ? -1 : clock - t0, damp = Math.pow(.012, dt), i, d;
        x.fillStyle = 'rgba(255,255,255,.46)';
        for (i = 0; i < D.length; i++) { d = D[i];
          if (since >= d.dl) { d.vx += (d.hx - d.x) * 16 * dt; d.vy += (d.hy - d.y) * 16 * dt; } else { d.vx *= .98; d.vy *= .98; }
          var dx = d.x - ptr.x, dy = d.y - ptr.y, q = dx * dx + dy * dy; if (q < R2) { var r = Math.sqrt(q) + 1, f = (1 - r / R) * 1500 * dt; d.vx += dx / r * f; d.vy += dy / r * f; }
          d.vx *= damp; d.vy *= damp; d.x += d.vx * dt; d.y += d.vy * dt;
          if (!d.mea) x.fillRect(d.x - d.r / 2, d.y - d.r / 2, d.r, d.r); }
        for (i = 0; i < D.length; i++) { d = D[i]; if (!d.mea) continue; var tw = .62 + .38 * Math.sin(clock * 1.7 + d.ph); x.fillStyle = 'rgba(205,224,255,' + (.55 + .4 * tw) + ')'; x.beginPath(); x.arc(d.x, d.y, d.r * (.8 + .35 * tw), 0, 6.28); x.fill(); }
        if (since > 2.4 && hubs.length) {
          var home = hubs[0], appear = Math.min(1, (since - 2.4) / 1.2);
          for (i = 1; i < hubs.length; i++) { var h = hubs[i]; x.strokeStyle = 'rgba(255,255,255,' + .22 * appear + ')'; x.lineWidth = 1; x.beginPath(); var cx = (home.x + h.x) / 2, cy = Math.min(home.y, h.y) - Math.hypot(home.x - h.x, home.y - h.y) * .28; x.moveTo(home.x, home.y); x.quadraticCurveTo(cx, cy, h.x, h.y); x.stroke();
            var tt = ((clock * .22 + i * .137) % 1), pp = arcPt(home, h, tt); x.fillStyle = 'rgba(255,255,255,' + appear + ')'; x.beginPath(); x.arc(pp[0], pp[1], 2.2, 0, 6.28); x.fill();
            var pulse = (clock * .5 + h.ph) % 1; x.strokeStyle = 'rgba(255,255,255,' + (1 - pulse) * .5 * appear + ')'; x.beginPath(); x.arc(h.x, h.y, 4 + pulse * 16, 0, 6.28); x.stroke();
            x.fillStyle = '#fff'; x.beginPath(); x.arc(h.x, h.y, 3.2, 0, 6.28); x.fill(); }
          var pu = (clock * .45) % 1; x.strokeStyle = 'rgba(255,255,255,' + (1 - pu) * .7 * appear + ')'; x.lineWidth = 1.4; x.beginPath(); x.arc(home.x, home.y, 6 + pu * 34, 0, 6.28); x.stroke();
          x.fillStyle = '#fff'; x.beginPath(); x.arc(home.x, home.y, 5, 0, 6.28); x.fill(); x.strokeStyle = 'rgba(255,255,255,.9)'; x.lineWidth = 1.4; x.beginPath(); x.arc(home.x, home.y, 9, 0, 6.28); x.stroke();
        }
      } else {
        var j, p2, k, L = 120;
        for (j = 0; j < P.length; j++) { p2 = P[j]; p2.x += p2.vx * dt; p2.y += p2.vy * dt;
          var ex = p2.x - ptr.x, ey = p2.y - ptr.y, e2 = ex * ex + ey * ey; if (e2 < 19600) { var er = Math.sqrt(e2) + 1; p2.vx += ex / er * 320 * dt; p2.vy += ey / er * 320 * dt; }
          p2.vx *= .985; p2.vy *= .985; p2.vx += (Math.random() - .5) * 14 * dt; p2.vy += (Math.random() - .5) * 14 * dt;
          if (p2.x < 0) p2.x += W; if (p2.x > W) p2.x -= W; if (p2.y < 0) p2.y += H; if (p2.y > H) p2.y -= H; }
        x.lineWidth = 1;
        for (j = 0; j < P.length; j++) { var a = P[j]; for (k = j + 1; k < P.length; k++) { var b = P[k], ddx = a.x - b.x, ddy = a.y - b.y, dd = ddx * ddx + ddy * ddy; if (dd < L * L) { x.strokeStyle = 'rgba(141,160,255,' + (1 - Math.sqrt(dd) / L) * .38 + ')'; x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke(); } }
          var px = a.x - ptr.x, py = a.y - ptr.y, pd = Math.sqrt(px * px + py * py); if (pd < 170) { x.strokeStyle = 'rgba(255,255,255,' + (1 - pd / 170) * .6 + ')'; x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(ptr.x, ptr.y); x.stroke(); }
          x.fillStyle = 'rgba(190,205,255,.9)'; x.beginPath(); x.arc(a.x, a.y, a.r, 0, 6.28); x.fill(); }
      }
      rings = rings.filter(function (g) { g.r += dt * 520; if (g.r > 360) return false; x.strokeStyle = 'rgba(255,255,255,' + (1 - g.r / 360) * .5 + ')'; x.lineWidth = 1.5; x.beginPath(); x.arc(g.x, g.y, g.r, 0, 6.28); x.stroke(); return true; });
    }
    size(); build();
    if (map) fetch('/assets/data/world-dots.json').then(function (r) { return r.json(); }).then(function (j) { dots = j; build(); if (reduce || t0 >= 0 || o.autostart) { /* keep state */ } if (reduce) { D.forEach(function (d) { d.x = d.hx; d.y = d.hy; }); t0 = -9; clock = 9; vis = true; requestAnimationFrame(function (n) { last = n; frame(n); vis = false; }); } }).catch(function () {});
    var rt; addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { var was = t0 >= 0; size(); build(); if (was) t0 = clock - 6; }, 200); });
    var host = canvas.parentElement;
    host.addEventListener('pointermove', function (e) { var r = canvas.getBoundingClientRect(); ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top; });
    host.addEventListener('pointerdown', function (e) { var r = canvas.getBoundingClientRect(); ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top; });
    host.addEventListener('pointerleave', function () { ptr.x = ptr.y = -999; });
    new IntersectionObserver(function (e) { vis = e[0].isIntersecting; }).observe(canvas);
    if (!reduce) requestAnimationFrame(frame);
    return { assemble: assemble, reset: reset, burst: burst, impulse: impulse, size: function () { return [W, H]; } };
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
    if (heroField) setTimeout(function () { heroField.assemble(); }, 350);
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
    var ly = scrollY;
    function dir() { var y = scrollY, dy = y - ly; if (nav) { if (y < 120 || dy < -4) nav.classList.remove('away'); else if (dy > 4) nav.classList.add('away'); } if (Math.abs(dy) > 4) ly = y; }
    addEventListener('scroll', function () { tick(); dir(); }, { passive: true }); tick();
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
    var hc = document.getElementById('x-prisms'); if (hc) heroField = Field(hc, { map: true });
    document.querySelectorAll('.x-field').forEach(function (c) { fields.push(Field(c, {})); });
    if (hc) hc.parentElement.addEventListener('click', function (e) { var r = hc.getBoundingClientRect(); heroField.burst(e.clientX - r.left, e.clientY - r.top); });
    clock(); ui(); scroll();
    if (html.classList.contains('pre')) playHello(heroIntro); else { html.classList.add('ready'); heroIntro(); }
  }
  var tries = 0;
  (function wait() { if ((window.gsap && window.ScrollTrigger && window.Lenis) || tries++ > 100) boot(); else setTimeout(wait, 50); })();
  setTimeout(function () { if (html.classList.contains('pre') && !playing) html.classList.remove('pre'); }, 12000);
})();
