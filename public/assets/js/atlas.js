/* Atlas: one pinned stage. Scroll advances beats; the diagram, copy and proof panels follow. */
(function () {
  var sec = document.querySelector('[data-atlas]'); if (!sec) return;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var beats = [].slice.call(sec.querySelectorAll('.abeat')), panels = [].slice.call(sec.querySelectorAll('.atlas-panels .ui'));
  var iEl = sec.querySelector('.atlas-i'), bar = sec.querySelector('.atlas-bar u'), cur = -1;
  if (reduce) { sec.classList.add('is-static'); return; }
  sec.classList.add('is-pinned');
  var N = beats.length;
  function vh() { return window.innerHeight; }
  function secTop() { return sec.getBoundingClientRect().top + scrollY; }
  function range() { return sec.offsetHeight - vh(); }
  function apply(i) {
    if (i === cur) return; cur = i;
    beats.forEach(function (b, k) { b.classList.toggle('is-on', k === i); b.setAttribute('aria-hidden', k === i ? 'false' : 'true'); });
    var b = beats[i], pi = b.dataset.panel;
    panels.forEach(function (p, k) { p.classList.toggle('is-on', pi !== undefined && +pi === k); });
    sec.classList.toggle('has-panel', pi !== undefined);
    sec.classList.toggle('is-build', !!b.dataset.interactive);
    if (iEl) iEl.textContent = String(i + 1).padStart(2, '0');
    if (window.Builder) { window.Builder.set(b.dataset.systems.split(',')); window.Builder.interactive(!!b.dataset.interactive); }
  }
  function tick() {
    var r = sec.getBoundingClientRect(), q = Math.max(0, Math.min(1, -r.top / Math.max(1, range())));
    apply(Math.min(N - 1, Math.floor(q * N * 0.999)));
    if (bar) bar.style.transform = 'scaleX(' + q.toFixed(3) + ')';
  }
  var raf = 0; addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(function () { raf = 0; tick(); }); }, { passive: true });
  addEventListener('resize', tick);
  /* wait for the builder script, then sync */
  var tries = 0; (function w() { if (window.Builder || tries++ > 40) { cur = -1; tick(); } else setTimeout(w, 100); })();
  /* in-page anchors land on the right beat */
  function jump(i) { scrollTo({ top: secTop() + (i + 0.5) / N * range(), behavior: 'smooth' }); }
  sec.querySelector('#work') && (sec.querySelector('#work').dataset.beat = 2);
  /* arrow keys step beats while the stage is on screen */
  addEventListener('keydown', function (e) {
    var r = sec.getBoundingClientRect(); if (r.top > 0 || r.bottom < vh() * 0.6) return;
    if (/input|textarea|select/i.test((e.target.tagName || ''))) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { if (cur < N - 1) { e.preventDefault(); jump(cur + 1); } }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { if (cur > 0) { e.preventDefault(); jump(cur - 1); } }
  });
})();
