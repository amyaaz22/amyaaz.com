/* codex.js : the room, the book, the ink. */
(function () {
  'use strict';
  var html = document.documentElement, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var el = function (cls, tag) { var e = document.createElement(tag || 'div'); if (cls) e.className = cls; return e; };
  var rnd = function (a, b) { return a + Math.random() * (b - a); };
  var src = $('#cdx-src');
  if (!src) return; // other pages use plain markup

  var MARK = 'M 77.476 71.750 C 65.521 95.263, 49.910 125.862, 42.786 139.750 L 29.833 165 44.908 165 L 59.983 165 65.500 154 C 68.534 147.950, 71.476 143, 72.038 143 C 73.792 143, 114.484 136.841, 114.802 136.528 C 115.214 136.121, 104.636 130.294, 92.257 124.107 L 82.013 118.988 90.743 101.494 C 95.545 91.872, 99.746 84, 100.078 84 C 100.411 84, 103.639 90.188, 107.252 97.750 C 110.865 105.313, 119.774 123.537, 127.051 138.250 L 140.281 165 155.222 165 L 170.164 165 155.709 136.750 C 147.759 121.213, 132.160 90.613, 121.044 68.750 C 109.928 46.887, 100.468 29, 100.023 29 C 99.577 29, 89.431 48.237, 77.476 71.750';
  var WORDS = [['Hello', 'en'], ['Bonjour', 'fr'], ['Bonzour', 'mfe'], ['مرحبا', 'ar']];
  // tab id, label, spread (double page), page (single page)
  var TABS = [
    ['draw', 'Draw', 0, 1], ['services', 'Services', 1, 2], ['process', 'Process', 2, 4], ['regions', 'Map', 3, 7],
    ['about', 'About', 4, 8], ['faq', 'FAQ', 5, 11], ['articles', 'Articles', 6, 12], ['contact', 'Contact', 7, 14]
  ];
  var ALIAS = { recognition: 'faq', credential: 'faq', top: 'draw', hero: 'draw' };
  var NCOL = ['#e6cd7a', '#e0a396', '#a8c39a', '#9ebad2', '#d9b0cf', '#e6cd7a', '#e0a396', '#a8c39a'];
  var NROT = [-2.5, 1.8, -1.2, 2.6, -2, 1.2, -2.8, 2];

  var S = { single: false, pos: -1, max: 7, leaves: [], pw: 0, ph: 0, snd: false, ready: false, torn: false };
  var stage, book, fx, notesEl, PG = [], cardEls = [], hasGsap = false;

  /* ------------------------------------------------------------------ sound */
  var AC = null;
  function ac() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } } if (AC && AC.state === 'suspended') AC.resume(); return AC; }
  function noiseBuf(c, dur) { var n = Math.floor(c.sampleRate * dur), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0); for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; return b; }
  function sfx(kind) {
    if (!S.snd) return; var c = ac(); if (!c) return; var t = c.currentTime, o, f, g;
    if (kind === 'page' || kind === 'rip') {
      o = c.createBufferSource(); o.buffer = noiseBuf(c, kind === 'rip' ? .7 : .5); f = c.createBiquadFilter(); g = c.createGain();
      if (kind === 'page') { f.type = 'bandpass'; f.frequency.setValueAtTime(1500, t); f.frequency.exponentialRampToValueAtTime(5200, t + .42); f.Q.value = .7; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.16, t + .09); g.gain.exponentialRampToValueAtTime(.001, t + .46); }
      else { f.type = 'highpass'; f.frequency.value = 1400; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.28, t + .04); g.gain.setValueAtTime(.28, t + .3); g.gain.exponentialRampToValueAtTime(.001, t + .68); }
      o.connect(f); f.connect(g); g.connect(c.destination); o.start(t);
    } else if (kind === 'splash' || kind === 'stamp') {
      o = c.createOscillator(); g = c.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(kind === 'splash' ? 120 : 80, t); o.frequency.exponentialRampToValueAtTime(40, t + .25); g.gain.setValueAtTime(.4, t); g.gain.exponentialRampToValueAtTime(.001, t + .3); o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + .32);
      if (kind === 'splash') { var n = c.createBufferSource(); n.buffer = noiseBuf(c, .5); var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; var g2 = c.createGain(); g2.gain.setValueAtTime(.3, t); g2.gain.exponentialRampToValueAtTime(.001, t + .5); n.connect(lp); lp.connect(g2); g2.connect(c.destination); n.start(t); }
    }
  }
  function sndButton() {
    var b = $('#snd-toggle'); if (!b) return;
    try { S.snd = localStorage.getItem('cdx-snd') === '1'; } catch (e) { }
    b.setAttribute('aria-pressed', S.snd ? 'true' : 'false');
    b.addEventListener('click', function () { S.snd = !S.snd; b.setAttribute('aria-pressed', S.snd ? 'true' : 'false'); try { localStorage.setItem('cdx-snd', S.snd ? '1' : '0'); } catch (e) { } if (S.snd) { ac(); sfx('page'); } });
  }

  /* ------------------------------------------------------------------ layout */
  function measure() {
    var w = innerWidth, h = innerHeight, single = w < 820 || h < 500 || w / h < 1.0, pw, ph;
    if (single) {
      var pw0 = Math.min(w - 30, 520); ph = Math.min(h - 170, Math.round(pw0 * 1.55)); pw = Math.min(pw0, Math.round(ph * .74));
    } else {
      var ph0 = h * .8; pw = Math.min(ph0 * .72, (w - 270) / 2, 600); ph = pw / .72;
    }
    return { single: single, pw: Math.round(pw), ph: Math.round(ph) };
  }
  function applySize(m) { S.pw = m.pw; S.ph = m.ph; stage.style.setProperty('--pw', m.pw + 'px'); stage.style.setProperty('--ph', m.ph + 'px'); }

  /* ------------------------------------------------------------------ room */
  function watchSVG() {
    var num = '', r = 49, i, a, rom = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
    for (i = 0; i < 12; i++) { a = i * Math.PI / 6; num += '<text x="' + (80 + Math.sin(a) * r).toFixed(1) + '" y="' + (108 - Math.cos(a) * r + 3).toFixed(1) + '" text-anchor="middle" font-size="9" font-family="IM Fell English,serif" fill="#2b1d11">' + rom[i] + '</text>'; }
    return '<svg viewBox="0 0 160 190" aria-hidden="true"><defs><radialGradient id="brs" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#f0d98f"/><stop offset=".55" stop-color="#b08d3e"/><stop offset="1" stop-color="#6e5320"/></radialGradient></defs>' +
      '<circle cx="80" cy="22" r="13" fill="none" stroke="url(#brs)" stroke-width="5"/><rect x="71" y="26" width="18" height="16" rx="3" fill="url(#brs)"/>' +
      '<circle cx="80" cy="108" r="72" fill="url(#brs)"/><circle cx="80" cy="108" r="63" fill="#6e5320"/><circle cx="80" cy="108" r="61" fill="#efe3c4"/><circle cx="80" cy="108" r="61" fill="none" stroke="rgba(90,60,20,.35)" stroke-width="2"/>' +
      num + '<text x="80" y="136" text-anchor="middle" font-size="6.5" font-family="Special Elite,monospace" letter-spacing="1" fill="#7b2326">PORT LOUIS</text>' +
      '<line id="wh" x1="80" y1="108" x2="80" y2="82" stroke="#2b1d11" stroke-width="3" stroke-linecap="round"/><line id="wm" x1="80" y1="108" x2="80" y2="66" stroke="#2b1d11" stroke-width="2" stroke-linecap="round"/><line id="ws" x1="80" y1="116" x2="80" y2="62" stroke="#7b2326" stroke-width="1"/><circle cx="80" cy="108" r="3.5" fill="#7b2326"/></svg>';
  }
  function inkwellSVG() {
    return '<svg viewBox="0 0 200 230" aria-hidden="true"><defs><linearGradient id="gl" x1="0" x2="1"><stop offset="0" stop-color="#3c342c"/><stop offset=".35" stop-color="#17120e"/><stop offset="1" stop-color="#0a0806"/></linearGradient></defs>' +
      '<path d="M124 8C158 40 178 96 130 158C122 120 108 62 124 8Z" fill="#ece2c8" stroke="#8a7a58" stroke-width="1.5"/><path d="M124 8C132 50 134 110 130 158" stroke="#8a7a58" fill="none" stroke-width="1.6"/><path d="M127 40l22 10M128 62l30 6M129 84l28 10M130 108l20 8" stroke="#b9ab88" stroke-width="1"/><path d="M130 158L100 198" stroke="#8a7a58" stroke-width="3.5" stroke-linecap="round"/>' +
      '<ellipse cx="86" cy="206" rx="64" ry="14" fill="rgba(0,0,0,.35)"/><path d="M34 130c-10 52 6 72 18 78h68c12-6 28-26 18-78z" fill="url(#gl)"/><path d="M46 140c-4 30 0 48 8 58" stroke="rgba(255,255,255,.28)" stroke-width="4" fill="none" stroke-linecap="round"/>' +
      '<rect x="56" y="104" width="60" height="30" rx="5" fill="#4a3320"/><ellipse cx="86" cy="104" rx="30" ry="7" fill="#2a1c10"/></svg>';
  }
  function buildStage() {
    stage = el('stage closed'); stage.id = 'stage';
    stage.innerHTML =
      '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><filter id="inkrough"><feTurbulence type="fractalNoise" baseFrequency=".03" numOctaves="3" seed="4"/><feDisplacementMap in="SourceGraphic" scale="22"/></filter><filter id="rough"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="9"/><feDisplacementMap in="SourceGraphic" scale="2.4"/></filter></defs></svg>' +
      '<div class="desk"></div><div class="desk-obj obj-ink">' + inkwellSVG() + '</div><div class="desk-obj obj-watch">' + watchSVG() + '</div>' +
      '<div class="book-shadow"></div><div class="book-tilt"><div class="book" id="book"></div></div>' +
      '<div class="lt lt-sun"><div class="sun-wash"></div><div class="sun-beams"><i></i><i></i><i></i><i></i></div><div class="sun-panes"></div></div>' +
      '<div class="lt lt-candle"><div class="candle-dim"></div><div class="candle-core"></div><div class="candle-glow"></div></div><canvas class="motes"></canvas>';
    $('#main').appendChild(stage);
    book = $('#book', stage);
  }

  /* ------------------------------------------------------------------ book */
  function gather() {
    $$('.pg', stage).forEach(function (p) { src.appendChild(p); });
    PG = []; $$('.pg', src).forEach(function (p) { PG[+p.getAttribute('data-f')] = p; });
  }
  function face(cls, page) { var f = el('face ' + cls); if (page) f.appendChild(page); f.appendChild(el('shade')); return f; }
  function coverFace() {
    var f = el('face front leather'), c = el('cover');
    c.innerHTML = '<span class="ridges"></span><svg class="mark" viewBox="0 0 200 200" aria-hidden="true"><path fill-rule="evenodd" d="' + MARK + '"/></svg><span class="c-year">MMXXVI</span><span class="c-title">The Book<br>of Systems</span><span class="c-by">Amyaaz Aumeer</span><span class="c-place">Port Louis, Mauritius</span><span class="c-open">Open</span><i class="corner c1"></i><i class="corner c2"></i>';
    c.addEventListener('click', function () { if (S.pos < 0) go(0); });
    f.appendChild(c); f.appendChild(el('shade')); return f;
  }
  function buildBook() {
    gather(); book.innerHTML = '';
    var n = S.single ? 17 : 9; S.max = n - 2; S.leaves = [];
    book.appendChild(el('board-r')); book.appendChild(el('stack stack-l')); book.appendChild(el('stack stack-r'));
    for (var k = 0; k < n; k++) {
      var leaf = el('leaf leaf' + k), fr, bk;
      if (k === 0) {
        fr = coverFace(); bk = el('face back leather'); var pi = el('paper-in paper'); if (!S.single && PG[0]) pi.appendChild(PG[0]); bk.appendChild(pi); bk.appendChild(el('shade'));
        if (!S.single) { pi.style.background = 'none'; pi.className = 'paper-in'; var pf = el('face paper'); pf.style.cssText = 'top:9px;bottom:9px;left:9px;right:0;'; pf.appendChild(PG[0]); pf.appendChild(el('shade')); bk.innerHTML = ''; bk.appendChild(pf); bk.appendChild(el('shade')); }
      } else {
        var fi = S.single ? k - 1 : 2 * k - 1, bi = S.single ? -1 : 2 * k;
        fr = face('front paper', PG[fi]);
        bk = (bi >= 0 && PG[bi]) ? face('back paper', PG[bi]) : (S.single ? face('back paper') : null);
      }
      leaf.appendChild(fr); if (bk) leaf.appendChild(bk); book.appendChild(leaf);
      S.leaves.push({ el: leaf, k: k, a: 0, flipped: false, tw: null, moving: false });
    }
    book.appendChild(el('spine'));
    var er = el('edge edge-r'), elf = el('edge edge-l'); book.appendChild(er); book.appendChild(elf);
    er.addEventListener('click', function () { go(S.pos + 1); }); elf.addEventListener('click', function () { go(S.pos - 1); });
    er.addEventListener('pointerenter', function () { peek(1); }); er.addEventListener('pointerleave', function () { peek(0); });
    elf.addEventListener('pointerenter', function () { peek(-1); }); elf.addEventListener('pointerleave', function () { peek(0); });
    fx = el('fx'); fx.id = 'fx'; book.appendChild(fx);
    buildNotes();
    S.leaves.forEach(apply);
  }
  function buildNotes() {
    if (notesEl && notesEl.parentNode) notesEl.parentNode.removeChild(notesEl);
    notesEl = el('notes', 'div'); notesEl.setAttribute('role', 'navigation'); notesEl.setAttribute('aria-label', 'Sections');
    TABS.forEach(function (t, i) {
      var b = el('note', 'button'); b.type = 'button'; b.textContent = t[1]; b.setAttribute('data-tab', t[0]);
      b.style.setProperty('--nc', NCOL[i]); b.style.setProperty('--rot', NROT[i] + 'deg'); b.style.transitionDelay = (i * 60) + 'ms';
      if (!S.single) b.style.top = Math.round(S.ph * (.06 + i * .108)) + 'px';
      b.addEventListener('click', function () { go(target(t)); sfx('page'); });
      notesEl.appendChild(b);
    });
    (S.single ? stage : book).appendChild(notesEl);
  }
  function target(t) { return S.single ? t[3] : t[2]; }
  function tabIndexForPos(p) { var idx = 0; TABS.forEach(function (t, i) { if (target(t) <= p) idx = i; }); return idx; }

  function apply(l) {
    var a = l.a; l.el.style.transform = 'perspective(2600px) rotateY(' + a.toFixed(2) + 'deg)';
    l.el.style.setProperty('--sh', (Math.sin(Math.abs(a) * Math.PI / 180) * .9).toFixed(3));
    if (!l.moving) l.el.style.zIndex = a <= -90 ? (l.k + 1) : (S.leaves.length - l.k);
  }
  function turn(l, to, dur, delay, done) {
    if (l.tw) l.tw.kill();
    if (!hasGsap || reduce || S.instant) { l.a = to; l.moving = false; apply(l); done && done(); return; }
    l.moving = true; l.el.style.visibility = 'visible'; l.el.style.zIndex = 900;
    l.tw = gsap.to(l, { a: to, duration: dur, delay: delay, ease: 'power2.inOut', onStart: function () { sfx('page'); }, onUpdate: function () { apply(l); }, onComplete: function () { l.moving = false; l.tw = null; apply(l); done && done(); } });
  }
  function peek(dir) {
    if (S.busy) return; var l;
    if (dir === 1) l = S.leaves[S.pos + 1]; else if (dir === -1) l = S.leaves[S.pos]; else l = null;
    if (!dir) { S.leaves.forEach(function (x) { if (x.peeking) { x.peeking = false; if (!x.moving || x.peekTw) turn(x, x.flipped ? -180 : 0, .35, 0); } }); return; }
    if (!l || (S.pos + 1 > S.max && dir === 1)) return; l.peeking = true;
    if (!hasGsap || reduce) return; if (l.tw) l.tw.kill(); l.moving = true; l.el.style.zIndex = 900;
    l.tw = gsap.to(l, { a: dir === 1 ? -9 : -171, duration: .35, ease: 'power2.out', onUpdate: function () { apply(l); }, onComplete: function () { l.moving = false; l.tw = null; } });
  }
  function settle() {
    S.leaves.forEach(function (l) {
      if (l.moving) return;
      var keep = S.single ? (l.k === S.pos + 1 || l.k === S.pos || l.k === S.pos + 2) : (l.k === S.pos || l.k === S.pos + 1 || l.k === S.pos - 0);
      l.el.style.visibility = (keep || l.k === 0 && S.pos < 1) ? 'visible' : 'hidden';
      if (S.single && l.flipped && l.k !== S.pos) l.el.style.visibility = 'hidden';
      apply(l);
    });
  }
  function stacks() {
    var r = Math.min(6, Math.max(0, S.max - S.pos - 1)), l = Math.min(6, Math.max(0, S.pos)), sr = [], sl = [];
    for (var i = 1; i <= r; i++) sr.push((i * 1.3).toFixed(1) + 'px ' + (i * 1.2).toFixed(1) + 'px 0 ' + (i % 2 ? '#cbb98f' : '#b8a479'));
    for (i = 1; i <= l; i++) sl.push((-i * 1.3).toFixed(1) + 'px ' + (i * 1.2).toFixed(1) + 'px 0 ' + (i % 2 ? '#cbb98f' : '#b8a479'));
    var a = $('.stack-r', book), b = $('.stack-l', book); if (a) a.style.boxShadow = sr.join(','); if (b) b.style.boxShadow = sl.join(',');
  }
  var arriveT = null;
  function go(pos, instant) {
    pos = Math.max(-1, Math.min(S.max, pos)); if (pos === S.pos && !instant) return;
    var from = S.pos, fwd = pos > from; S.pos = pos; S.instant = !!instant;
    var ch = []; S.leaves.forEach(function (l) { var want = l.k <= pos && l.k <= S.max; if (instant || want !== l.flipped || l.peeking) ch.push([l, want]); });
    if (!fwd) ch.reverse();
    var n = ch.length, gap = n > 1 ? Math.min(.13, .9 / n) : 0, dur = n > 1 ? .72 : 1.0, total = 0;
    ch.forEach(function (c, i) { var l = c[0]; l.flipped = c[1]; l.peeking = false; turn(l, c[1] ? -180 : 0, dur, i * gap); total = (i * gap + dur); });
    stage.classList.toggle('closed', pos < 0); stage.classList.toggle('single', S.single);
    var edr = $('.edge-r', book), edl = $('.edge-l', book); if (edr) edr.classList.toggle('on', pos >= 0 && pos < S.max); if (edl) edl.classList.toggle('on', pos >= 0);
    stacks();
    var ti = tabIndexForPos(pos); $$('.note', stage).forEach(function (b, i) { b.classList.toggle('on', pos >= 0); b.setAttribute('aria-current', pos >= 0 && i === ti ? 'true' : 'false'); });
    var logo = $('#logo-btn'); if (logo) logo.classList.toggle('away', false);
    if (pos >= 0 && !instant) { try { history.replaceState(null, '', '#' + TABS[ti][0]); } catch (e) { } }
    leave(from); clearTimeout(arriveT);
    arriveT = setTimeout(function () { settle(); arrive(pos); }, instant ? 0 : Math.max(300, total * 1000 * .62));
    if (!instant) setTimeout(settle, total * 1000 + 80);
    else settle();
  }
  window.__cdxGo = go;

  /* ------------------------------------------------------------------ effects on arrival */
  function visible(f) { return S.single ? f === S.pos : (S.pos >= 0 && (f === 2 * S.pos || f === 2 * S.pos + 1)); }
  function pageX(f) { return S.single ? 0 : (f % 2 ? S.pw : 0); }
  function arrive(pos) {
    if (pos !== S.pos) return;
    if (S.single ? (pos === 2 || pos === 3) : pos === 1) cardsThrow();
    if (visible(5)) vellum();
    if (visible(8) || (!S.single && visible(9))) tear();
  }
  function leave(from) {
    if (from < 0) return;
    var wasCards = S.single ? (from === 2 || from === 3) : from === 1, nowCards = S.single ? (S.pos === 2 || S.pos === 3) : S.pos === 1;
    if (wasCards && (!nowCards || S.single)) cardsHide();
    if ((S.single ? from === 5 : from === 2) && !visible(5)) vellumReset();
  }

  /* services: cards thrown by the wind */
  var CPOS = { d: [[.05, .50, -6], [.25, .57, 4], [.455, .47, -3], [.63, .13, 5], [.79, .30, -4], [.55, .55, 3]], s: [[.03, .33, -4], [.5, .31, 4], [.25, .63, -2]] };
  function cardsInit() {
    var host = $('#cards-src'); if (!host) return;
    cardEls = $$('.pcard', host);
    cardEls.forEach(function (c, i) {
      c.style.setProperty('--tape', (i % 2 ? 4 : -4) + 'deg');
      c.addEventListener('pointerenter', function () { if (!hasGsap || !c.classList.contains('show')) return; c.style.zIndex = 5; gsap.to(c, { rotation: 0, scale: 1.08, duration: .3, ease: 'power2.out', overwrite: 'auto' }); });
      c.addEventListener('pointerleave', function () { if (!hasGsap || !c.classList.contains('show')) return; gsap.to(c, { rotation: +c.dataset.r, scale: 1, duration: .4, ease: 'power2.out', overwrite: 'auto', onComplete: function () { c.style.zIndex = ''; } }); });
    });
  }
  function cardHome(c, i) {
    var single = S.single, k = single ? (i % 3) : i, P = (single ? CPOS.s : CPOS.d)[k]; if (!P) P = [.1, .5, 0];
    var bw = single ? S.pw : S.pw * 2, bh = S.ph; return { x: P[0] * bw, y: P[1] * bh, r: P[2] };
  }
  function cardsPlace() { cardEls.forEach(function (c, i) { if (!fx) return; if (c.parentNode !== fx) fx.appendChild(c); var h = cardHome(c, i); c.dataset.r = h.r; c.dataset.x = h.x; c.dataset.y = h.y; if (hasGsap) gsap.set(c, { x: h.x, y: h.y, rotation: h.r, scale: 1 }); }); }
  function cardsThrow() {
    if (!fx) return; var list = cardEls.filter(function (c) { return S.single ? +c.dataset.pg === S.pos : true; });
    cardEls.forEach(function (c) { if (list.indexOf(c) < 0) { c.classList.remove('show'); } });
    if (!hasGsap || reduce) { list.forEach(function (c) { c.classList.add('show'); gsap && gsap.set(c, { opacity: 1 }); }); return; }
    gust();
    list.forEach(function (c, i) {
      var x = +c.dataset.x, y = +c.dataset.y, r = +c.dataset.r; gsap.killTweensOf(c); c.classList.add('show');
      gsap.fromTo(c, { x: x + (S.single ? S.pw : S.pw * 1.6) + rnd(0, 200), rotation: r + rnd(220, 420) * (Math.random() < .5 ? 1 : -1), scale: .55, opacity: 0 }, { x: x, rotation: r, scale: 1, opacity: 1, duration: 1.4 + rnd(0, .4), delay: .08 + i * .11, ease: 'power3.out', overwrite: 'auto' });
      gsap.fromTo(c, { y: y - S.ph * rnd(.25, .6) }, { y: y, duration: 1.2 + rnd(0, .4), delay: .08 + i * .11, ease: 'bounce.out', overwrite: false });
    });
  }
  function cardsHide() { cardEls.forEach(function (c) { if (!hasGsap) { c.classList.remove('show'); return; } gsap.to(c, { opacity: 0, duration: .25, overwrite: 'auto', onComplete: function () { c.classList.remove('show'); } }); }); }
  function gust() {
    if (!hasGsap) return; sfx('page');
    for (var i = 0; i < 7; i++) { var g = el('gust'); g.style.top = rnd(S.ph * .05, S.ph * .95) + 'px'; g.style.width = rnd(14, 34) + 'vw'; fx.appendChild(g);
      gsap.fromTo(g, { x: S.pw * 2.2, opacity: 0 }, { x: -S.pw * 1.2, opacity: 1, duration: rnd(.7, 1.1), delay: i * .05, ease: 'power1.inOut', onComplete: (function (gg) { return function () { gg.remove(); }; })(g) }); gsap.to(g, { opacity: 0, duration: .3, delay: i * .05 + .5 }); }
  }

  /* process: a drop of ink reveals the vellum */
  var vtl = null, vdrop = null;
  function vellumReset() {
    if (vtl) { vtl.kill(); vtl = null; } if (vdrop) { vdrop.remove(); vdrop = null; }
    var v = $('.vellum-in', stage), st = $('.pg-vellum .stain', stage); if (v) v.style.setProperty('--r', '0px'); if (st && hasGsap) gsap.set(st, { opacity: 0 });
  }
  function vellum() {
    var v = $('.vellum-in', stage), st = $('.pg-vellum .stain', stage); if (!v) return;
    if (!hasGsap || reduce) { v.style.setProperty('--r', '2000px'); if (st) st.style.opacity = .4; return; }
    vellumReset(); var ox = .54, oy = .40, x0 = pageX(5), d = el('inkdrop'); d.innerHTML = '<svg viewBox="0 0 34 52"><path d="M17 0C17 0 4 22 4 33a13 13 0 0 0 26 0C30 22 17 0 17 0Z"/></svg>';
    d.style.left = (x0 + ox * S.pw) + 'px'; d.style.top = '0px'; fx.appendChild(d); vdrop = d; var o = { r: 0 };
    gsap.set(st, { opacity: 0, scale: .3, transformOrigin: '54% 40%' });
    vtl = gsap.timeline();
    vtl.fromTo(d, { y: -60, scaleY: .9 }, { y: oy * S.ph, scaleY: 1.5, duration: .75, ease: 'power2.in' })
      .add(function () { sfx('splash'); })
      .to(d, { scale: 0, opacity: 0, duration: .12 }, '>-0.02')
      .to(st, { opacity: 1, scale: 1, duration: .55, ease: 'power3.out' }, '<')
      .to(o, { r: S.ph * 1.25, duration: 1.9, ease: 'power2.out', onUpdate: function () { v.style.setProperty('--r', o.r + 'px'); } }, '<+0.08')
      .to(st, { opacity: .42, duration: 1.4 }, '>-0.8');
  }

  /* about: the sheet tears and shows what is under it */
  function tear() {
    if (S.torn || !fx) return; S.torn = true;
    var vert = !S.single, N = 15, pts = [], i, j, t, W = vert ? S.pw * 2 : S.pw, H = S.ph;
    for (i = 0; i <= N; i++) { t = i / N * 100; j = (i === 0 || i === N) ? 0 : rnd(-2.6, 2.6); pts.push(vert ? [50 + j, t] : [t, 50 + j]); }
    function poly(a) { return 'polygon(' + a.map(function (p) { return p[0].toFixed(2) + '% ' + p[1].toFixed(2) + '%'; }).join(',') + ')'; }
    var A, B, rev = pts.slice().reverse();
    if (vert) { A = [[0, 0]].concat(pts, [[0, 100]]); B = [[100, 0]].concat(pts, [[100, 100]]); } else { A = [[0, 0], [100, 0]].concat(rev); B = [[0, 100], [100, 100]].concat(rev); }
    var sheet = el('tear'), h1 = el('half l'), h2 = el('half r'); sheet.style.width = W + 'px'; sheet.style.height = H + 'px';
    h1.innerHTML = '<i style="clip-path:' + poly(A) + '"></i>'; h2.innerHTML = '<i style="clip-path:' + poly(B) + '"></i>';
    var tz = el('tz'); tz.innerHTML = '<b>Who writes all this?</b><span>one moment</span>';
    sheet.appendChild(h1); sheet.appendChild(h2); sheet.appendChild(tz); fx.appendChild(sheet);
    if (!hasGsap || reduce) { sheet.remove(); return; }
    var tl = gsap.timeline({ delay: .5, onComplete: function () { sheet.remove(); } });
    tl.to(tz, { opacity: 0, duration: .25 }).add(function () { sfx('rip'); })
      .to(h1, { x: vert ? -6 : 0, y: vert ? 0 : -6, duration: .12, yoyo: true, repeat: 3, ease: 'none' })
      .to(h2, { x: vert ? 6 : 0, y: vert ? 0 : 6, duration: .12, yoyo: true, repeat: 3, ease: 'none' }, '<')
      .to(h1, { x: vert ? -W * .55 : 0, y: vert ? H * .3 : -H * .7, rotation: vert ? -16 : -4, opacity: 0, duration: 1.0, ease: 'power3.in', transformOrigin: '50% 100%' })
      .to(h2, { x: vert ? W * .55 : 0, y: vert ? -H * .2 : H * .7, rotation: vert ? 11 : 4, opacity: 0, duration: 1.0, ease: 'power3.in', transformOrigin: '50% 0%' }, '<');
  }

  /* ------------------------------------------------------------------ sketch page */
  function Sketch() {
    var cv = $('#sketch', stage) || $('#sketch'); if (!cv) return;
    var cx = cv.getContext('2d'), dpr = Math.min(devicePixelRatio || 1, 2), W = 0, H = 0, KEY = 'cdx-sketch';
    var st = { pen: 'italic', ink: '#1c140c', size: 6 }, hist = [], drawing = false, last = null, wSm = null;
    var PENS = [['italic', 'Italic'], ['gothic', 'Gothic'], ['copper', 'Copperplate'], ['brush', 'Brush'], ['fine', 'Fine'], ['pencil', 'Pencil'], ['eraser', 'Eraser']];
    var INKS = [['#1c140c', 'Black'], ['#5a3a1c', 'Sepia'], ['#7b2326', 'Oxblood'], ['#25356b', 'Indigo'], ['#2c4a32', 'Forest'], ['#b08d3e', 'Gold']];
    var pens = $('#tool-pens'), inks = $('#tool-inks'), size = $('#tool-size'), hint = $('#hint-write');
    PENS.forEach(function (p, i) { var b = el('pen-btn', 'button'); b.type = 'button'; b.textContent = p[1]; b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false'); b.addEventListener('click', function () { st.pen = p[0]; $$('.pen-btn', pens).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); }); pens.appendChild(b); });
    INKS.forEach(function (c, i) { var b = el('ink-dot', 'button'); b.type = 'button'; b.style.setProperty('--c', c[0]); b.setAttribute('aria-label', c[1] + ' ink'); b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false'); b.addEventListener('click', function () { st.ink = c[0]; if (st.pen === 'eraser') $$('.pen-btn', pens)[0].click(); $$('.ink-dot', inks).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); }); inks.appendChild(b); });
    size.addEventListener('input', function () { st.size = +size.value; });
    function store() { try { sessionStorage.setItem(KEY, cv.toDataURL('image/png')); } catch (e) { } }
    var saveT = null; function saveSoon() { clearTimeout(saveT); saveT = setTimeout(store, 220); }
    function restore() { var d = null; try { d = sessionStorage.getItem(KEY); } catch (e) { } if (!d) return; var im = new Image(); im.onload = function () { cx.save(); cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.drawImage(im, 0, 0, W, H); cx.restore(); hint && hint.classList.add('gone'); }; im.src = d; }
    function fit() {
      var w = cv.offsetWidth, h = cv.offsetHeight; if (!w || !h || (w === W && h === H)) return;
      var old = null; if (W) { old = document.createElement('canvas'); old.width = cv.width; old.height = cv.height; old.getContext('2d').drawImage(cv, 0, 0); }
      W = w; H = h; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cx.setTransform(dpr, 0, 0, dpr, 0, 0); hist = [];
      if (old) cx.drawImage(old, 0, 0, old.width, old.height, 0, 0, W, H); else restore();
    }
    function pt(e) { var r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / (r.width || W), y: (e.clientY - r.top) * H / (r.height || H), p: e.pressure && e.pressure !== .5 ? e.pressure : .5, t: e.timeStamp }; }
    function snap() { try { hist.push(cx.getImageData(0, 0, cv.width, cv.height)); if (hist.length > 7) hist.shift(); } catch (e) { } }
    function line(a, b, w) { cx.lineWidth = Math.max(.4, w); cx.beginPath(); cx.moveTo(a.x, a.y); cx.lineTo(b.x, b.y); cx.stroke(); }
    function blot(p) { if (st.pen === 'pencil' || st.pen === 'eraser') return; cx.fillStyle = st.ink; cx.beginPath(); cx.arc(p.x, p.y, st.size * (st.pen === 'brush' ? .7 : .32), 0, 6.283); cx.fill(); }
    function seg(a, b) {
      var dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx * dx + dy * dy); if (d < .7) return false;
      var s = st.size, sp = d / Math.max(1, b.t - a.t), i, tw;
      cx.globalCompositeOperation = st.pen === 'eraser' ? 'destination-out' : 'source-over'; cx.fillStyle = cx.strokeStyle = st.ink; cx.lineCap = cx.lineJoin = 'round'; cx.globalAlpha = 1;
      switch (st.pen) {
        case 'italic': case 'gothic': { var ang = (st.pen === 'gothic' ? 18 : 40) * Math.PI / 180, w = s * (st.pen === 'gothic' ? 2.3 : 1.8), nx = Math.cos(ang) * w / 2, ny = -Math.sin(ang) * w / 2;
          cx.beginPath(); cx.moveTo(a.x - nx, a.y - ny); cx.lineTo(a.x + nx, a.y + ny); cx.lineTo(b.x + nx, b.y + ny); cx.lineTo(b.x - nx, b.y - ny); cx.closePath(); cx.fill(); cx.lineWidth = .7; cx.stroke(); break; }
        case 'copper': { var down = Math.max(0, dy / d); tw = s * (.2 + 1.8 * down * Math.min(1, .5 + sp * .3)); wSm = wSm == null ? tw : wSm + (tw - wSm) * .28; line(a, b, wSm); break; }
        case 'brush': { tw = s * (2.3 - Math.min(sp, 2.4) * .8) * (.6 + b.p * .8); wSm = wSm == null ? tw : wSm + (tw - wSm) * .2; cx.globalAlpha = .93;
          for (i = 0; i <= d; i += 1) { cx.beginPath(); cx.arc(a.x + dx * i / d, a.y + dy * i / d, Math.max(.6, wSm / 2), 0, 6.283); cx.fill(); }
          if (sp > 1.1) { cx.globalAlpha = .35; for (i = 0; i < 3; i++) { var o = rnd(-wSm / 2, wSm / 2); line({ x: a.x - dy / d * o, y: a.y + dx / d * o }, { x: b.x - dy / d * o, y: b.y + dx / d * o }, .8); } } break; }
        case 'fine': line(a, b, s * .3 + b.p * s * .16); break;
        case 'pencil': { cx.fillStyle = st.ink; cx.globalAlpha = .38; for (i = 0; i < d * 1.6; i++) { var tt = Math.random(); cx.beginPath(); cx.arc(a.x + dx * tt + rnd(-s * .3, s * .3), a.y + dy * tt + rnd(-s * .3, s * .3), rnd(.4, 1), 0, 6.283); cx.fill(); } break; }
        case 'eraser': line(a, b, s * 3.2); break;
      }
      cx.globalAlpha = 1; cx.globalCompositeOperation = 'source-over'; return true;
    }
    cv.addEventListener('pointerdown', function (e) {
      if (e.button > 0) return; cv.setPointerCapture(e.pointerId); snap(); drawing = true; S.drawing = true; last = pt(e); wSm = null; blot(last); hint && hint.classList.add('gone'); e.preventDefault();
    });
    cv.addEventListener('pointermove', function (e) {
      if (!drawing) return; var evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e]; if (!evs.length) evs = [e];
      evs.forEach(function (ev) { var p = pt(ev); if (seg(last, p)) last = p; });
    });
    function up() { if (!drawing) return; drawing = false; S.drawing = false; saveSoon(); }
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    $('#tool-undo').addEventListener('click', function () { var h = hist.pop(); if (!h) return; cx.save(); cx.setTransform(1, 0, 0, 1, 0, 0); cx.putImageData(h, 0, 0); cx.restore(); saveSoon(); });
    $('#tool-clear').addEventListener('click', function () { snap(); cx.save(); cx.setTransform(1, 0, 0, 1, 0, 0); cx.clearRect(0, 0, cv.width, cv.height); cx.restore(); hint && hint.classList.remove('gone'); saveSoon(); });
    if (window.ResizeObserver) new ResizeObserver(fit).observe(cv);
    document.addEventListener('cdx:layout', fit); fit(); setTimeout(fit, 400);
    S.sketchFit = fit;
  }

  /* ------------------------------------------------------------------ ancient map */
  var TZ = { 784: 'Asia/Dubai', 682: 'Asia/Riyadh', 634: 'Asia/Qatar', 414: 'Asia/Kuwait', 48: 'Asia/Bahrain', 512: 'Asia/Muscat', 887: 'Asia/Aden', 368: 'Asia/Baghdad', 364: 'Asia/Tehran', 400: 'Asia/Amman', 422: 'Asia/Beirut', 760: 'Asia/Damascus', 376: 'Asia/Jerusalem', 275: 'Asia/Gaza', 792: 'Europe/Istanbul', 818: 'Africa/Cairo', 434: 'Africa/Tripoli', 788: 'Africa/Tunis', 12: 'Africa/Algiers', 504: 'Africa/Casablanca', 732: 'Africa/El_Aaiun', 478: 'Africa/Nouakchott', 466: 'Africa/Bamako', 562: 'Africa/Niamey', 148: 'Africa/Ndjamena', 729: 'Africa/Khartoum', 728: 'Africa/Juba', 232: 'Africa/Asmara', 262: 'Africa/Djibouti', 231: 'Africa/Addis_Ababa', 706: 'Africa/Mogadishu', 404: 'Africa/Nairobi', 800: 'Africa/Kampala', 834: 'Africa/Dar_es_Salaam', 646: 'Africa/Kigali', 108: 'Africa/Bujumbura', 180: 'Africa/Kinshasa', 178: 'Africa/Brazzaville', 266: 'Africa/Libreville', 226: 'Africa/Malabo', 120: 'Africa/Douala', 140: 'Africa/Bangui', 566: 'Africa/Lagos', 204: 'Africa/Porto-Novo', 768: 'Africa/Lome', 288: 'Africa/Accra', 384: 'Africa/Abidjan', 854: 'Africa/Ouagadougou', 430: 'Africa/Monrovia', 694: 'Africa/Freetown', 324: 'Africa/Conakry', 624: 'Africa/Bissau', 270: 'Africa/Banjul', 686: 'Africa/Dakar', 24: 'Africa/Luanda', 508: 'Africa/Maputo', 894: 'Africa/Lusaka', 716: 'Africa/Harare', 454: 'Africa/Blantyre', 72: 'Africa/Gaborone', 516: 'Africa/Windhoek', 710: 'Africa/Johannesburg', 748: 'Africa/Mbabane', 426: 'Africa/Maseru', 450: 'Indian/Antananarivo' };
  function offMin(tz) { var d = new Date(), s = d.toLocaleString('sv-SE', { timeZone: tz }); return Math.round((Date.parse(s.replace(' ', 'T') + 'Z') - Math.floor(d.getTime() / 1000) * 1000) / 60000); }
  function MapChart() {
    var wrap = $('#map-wrap', stage) || $('#map-wrap'); if (!wrap) return;
    fetch('/assets/data/map-paths.json').then(function (r) { return r.json(); }).then(function (d) {
      var mu = d.mu, i, s = '<svg viewBox="0 0 ' + d.w + ' ' + d.h + '" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Old map of the Middle East and Africa with Port Louis marked">';
      s += '<defs><radialGradient id="seaw" cx=".5" cy=".5" r=".75"><stop offset="0" stop-color="#d7c496"/><stop offset="1" stop-color="#c2aa74"/></radialGradient></defs><rect width="' + d.w + '" height="' + d.h + '" fill="url(#seaw)"/>';
      s += '<g stroke="rgba(110,35,30,.2)" stroke-width=".6">'; [[120, 560], [470, 650]].forEach(function (c) { for (i = 0; i < 16; i++) { var a = i * Math.PI / 8; s += '<line x1="' + c[0] + '" y1="' + c[1] + '" x2="' + (c[0] + Math.cos(a) * 900).toFixed(0) + '" y2="' + (c[1] + Math.sin(a) * 900).toFixed(0) + '"/>'; } }); s += '</g>';
      s += '<g fill="none" stroke="rgba(70,45,20,.35)" stroke-width="1" stroke-linecap="round">'; for (i = 0; i < 70; i++) { var wx = rnd(10, d.w - 20), wy = rnd(10, d.h - 10); s += '<path d="M' + wx.toFixed(0) + ' ' + wy.toFixed(0) + 'q4 -4 8 0t8 0"/>'; } s += '</g>';
      s += '<g class="land" filter="url(#rough)">'; d.c.forEach(function (c) { s += '<path class="' + (c.m ? 'm' : '') + '" data-id="' + c.id + '" data-n="' + c.n.replace(/"/g, '') + '" d="' + c.d + '"/>'; }); s += '</g>';
      d.hubs.forEach(function (h) { var cx = (mu[0] + h.p[0]) / 2, cy = Math.min(mu[1], h.p[1]) - Math.hypot(mu[0] - h.p[0], mu[1] - h.p[1]) * .22; s += '<path class="route" d="M' + mu[0] + ' ' + mu[1] + 'Q' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ' ' + h.p[0] + ' ' + h.p[1] + '"/><circle class="hubdot" cx="' + h.p[0] + '" cy="' + h.p[1] + '" r="2.6"/><text class="hublabel" x="' + (h.p[0] + 6) + '" y="' + (h.p[1] - 4) + '">' + h.n + '</text>'; });
      s += '<g transform="translate(' + mu[0] + ' ' + mu[1] + ')"><circle class="ring" r="7"/><circle class="ring" r="7" style="animation-delay:1.4s"/><circle r="5" fill="#7b2326"/><circle r="9" fill="none" stroke="#7b2326" stroke-width="1.5"/><text x="-12" y="30" text-anchor="end" font-family="Caveat,cursive" font-size="21" font-weight="600" fill="#4d1315">Port Louis</text><text x="-12" y="46" text-anchor="end" font-family="Caveat,cursive" font-size="15" fill="#4d1315">here be systems</text></g>';
      s += '<text class="sea" x="52" y="520" font-size="14" transform="rotate(-72 52 520)">OCEANVS ATLANTICVS</text><text class="sea" x="470" y="560" font-size="14">MARE INDICVM</text><text class="sea" x="205" y="345" font-size="26" fill-opacity=".6" style="fill:rgba(70,45,20,.32)">AFRICA</text><text class="sea" x="395" y="180" font-size="15">ARABIA</text><text class="sea" x="170" y="62" font-size="13">MARE MEDITERRANEVM</text>';
      s += '<g transform="translate(88 662)" stroke="#3a2412" fill="rgba(90,50,20,.55)" stroke-width=".9"><circle r="44" fill="none" stroke-width=".7"/><circle r="36" fill="none" stroke-width=".5"/>' + [0, 90, 180, 270].map(function (a) { return '<path d="M0 -44L7 -7L44 0L7 7L0 44L-7 7L-44 0L-7 -7Z" transform="rotate(' + a + ')" fill="' + (a % 180 ? 'rgba(122,35,38,.55)' : 'rgba(60,35,15,.55)') + '"/>'; }).join('') + '<path d="M0 -30L5 -5L30 0L5 5L0 30L-5 5L-30 0L-5 -5Z" transform="rotate(45)" fill="rgba(176,141,62,.6)"/><text y="-50" text-anchor="middle" font-family="IM Fell English,serif" font-size="13" fill="#3a2412" stroke="none">N</text></g>';
      s += '<rect x="7" y="7" width="' + (d.w - 14) + '" height="' + (d.h - 14) + '" fill="none" stroke="#3a2412" stroke-width="1.6"/><rect x="13" y="13" width="' + (d.w - 26) + '" height="' + (d.h - 26) + '" fill="none" stroke="#3a2412" stroke-width=".6"/></svg>';
      wrap.innerHTML = s;
      var tip = $('#map-tip', stage) || $('#map-tip'), host = wrap.parentNode, mu0 = offMin('Indian/Mauritius');
      function show(e, p) {
        var id = +p.getAttribute('data-id'), tz = TZ[id], r = host.getBoundingClientRect(), k = r.width ? host.offsetWidth / r.width : 1, now = '', diff = '';
        if (tz) { try { now = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: tz }); var dm = Math.round((offMin(tz) - mu0) / 60 * 2) / 2; diff = dm === 0 ? 'Same time as Port Louis' : (Math.abs(dm) + (Math.abs(dm) === 1 ? ' hour ' : ' hours ') + (dm > 0 ? 'ahead of' : 'behind') + ' Port Louis'); } catch (x) { } }
        tip.innerHTML = '<b>' + p.getAttribute('data-n') + '</b>' + (now ? '<span class="tm">' + now + '</span>' : '') + '<span>' + (diff || 'Projects delivered online') + '</span>';
        tip.style.left = Math.max(60, Math.min(host.offsetWidth - 60, (e.clientX - r.left) * k)) + 'px'; tip.style.top = Math.max(70, (e.clientY - r.top) * k) + 'px'; tip.classList.add('on');
      }
      wrap.addEventListener('pointermove', function (e) { var p = e.target.closest && e.target.closest('path.m'); $$('.land path.hot', wrap).forEach(function (x) { if (x !== p) x.classList.remove('hot'); }); if (p) { p.classList.add('hot'); show(e, p); } else tip.classList.remove('on'); });
      wrap.addEventListener('pointerleave', function () { tip.classList.remove('on'); $$('.land path.hot', wrap).forEach(function (x) { x.classList.remove('hot'); }); });
    }).catch(function () { });
  }

  /* ------------------------------------------------------------------ ask AI */
  function AskAI() {
    var q = 'Who is Amyaaz Aumeer, the Zoho developer and digital solutions architect in Mauritius (amyaaz.com)? Summarise his work, skills, certifications and how a business can work with him.';
    var line = $('#ask-line', stage) || $('#ask-line');
    $$('.wseal[data-ai]').forEach(function (a) {
      var k = a.getAttribute('data-ai'), e = encodeURIComponent(q);
      if (k === 'chatgpt') a.href = 'https://chatgpt.com/?q=' + e; else if (k === 'claude') a.href = 'https://claude.ai/new?q=' + e; else if (k === 'perplexity') a.href = 'https://www.perplexity.ai/search?q=' + e;
      else a.addEventListener('click', function () { try { navigator.clipboard.writeText(q); if (line) line.textContent = 'Question copied. Paste it in Gemini.'; } catch (x) { } });
      a.addEventListener('pointerenter', function () { if (line) line.textContent = k === 'gemini' ? 'Opens Gemini and copies the question.' : 'Opens ' + a.textContent + ' with the question ready.'; });
      a.addEventListener('pointerleave', function () { if (line) line.textContent = 'Each one opens in a new tab.'; });
    });
    var f = $('#contact-form'); if (f) f.addEventListener('submit', function () { var b = $('.wax-send', f); if (b) { b.classList.remove('stamp'); void b.offsetWidth; b.classList.add('stamp'); sfx('stamp'); } });
  }

  /* ------------------------------------------------------------------ light, dust, motion */
  var scene = { tx: 0, ty: 0, mx: .5, my: .5, t: 0, motes: [], mc: null, mx2: null, W: 0, H: 0, spr: null, vis: true };
  function mkSprite() { var c = document.createElement('canvas'); c.width = c.height = 32; var x = c.getContext('2d'), g = x.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.4, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 32, 32); return c; }
  function sceneInit() {
    scene.mc = $('.motes', stage); scene.mx2 = scene.mc.getContext('2d'); scene.spr = mkSprite();
    function rs() { scene.W = scene.mc.width = innerWidth; scene.H = scene.mc.height = innerHeight; var n = innerWidth < 700 ? 26 : 56; scene.motes = []; for (var i = 0; i < n; i++) scene.motes.push({ x: Math.random() * scene.W, y: Math.random() * scene.H, r: rnd(1.5, 5), vx: rnd(-6, 6), vy: rnd(-9, -2), a: rnd(.15, .6), ph: Math.random() * 6.28 }); }
    rs(); addEventListener('resize', rs);
    document.addEventListener('visibilitychange', function () { scene.vis = !document.hidden; });
    stage.addEventListener('pointermove', function (e) { scene.mx = e.clientX / innerWidth; scene.my = e.clientY / innerHeight; });
    stage.addEventListener('pointermove', function (e) { var f = e.target.closest && e.target.closest('.face'); if (f) { var r = f.getBoundingClientRect(); f.style.setProperty('--mx', (e.clientX - r.left) + 'px'); f.style.setProperty('--my', (e.clientY - r.top) + 'px'); } });
    var wh = $('#wh', stage), wm = $('#wm', stage), ws = $('#ws', stage), lastSec = -1;
    var last = performance.now();
    function frame(now) {
      requestAnimationFrame(frame); if (!scene.vis) { last = now; return; }
      var dt = Math.min(.05, (now - last) / 1000); last = now; scene.t += dt; var t = scene.t, dark = html.getAttribute('data-theme') !== 'light';
      // tilt follows the cursor, flat while drawing or on touch screens
      var ttx = (S.drawing || S.single || reduce) ? 0 : (.5 - scene.my) * 4.2, tty = (S.drawing || S.single || reduce) ? 0 : (scene.mx - .5) * 5.2;
      scene.tx += (ttx - scene.tx) * Math.min(1, dt * 4); scene.ty += (tty - scene.ty) * Math.min(1, dt * 4);
      stage.style.setProperty('--tx', scene.tx.toFixed(3) + 'deg'); stage.style.setProperty('--ty', scene.ty.toFixed(3) + 'deg');
      if (dark && !reduce) {
        var fl = .93 + .05 * Math.sin(t * 7.3) + .03 * Math.sin(t * 13.1 + 1) + .02 * Math.sin(t * 23.7) + (Math.random() - .5) * .025;
        stage.style.setProperty('--fl', fl.toFixed(3)); stage.style.setProperty('--cx', (8 - (scene.mx - .5) * 4).toFixed(2) + '%'); stage.style.setProperty('--cy', (80 - (scene.my - .5) * 3).toFixed(2) + '%');
      }
      var m = scene.mx2; m.clearRect(0, 0, scene.W, scene.H);
      if (!reduce) scene.motes.forEach(function (p) {
        p.x += (p.vx + Math.sin(t * .5 + p.ph) * 5) * dt; p.y += p.vy * dt; if (p.y < -10) { p.y = scene.H + 10; p.x = Math.random() * scene.W; } if (p.x < -10) p.x = scene.W + 10; if (p.x > scene.W + 10) p.x = -10;
        var a = p.a * (.6 + .4 * Math.sin(t * 1.3 + p.ph));
        if (dark) { var d = Math.hypot(p.x / scene.W - .08, p.y / scene.H - .8); a *= Math.max(0, 1.1 - d * 1.1); m.globalAlpha = a; m.drawImage(scene.spr, p.x - p.r * 2, p.y - p.r * 2, p.r * 4, p.r * 4); }
        else { m.globalAlpha = a * .8; m.drawImage(scene.spr, p.x - p.r * 2, p.y - p.r * 2, p.r * 4, p.r * 4); }
      });
      var sec = Math.floor(t * 4); if (sec !== lastSec && wh) { lastSec = sec; var d = new Date(), p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Indian/Mauritius', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false }).formatToParts(d), g = {}; p.forEach(function (x) { g[x.type] = +x.value; }); var hr = (g.hour % 12) + g.minute / 60, mn = g.minute + g.second / 60;
        wh.setAttribute('transform', 'rotate(' + (hr * 30) + ' 80 108)'); wm.setAttribute('transform', 'rotate(' + (mn * 6) + ' 80 108)'); ws.setAttribute('transform', 'rotate(' + (g.second * 6) + ' 80 108)'); }
    }
    requestAnimationFrame(frame);
  }

  /* ------------------------------------------------------------------ the ink opening */
  var introRunning = false;
  function setWord(w) { var e = $('#ink-word'); e.textContent = w[0]; e.setAttribute('lang', w[1]); e.setAttribute('dir', w[1] === 'ar' ? 'rtl' : 'ltr'); }
  function playInk(done) {
    var ink = $('#cdx-ink'); if (!ink || !hasGsap || reduce || introRunning) { html.classList.remove('pre'); done && done(); return; }
    introRunning = true; html.classList.add('pre'); ink.classList.add('on');
    var black = $('#ink-black'), thread = $('#ink-thread'), drop = $('#ink-drop'), splat = $('#ink-splat'), logo = $('#ink-logo'), word = $('#ink-word'), H = innerHeight, R = Math.hypot(innerWidth, H) * 1.05, i, bits = [];
    gsap.set(ink, { opacity: 1 }); gsap.set(black, { clipPath: 'circle(0px at 50% 100%)' }); gsap.set(thread, { scaleY: 0, opacity: 1 }); gsap.set(drop, { y: -80, scaleY: 1, opacity: 1 }); gsap.set(word, { opacity: 0 }); logo.classList.remove('glitch'); gsap.set(logo, { opacity: 1 });
    splat.innerHTML = ''; for (i = 0; i < 16; i++) { var b = document.createElement('i'); b.style.width = b.style.height = rnd(7, 18) + 'px'; splat.appendChild(b); bits.push(b); }
    var tl = gsap.timeline({ onComplete: function () { ink.classList.remove('on'); introRunning = false; done && done(); } });
    tl.to(drop, { y: H - 40, scaleY: 1.8, duration: .85, ease: 'power2.in' }, 0)
      .to(thread, { scaleY: .94, duration: .85, ease: 'power2.in' }, 0)
      .add(function () { sfx('splash'); }, .85)
      .to(drop, { opacity: 0, duration: .08 }, .86)
      .fromTo(bits, { x: 0, y: 0, opacity: 1 }, { x: function (n) { return (n - 8) * rnd(16, 38); }, y: function () { return -rnd(70, 300); }, duration: .45, ease: 'power2.out', stagger: .008 }, .86)
      .to(bits, { y: '+=' + 340, opacity: 0, duration: .5, ease: 'power2.in' }, 1.28)
      .to(black, { clipPath: 'circle(' + R + 'px at 50% 100%)', duration: 1.0, ease: 'power2.in' }, .86)
      .to(thread, { opacity: 0, duration: .25 }, 1.05)
      .add(function () { logo.classList.add('glitch'); sfx('stamp'); }, 1.95)
      .to(logo, { opacity: 0, duration: .16 }, 2.7);
    WORDS.forEach(function (w, k) { var t0 = 2.78 + k * .44; tl.add(function () { setWord(w); }, t0).fromTo(word, { opacity: 0, filter: 'blur(14px)', letterSpacing: '.18em' }, { opacity: 1, filter: 'blur(0px)', letterSpacing: '0em', duration: .24, ease: 'power2.out' }, t0).to(word, { opacity: 0, duration: .14 }, t0 + .3); });
    tl.add(function () { html.classList.remove('pre'); }, 4.62).to(ink, { opacity: 0, duration: .95, ease: 'power1.inOut' }, 4.62);
  }
  function startBook() {
    stage.classList.add('ready'); S.ready = true;
    var h = (location.hash || '').replace('#', ''); h = ALIAS[h] || h; var t = null; TABS.forEach(function (x) { if (x[0] === h) t = x; });
    var delay = reduce ? 0 : 1500;
    setTimeout(function () { if (S.pos < 0) go(t ? target(t) : 0, reduce); }, delay);
  }
  window.__hello = function () {
    if (!hasGsap || reduce) return;
    go(-1, true); stage.classList.remove('ready'); cardsHide(); vellumReset(); S.torn = false;
    playInk(startBook);
  };

  /* ------------------------------------------------------------------ input */
  function input() {
    addEventListener('keydown', function (e) {
      if (/^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName || ''))) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { go(S.pos + 1); } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { go(S.pos - 1); }
    });
    stage.addEventListener('click', function (e) {
      var g = e.target.closest && e.target.closest('[data-goto]'); if (g) { var id = g.getAttribute('data-goto'); TABS.forEach(function (t) { if (t[0] === id) go(target(t)); }); }
      if (e.target.closest && e.target.closest('[data-next]')) go(S.pos + 1);
    });
    var sx = 0, sy = 0, st = 0, ok = false;
    stage.addEventListener('pointerdown', function (e) { ok = e.pointerType === 'touch' && !(e.target.closest && e.target.closest('canvas,input,textarea,select,.note,.map-wrap')); sx = e.clientX; sy = e.clientY; st = e.timeStamp; });
    stage.addEventListener('pointerup', function (e) { if (!ok) return; ok = false; var dx = e.clientX - sx, dy = e.clientY - sy; if (e.timeStamp - st < 700 && Math.abs(dx) > 55 && Math.abs(dy) < 60) go(S.pos + (dx < 0 ? 1 : -1)); });
    var rt; addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(relayout, 160); });
  }
  function relayout() {
    var m = measure();
    if (m.single !== S.single) {
      var ti = S.pos < 0 ? -1 : tabIndexForPos(S.pos); S.single = m.single; applySize(m); stage.classList.toggle('single', S.single);
      cardsHide(); vellumReset(); buildBook(); cardsPlace(); var np = ti < 0 ? -1 : target(TABS[ti]); S.pos = -2; go(np, true);
    } else { applySize(m); $$('.note', stage).forEach(function (b, i) { if (!S.single) b.style.top = Math.round(S.ph * (.06 + i * .108)) + 'px'; }); cardsPlace(); }
    document.dispatchEvent(new CustomEvent('cdx:layout'));
  }

  /* ------------------------------------------------------------------ boot */
  function boot() {
    hasGsap = !!window.gsap; var m = measure(); S.single = m.single;
    buildStage(); applySize(m); stage.classList.toggle('single', S.single);
    buildBook(); html.classList.add('cdx');
    cardsInit(); cardsPlace(); sceneInit(); Sketch(); MapChart(); AskAI(); sndButton(); input();
    stacks(); settle();
    if (html.classList.contains('pre')) playInk(startBook); else startBook();
    setTimeout(function () { if (html.classList.contains('pre') && !introRunning) html.classList.remove('pre'); }, 12000);
  }
  var tries = 0;
  (function wait() {
    if (window.gsap || tries++ > 60) boot(); else setTimeout(wait, 50);
  })();
})();
