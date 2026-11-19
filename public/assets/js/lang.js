/* Headline language swap: English, French, Mauritian Creole. Words slide out and in. */
(function () {
  var h = document.querySelector('[data-swap]'); if (!h) return;
  var txt = h.querySelector('.swap-text'), btns = [].slice.call(document.querySelectorAll('.swap-ctl button'));
  var L = { en: 'Zoho systems that run your business.', fr: 'Des systèmes Zoho qui font tourner votre entreprise.', mfe: 'Sistenm Zoho ki fer ou biznes marse.' };
  var order = ['en', 'fr', 'mfe'], cur = 'en', busy = false, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function words(s) { return s.split(' ').map(function (w) { return '<span class="w"><span>' + w + '</span></span>'; }).join(' '); }
  function mark(l) { btns.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.lang === l ? 'true' : 'false'); }); }
  function go(l) {
    if (l === cur || busy) return; busy = true; var old = txt.querySelectorAll('.w > span');
    if (reduce) { txt.textContent = L[l]; h.setAttribute('lang', l); h.setAttribute('aria-label', L[l]); cur = l; mark(l); busy = false; return; }
    old.forEach(function (o, i) { o.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-110%)' }], { duration: 380, delay: i * 35, easing: 'cubic-bezier(.7,0,.84,0)', fill: 'forwards' }); });
    setTimeout(function () {
      txt.innerHTML = words(L[l]); h.setAttribute('lang', l); h.setAttribute('aria-label', L[l]); cur = l; mark(l);
      txt.querySelectorAll('.w > span').forEach(function (n, i) { n.animate([{ transform: 'translateY(110%)' }, { transform: 'translateY(0)' }], { duration: 520, delay: i * 45, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' }); });
      setTimeout(function () { busy = false; }, 520 + 45 * L[l].split(' ').length);
    }, 380 + 35 * old.length);
  }
  function next() { go(order[(order.indexOf(cur) + 1) % order.length]); }
  txt.innerHTML = words(L.en); h.setAttribute('aria-label', L.en);
  h.setAttribute('tabindex', '0'); h.setAttribute('role', 'heading'); h.setAttribute('aria-level', '1');
  var moved = false; addEventListener('pointermove', function () { moved = true; }, { once: true });
  h.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse' && moved && performance.now() - (window.__printDone || 0) > 2200) next(); });
  h.addEventListener('click', function (e) { if (e.pointerType !== 'mouse') next(); });
  h.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); next(); } });
  btns.forEach(function (b) { b.addEventListener('click', function () { go(b.dataset.lang); }); });
})();
