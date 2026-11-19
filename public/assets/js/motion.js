/* motion.js: preloader, prisms, smooth scroll, scroll-driven type and cards. */
(function () {
  var html = document.documentElement, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var pre = document.getElementById('x-pre');
  function done() { html.classList.remove('pre'); html.classList.add('ready'); try { sessionStorage.setItem('hi', '1'); } catch (e) {} }

  /* ---------- preloader ---------- */
  function runPre(cb) {
    if (!pre || !html.classList.contains('pre') || reduce || !window.gsap) { done(); cb(); return; }
    var w = ['Hello', 'Bonjour', 'Bonzour', 'Marhaba', 'Hello'], el = document.getElementById('x-pre-w'), i = 0;
    var tl = gsap.timeline({ onComplete: function () { done(); pre.style.display = 'none'; cb(); } });
    w.forEach(function (t, k) { tl.call(function () { el.textContent = t; }, null, k * 0.42); });
    tl.to(el, { yPercent: -120, opacity: 0, duration: 0.5, ease: 'power3.in' }, w.length * 0.42);
    tl.to(pre, { yPercent: -100, duration: 0.9, ease: 'expo.inOut' }, '>-0.1');
  }

  /* ---------- prisms canvas ---------- */
  function prisms() {
    var c = document.getElementById('x-prisms'); if (!c) return;
    var x = c.getContext('2d'), W, H, dpr = Math.min(devicePixelRatio || 1, 1.5), mx = 0, my = 0, tx = 0, ty = 0, vis = true, S = [];
    function size() { W = c.clientWidth; H = c.clientHeight; c.width = W * dpr; c.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0); }
    size(); addEventListener('resize', size);
    var n = W < 700 ? 9 : 16;
    for (var i = 0; i < n; i++) S.push({ x: Math.random(), y: Math.random(), z: .3 + Math.random() * .9, r: 80 + Math.random() * 190, a: Math.random() * 6.28, b: Math.random() * 6.28, va: (Math.random() - .5) * .004, vb: (Math.random() - .5) * .004, k: Math.random() });
    function tri(s, ox, oy, sc, depth) {
      var R = s.r * s.z * sc, pts = [];
      for (var q = 0; q < 3; q++) {
        var ang = q * 2.094 + s.a, px = Math.cos(ang) * R, py = Math.sin(ang) * R;
        var pz = py * Math.sin(s.b); py = py * Math.cos(s.b);
        pts.push([ox + px, oy + py, pz]);
      }
      return pts;
    }
    function frame() {
      requestAnimationFrame(frame); if (!vis) return;
      mx += (tx - mx) * .05; my += (ty - my) * .05;
      x.clearRect(0, 0, W, H);
      S.forEach(function (s) {
        s.a += s.va; s.b += s.vb;
        var ox = s.x * W + mx * 60 * s.z, oy = s.y * H + my * 40 * s.z, d = 14 * s.z;
        var f = tri(s, ox, oy, 1), b = f.map(function (p) { return [p[0] + d, p[1] + d]; });
        var lit = .5 + .5 * Math.sin(s.b + s.a);
        x.beginPath(); x.moveTo(b[0][0], b[0][1]); x.lineTo(b[1][0], b[1][1]); x.lineTo(b[2][0], b[2][1]); x.closePath();
        x.fillStyle = 'rgba(40,6,0,' + (.18 + .12 * lit) + ')'; x.fill();
        x.beginPath(); x.moveTo(f[0][0], f[0][1]); x.lineTo(f[1][0], f[1][1]); x.lineTo(f[2][0], f[2][1]); x.closePath();
        var g = x.createLinearGradient(f[0][0], f[0][1], f[2][0], f[2][1]);
        g.addColorStop(0, 'rgba(255,255,255,' + (.10 + .30 * lit) + ')'); g.addColorStop(1, 'rgba(255,120,90,' + (.05 + .12 * (1 - lit)) + ')');
        x.fillStyle = g; x.fill(); x.strokeStyle = 'rgba(255,255,255,' + (.25 + .35 * lit) + ')'; x.lineWidth = 1.2; x.stroke();
      });
    }
    addEventListener('pointermove', function (e) { tx = e.clientX / innerWidth - .5; ty = e.clientY / innerHeight - .5; });
    new IntersectionObserver(function (e) { vis = e[0].isIntersecting; }).observe(c);
    if (reduce) { vis = true; frame(); vis = false; } else frame();
  }

  /* ---------- clock ---------- */
  function clock() {
    var el = document.getElementById('x-clock'); if (!el) return;
    function t() { var d = new Date(); el.textContent = 'Port Louis, ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Indian/Mauritius' }) + ' GMT+4'; }
    t(); setInterval(t, 20000);
  }

  /* ---------- scroll ---------- */
  function scroll() {
    if (!window.gsap || !window.ScrollTrigger) return; gsap.registerPlugin(ScrollTrigger);
    var lenis = null;
    if (window.Lenis && !reduce) {
      lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); }); gsap.ticker.lagSmoothing(0);
      document.querySelectorAll('a[href^="#"]').forEach(function (a) { a.addEventListener('click', function (e) { var id = a.getAttribute('href'); if (id.length > 1 && document.querySelector(id)) { e.preventDefault(); lenis.scrollTo(id, { offset: -70 }); } }); });
    }
    if (reduce) return;
    // hero intro
    gsap.set('.x-mega .ln i', { yPercent: 112, opacity: 1 }); gsap.to('.x-mega .ln i', { yPercent: 0, duration: 1.3, ease: 'expo.out', stagger: .12 });
    gsap.to('.x-tag,.x-hero-foot,.x-scroll', { opacity: 1, duration: 1, delay: .5 });
    // hero scrub
    gsap.to('.x-hero-in', { yPercent: -14, scale: .94, opacity: .35, ease: 'none', scrollTrigger: { trigger: '.x-hero', start: 'top top', end: 'bottom top', scrub: true } });
    // statement words
    var p = document.getElementById('x-words');
    if (p) { p.innerHTML = p.textContent.split(' ').map(function (w) { return '<span>' + w + '</span>'; }).join(' ');
      gsap.fromTo('#x-words span', { opacity: .14 }, { opacity: 1, stagger: .08, ease: 'none', scrollTrigger: { trigger: p, start: 'top 80%', end: 'bottom 45%', scrub: true } }); }
    // marquee, speed follows scroll
    var m = document.getElementById('x-marq');
    if (m) { var xpos = 0, dir = -1, base = .5; var half = function () { return m.scrollWidth / 2; };
      gsap.ticker.add(function () { var v = lenis ? lenis.velocity : 0; xpos += dir * (base + Math.min(Math.abs(v) * .35, 14)); if (xpos <= -half()) xpos += half(); gsap.set(m, { x: xpos }); }); }
    // stacked cards
    var cards = gsap.utils.toArray('.x-card');
    cards.forEach(function (c, i) { var nx = cards[i + 1]; if (!nx) return;
      gsap.to(c, { scale: .93, yPercent: -2, rotate: i % 2 ? .6 : -.6, ease: 'none', scrollTrigger: { trigger: nx, start: 'top 85%', end: 'top 22%', scrub: true } }); });
    // process numerals
    gsap.utils.toArray('.b-steps .n').forEach(function (n) { gsap.fromTo(n, { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, ease: 'none', scrollTrigger: { trigger: n, start: 'top 95%', end: 'top 65%', scrub: true } }); });
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  }

  function boot() { prisms(); clock(); runPre(scroll); }
  var tries = 0;
  (function wait() { if ((window.gsap && window.ScrollTrigger && window.Lenis) || tries++ > 100) boot(); else setTimeout(wait, 50); })();
  setTimeout(function () { if (html.classList.contains('pre')) { done(); if (pre) pre.style.display = 'none'; } }, 9000);
})();
