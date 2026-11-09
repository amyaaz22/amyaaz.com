/* Preview-only interactions: card spotlight and tilt, and the API playground.
   Loaded after site.js. Everything here is optional; the page works without it. */
(function () {
  'use strict';

  var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Card spotlight and tilt ---------- */
  if (fine && !reduce) {
    var CARD = '.card:not(.form):not(.playground)';
    var lastCard = null;

    var reset = function (card) {
      if (!card) return;
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    };

    document.addEventListener(
      'pointermove',
      function (e) {
        var target = e.target && e.target.closest ? e.target.closest(CARD) : null;
        if (lastCard && lastCard !== target) {
          reset(lastCard);
          lastCard = null;
        }
        if (!target) return;
        lastCard = target;
        var r = target.getBoundingClientRect();
        var x = e.clientX - r.left;
        var y = e.clientY - r.top;
        target.style.setProperty('--mx', x + 'px');
        target.style.setProperty('--my', y + 'px');
        target.style.setProperty('--rx', ((y / r.height - 0.5) * -7).toFixed(2) + 'deg');
        target.style.setProperty('--ry', ((x / r.width - 0.5) * 7).toFixed(2) + 'deg');
      },
      { passive: true }
    );
  }

  /* ---------- API playground ---------- */
  var root = document.querySelector('[data-playground]');
  if (!root) return;

  var DEFAULT_METHOD = 'GET';
  var DEFAULT_URL = '/sandbox/v1/architect/profile';

  var sel = root.querySelector('.pg-method');
  var url = root.querySelector('.pg-url');
  var send = root.querySelector('.pg-send');
  var reset = root.querySelector('.pg-reset');
  var status = root.querySelector('.pg-status');
  var out = root.querySelector('.pg-out');

  var SAMPLE = {
    name: 'Amyaaz Aumeer',
    role: 'Digital Solutions Architect',
    base: 'Mauritius',
    stack: ['Zoho Creator', 'Deluge', 'Zoho Flow', 'Catalyst'],
    compliance: ['MRA e-invoicing'],
    availability: 'taking projects',
  };

  var REFUSAL = {
    status: 403,
    error: 'sandbox_scope',
    message:
      'You have been fooled. This playground only answers the documented request, and nothing you typed was sent anywhere.',
    hint: 'Send GET to /sandbox/v1/architect/profile to see the sample response.',
  };

  function render(state, label, body) {
    root.setAttribute('data-state', state);
    status.textContent = label;
    out.textContent = JSON.stringify(body, null, 2);
  }

  function run() {
    var method = sel.value;
    var target = url.value.trim();
    if (method === DEFAULT_METHOD && target === DEFAULT_URL) {
      render('ok', 'HTTP 200 OK  ·  ' + method + ' ' + target + '  ·  12 ms', SAMPLE);
    } else {
      render('denied', 'HTTP 403 Forbidden  ·  ' + method + ' ' + (target || '(empty)'), REFUSAL);
    }
  }

  function restore() {
    sel.value = DEFAULT_METHOD;
    url.value = DEFAULT_URL;
    root.removeAttribute('data-state');
    status.textContent = 'Ready. Press Send.';
    out.textContent = '// Press Send to run the documented request.';
  }

  send.addEventListener('click', run);
  url.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') run();
  });
  reset.addEventListener('click', restore);
  restore();
})();
