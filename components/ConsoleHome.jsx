'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Mark } from './Icons';

/* ------------------------------------------------------------------ data */

const CATS = [
  {
    id: 'work',
    label: 'Work',
    hint: 'Real systems, shipped',
    items: [
      ['MRA e-invoicing, built into the invoice flow', '/articles/mra-e-invoicing-compliance-with-zoho-a-technical-overview/'],
      ['VAT returns in the MRA format, one click', '/articles/building-a-custom-zoho-books-extension-for-mns-tax-return-filing/'],
      ['Paper approvals to digital workflows', '/articles/building-a-multi-step-approval-workflow-in-zoho-creator/'],
      ['See all work', '#work'],
    ],
  },
  {
    id: 'services',
    label: 'Services',
    hint: 'Architecture to handover',
    items: [
      ['Digital solutions architecture', '#services'],
      ['Zoho Creator and Deluge builds', '#services'],
      ['Zoho Flow and Catalyst', '#services'],
      ['How I work', '#approach'],
    ],
  },
  {
    id: 'articles',
    label: 'Articles',
    hint: 'Writing on the Zoho stack',
    items: [
      ['Latest articles', '#articles'],
      ['Catalyst cache for faster Deluge calls', '/articles/using-zoho-catalyst-cache-to-speed-up-deluge-api-calls/'],
      ['All articles', '/articles/'],
    ],
  },
  {
    id: 'about',
    label: 'About',
    hint: 'Scouting report',
    items: [
      ['About Amyaaz', '#about'],
      ['Certificates', '#credential'],
      ['Press and recognition', '#recognition'],
    ],
  },
  {
    id: 'mea',
    label: 'MEA',
    hint: 'Middle East and Africa',
    items: [
      ['Zoho developer for the Middle East and Africa', '/zoho-developer-middle-east-africa/'],
      ['Regions I work with', '#regions'],
    ],
  },
  {
    id: 'contact',
    label: 'Contact',
    hint: 'Kick off a project',
    items: [
      ['Start a project', '#contact'],
      ['Try the API sandbox', '#hero-title'],
      ['Penalty shoot-out', '#coach'],
    ],
  },
];

const TROPHIES = [
  { id: 'kickoff', name: 'Kick-off', desc: 'Entered the portfolio.' },
  { id: 'scout', name: 'Scout', desc: 'Browsed every menu category.' },
  { id: 'api', name: 'API Whisperer', desc: 'Sent a valid request in the sandbox.' },
  { id: 'fooled', name: 'Nice Try', desc: 'Got refused by the sandbox.' },
  { id: 'goal', name: 'Golden Boot', desc: 'Scored in the penalty shoot-out.' },
  { id: 'global', name: 'Going Global', desc: 'Visited the Middle East and Africa section.' },
  { id: 'reader', name: 'Deep Reader', desc: 'Reached the contact section.' },
  { id: 'secret', name: 'Secret Level', desc: 'Found the hidden code.' },
];

const STATS = [
  ['CRT', 'Creator', 95],
  ['DLG', 'Deluge', 94],
  ['API', 'Integrations', 92],
  ['FLW', 'Flow', 90],
  ['ARC', 'Architecture', 91],
  ['CAT', 'Catalyst', 86],
];

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

/* ------------------------------------------------------------------ helpers */

const store = {
  get(k, d) {
    try {
      const v = localStorage.getItem(k);
      return v === null ? d : v;
    } catch (e) {
      return d;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, v);
    } catch (e) {
      /* storage can be blocked */
    }
  },
};

function useSound() {
  const ctx = useRef(null);
  const on = useRef(false);
  const tone = useCallback((freq, dur, type = 'sine', gain = 0.04, delay = 0) => {
    if (!on.current) return;
    try {
      if (!ctx.current) ctx.current = new (window.AudioContext || window.webkitAudioContext)();
      const c = ctx.current;
      const t = c.currentTime + delay;
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(gain, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(c.destination);
      o.start(t);
      o.stop(t + dur + 0.02);
    } catch (e) {
      /* audio unavailable */
    }
  }, []);
  return {
    setOn(v) {
      on.current = v;
      if (v && ctx.current && ctx.current.state === 'suspended') ctx.current.resume();
    },
    tick: () => tone(520, 0.05, 'triangle', 0.025),
    move: () => tone(380, 0.06, 'triangle', 0.025),
    open: () => {
      tone(440, 0.09, 'sine', 0.035);
      tone(660, 0.12, 'sine', 0.035, 0.07);
    },
    trophy: () => {
      tone(523, 0.14, 'sine', 0.045);
      tone(659, 0.14, 'sine', 0.045, 0.1);
      tone(784, 0.14, 'sine', 0.045, 0.2);
      tone(1047, 0.3, 'sine', 0.045, 0.3);
    },
  };
}

const ICONS = {
  work: <path d="M4 7h16v11H4zM9 7V5h6v2M4 12h16" />,
  services: <path d="M12 3 3 8l9 5 9-5-9-5ZM3 13l9 5 9-5M3 17.5l9 5 9-5" />,
  articles: <path d="M5 4h11l3 3v13H5zM8 10h8M8 14h8M8 18h5" />,
  about: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />,
  mea: <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM3 12h18M12 3c2.6 2.6 4 5.6 4 9s-1.4 6.4-4 9c-2.6-2.6-4-5.6-4-9s1.4-6.4 4-9Z" />,
  contact: <path d="M4 5h16v14H4zM4 7l8 6 8-6" />,
};

function CatIcon({ id }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[id]}
    </svg>
  );
}

/* ------------------------------------------------------------------ component */

export default function ConsoleHome() {
  const [cat, setCat] = useState(0);
  const [item, setItem] = useState(0);
  const [won, setWon] = useState([]);
  const [toast, setToast] = useState(null);
  const [soundOn, setSoundOn] = useState(false);
  const [clock, setClock] = useState('');
  const [bootDone, setBootDone] = useState(false);
  const root = useRef(null);
  const tabs = useRef([]);
  const links = useRef([]);
  const dialog = useRef(null);
  const seen = useRef(new Set([0]));
  const wonRef = useRef([]);
  const inView = useRef(false);
  const touch = useRef(null);
  const catRef = useRef(0);
  const itemRef = useRef(0);
  const sound = useSound();
  const toastTimer = useRef(null);

  /* ---- trophies ---- */
  const award = useCallback(
    (id) => {
      if (wonRef.current.includes(id)) return;
      wonRef.current = [...wonRef.current, id];
      setWon(wonRef.current);
      store.set('trophies', JSON.stringify(wonRef.current));
      const t = TROPHIES.find((x) => x.id === id);
      if (!t) return;
      setToast(t);
      sound.trophy();
      clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(null), 4200);
      if (wonRef.current.length === TROPHIES.length) {
        setTimeout(() => {
          setToast({ id: 'plat', name: 'Platinum', desc: 'Every trophy collected. Now let’s build something real.' });
          clearTimeout(toastTimer.current);
          toastTimer.current = setTimeout(() => setToast(null), 5200);
        }, 4600);
      }
    },
    [sound]
  );

  /* ---- boot, state restore, sections, events ---- */
  useEffect(() => {
    let saved = [];
    try {
      saved = JSON.parse(store.get('trophies', '[]')) || [];
    } catch (e) {
      saved = [];
    }
    wonRef.current = saved;
    setWon(saved);
    const snd = store.get('sound', '0') === '1';
    setSoundOn(snd);
    sound.setOn(snd);

    const html = document.documentElement;
    const finishBoot = () => {
      if (!html.hasAttribute('data-boot')) return;
      html.removeAttribute('data-boot');
      try {
        sessionStorage.setItem('booted', '1');
      } catch (e) {
        /* ignore */
      }
      setBootDone(true);
      award('kickoff');
    };
    if (html.hasAttribute('data-boot')) {
      const t = setTimeout(finishBoot, 2600);
      const skip = () => {
        clearTimeout(t);
        finishBoot();
      };
      window.addEventListener('keydown', skip, { once: true });
      window.addEventListener('pointerdown', skip, { once: true });
    } else {
      setBootDone(true);
      award('kickoff');
    }

    const tick = () => {
      const d = new Date();
      setClock(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    tick();
    const clockId = setInterval(tick, 20000);

    const onTrophy = (e) => award(e.detail);
    window.addEventListener('trophy', onTrophy);

    // Section visits.
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          if (en.target.id === 'regions') award('global');
          if (en.target.id === 'contact') award('reader');
        });
      },
      { threshold: 0.35 }
    );
    ['regions', 'contact'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });

    // Console visibility (gates keyboard and gamepad).
    const vis = new IntersectionObserver(([en]) => {
      inView.current = en.isIntersecting && en.intersectionRatio > 0.5;
    }, { threshold: [0, 0.5, 1] });
    if (root.current) vis.observe(root.current);

    // Penalty goals.
    const score = document.getElementById('score');
    let mo;
    if (score) {
      mo = new MutationObserver(() => {
        if (parseInt(score.textContent, 10) > 0) award('goal');
      });
      mo.observe(score, { childList: true, characterData: true, subtree: true });
    }

    // Konami.
    let k = 0;
    const onKey = (e) => {
      const want = KONAMI[k];
      if (e.key === want || e.key.toLowerCase() === want) {
        k += 1;
        if (k === KONAMI.length) {
          k = 0;
          award('secret');
          html.classList.add('konami');
          setTimeout(() => html.classList.remove('konami'), 3500);
        }
      } else {
        k = e.key === KONAMI[0] ? 1 : 0;
      }
      if (e.key === 't' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement && document.activeElement.tagName)) {
        if (inView.current && dialog.current && !dialog.current.open) dialog.current.showModal();
      }
    };
    window.addEventListener('keydown', onKey);

    return () => {
      clearInterval(clockId);
      clearTimeout(toastTimer.current);
      window.removeEventListener('trophy', onTrophy);
      window.removeEventListener('keydown', onKey);
      io.disconnect();
      vis.disconnect();
      if (mo) mo.disconnect();
    };
  }, [award, sound]);

  /* ---- navigation ---- */
  const pickCat = useCallback(
    (i, focus) => {
      const n = (i + CATS.length) % CATS.length;
      catRef.current = n;
      itemRef.current = 0;
      setCat(n);
      setItem(0);
      sound.move();
      seen.current.add(n);
      if (seen.current.size === CATS.length) award('scout');
      if (focus && tabs.current[n]) tabs.current[n].focus({ preventScroll: true });
      if (tabs.current[n] && tabs.current[n].scrollIntoView) tabs.current[n].scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    },
    [award, sound]
  );

  const pickItem = useCallback(
    (i, focus) => {
      const len = CATS[catRef.current].items.length;
      const n = (i + len) % len;
      itemRef.current = n;
      setItem(n);
      sound.tick();
      if (focus && links.current[n]) links.current[n].focus({ preventScroll: true });
    },
    [sound]
  );

  const onTabKey = (e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      pickCat(catRef.current + 1, true);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      pickCat(catRef.current - 1, true);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      pickItem(0, true);
    }
  };

  const onItemKey = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      pickItem(itemRef.current + 1, true);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (itemRef.current === 0) tabs.current[catRef.current] && tabs.current[catRef.current].focus({ preventScroll: true });
      else pickItem(itemRef.current - 1, true);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      pickCat(catRef.current + 1, true);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      pickCat(catRef.current - 1, true);
    }
  };

  // Focus the menu once boot ends, if the console is on screen.
  useEffect(() => {
    if (bootDone && inView.current && tabs.current[0] && !window.location.hash) {
      tabs.current[cat] && tabs.current[cat].focus({ preventScroll: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bootDone]);

  // Gamepad (d-pad / left stick + A). Polls only while the console is visible.
  useEffect(() => {
    let raf;
    let last = 0;
    let prevA = false;
    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      if (!inView.current || !navigator.getGamepads) return;
      const gp = Array.from(navigator.getGamepads() || []).find(Boolean);
      if (!gp || now - last < 190) return;
      const x = gp.axes[0] || 0;
      const y = gp.axes[1] || 0;
      const b = gp.buttons;
      const left = (b[14] && b[14].pressed) || x < -0.6;
      const right = (b[15] && b[15].pressed) || x > 0.6;
      const up = (b[12] && b[12].pressed) || y < -0.6;
      const down = (b[13] && b[13].pressed) || y > 0.6;
      const a = b[0] && b[0].pressed;
      if (left || right || up || down) {
        last = now;
        const act = document.activeElement;
        if (left) pickCat(catRef.current - 1, !!(act && act.closest && act.closest('.cs-menu')));
        else if (right) pickCat(catRef.current + 1, !!(act && act.closest && act.closest('.cs-menu')));
        else if (down) pickItem(itemRef.current + 1, true);
        else if (up) pickItem(itemRef.current - 1, true);
      }
      if (a && !prevA && links.current[itemRef.current]) {
        sound.open();
        links.current[itemRef.current].click();
      }
      prevA = !!a;
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [pickCat, pickItem, sound]);

  /* ---- touch swipe on the category row ---- */
  const onTouchStart = (e) => {
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e) => {
    if (!touch.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touch.current.x;
    const dy = t.clientY - touch.current.y;
    touch.current = null;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) pickCat(catRef.current + (dx < 0 ? 1 : -1), false);
  };

  const activate = () => sound.open();

  const toggleSound = () => {
    const v = !soundOn;
    setSoundOn(v);
    sound.setOn(v);
    store.set('sound', v ? '1' : '0');
    if (v) sound.open();
  };

  const classic = () => {
    store.set('view', 'classic');
    document.documentElement.setAttribute('data-view', 'classic');
    const hero = document.getElementById('hero-title');
    if (hero) window.scrollTo({ top: 0, behavior: 'instant' });
  };

  // Pointer tilt and holo shine on the player card (fine pointers only).
  const onCardMove = (e) => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    e.currentTarget.style.setProperty('--rx', `${(0.5 - py) * 12}deg`);
    e.currentTarget.style.setProperty('--ry', `${(px - 0.5) * 14}deg`);
    e.currentTarget.style.setProperty('--sx', `${px * 100}%`);
    e.currentTarget.style.setProperty('--sy', `${py * 100}%`);
  };
  const onCardLeave = (e) => {
    e.currentTarget.style.setProperty('--rx', '0deg');
    e.currentTarget.style.setProperty('--ry', '0deg');
  };

  const c = CATS[cat];

  return (
    <>
      {/* Boot screen: shown only when the head script sets data-boot (first visit of the session). */}
      <div className="boot" aria-hidden="true">
        <div className="boot-inner">
          <div className="boot-mark">
            <Mark />
          </div>
          <div className="boot-name">Amyaaz Aumeer</div>
          <div className="boot-sub">Digital Solutions Architect</div>
          <div className="boot-bar">
            <i />
          </div>
          <div className="boot-hint">Press any key to skip</div>
        </div>
      </div>

      <section
        ref={root}
        className="console"
        id="console"
        aria-label="Portfolio home menu"
        data-shape="wave"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="cs-top">
          <div className="cs-id">
            <span className="cs-dot" aria-hidden="true" />
            <span>Player 1<em style={{ fontStyle: 'normal' }}> · Amyaaz Aumeer</em></span>
          </div>
          <div className="cs-tools">
            <button type="button" className="cs-btn" onClick={() => dialog.current && dialog.current.showModal()} aria-label={`Trophies, ${won.length} of ${TROPHIES.length} collected`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M8 4h8v5a4 4 0 0 1-8 0V4ZM8 6H5v1a3 3 0 0 0 3 3M16 6h3v1a3 3 0 0 1-3 3M12 13v4M9 20h6M10 17h4" />
              </svg>
              <b>{won.length}</b>/{TROPHIES.length}
            </button>
            <button type="button" className="cs-btn" onClick={toggleSound} aria-pressed={soundOn} aria-label="Menu sounds">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 10v4h4l5 4V6l-5 4H4Z" />
                {soundOn ? <path d="M16.5 9a4 4 0 0 1 0 6M19 6.5a8 8 0 0 1 0 11" /> : <path d="m17 9 4 6M21 9l-4 6" />}
              </svg>
              <span>{soundOn ? 'On' : 'Off'}</span>
            </button>
            <span className="cs-clock" aria-hidden="true">{clock}</span>
          </div>
        </div>

        <div className="cs-body">
          <div className="cs-menu">
            <p className="cs-kicker">Zoho developer · Mauritius · Middle East and Africa</p>
            <div className="cs-row-wrap">
              <div className="cs-row" role="tablist" aria-label="Sections" aria-orientation="horizontal">
                {CATS.map((k, i) => (
                  <button
                    key={k.id}
                    ref={(el) => (tabs.current[i] = el)}
                    role="tab"
                    id={`cs-tab-${k.id}`}
                    aria-selected={i === cat}
                    aria-controls="cs-panel"
                    tabIndex={i === cat ? 0 : -1}
                    className={`cs-tile${i === cat ? ' is-on' : ''}`}
                    onClick={() => pickCat(i, true)}
                    onKeyDown={onTabKey}
                  >
                    <span className="cs-ico">
                      <CatIcon id={k.id} />
                    </span>
                    <span className="cs-label">{k.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div id="cs-panel" role="tabpanel" aria-labelledby={`cs-tab-${c.id}`} className="cs-panel">
              <h2 className="cs-title">
                {c.label}
                <small>{c.hint}</small>
              </h2>
              <ul className="cs-items">
                {c.items.map(([label, href], i) => (
                  <li key={c.id + label}>
                    <a
                      ref={(el) => (links.current[i] = el)}
                      href={href}
                      className={`cs-item${i === item ? ' is-on' : ''}`}
                      onFocus={() => { itemRef.current = i; setItem(i); }}
                      onMouseEnter={() => { itemRef.current = i; setItem(i); }}
                      onKeyDown={onItemKey}
                      onClick={activate}
                    >
                      <span>{label}</span>
                      <i aria-hidden="true">→</i>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="cs-legend" aria-hidden="true">
              <span><kbd>←</kbd><kbd>→</kbd> Browse</span>
              <span><kbd>↑</kbd><kbd>↓</kbd> Select</span>
              <span><kbd>⏎</kbd> Open</span>
              <span><kbd>T</kbd> Trophies</span>
            </div>
          </div>

          <aside className="cs-card-wrap" aria-label="Player card">
            <div className="fut" onMouseMove={onCardMove} onMouseLeave={onCardLeave}>
              <div className="fut-shine" aria-hidden="true" />
              <div className="fut-top">
                <div className="fut-ovr">
                  <b>92</b>
                  <span>ARCH</span>
                  <i className="fut-flag" aria-label="Mauritius" role="img" />
                </div>
              </div>
              <div className="fut-emblem" aria-hidden="true">
                <Mark />
              </div>
              <div className="fut-name">AUMEER</div>
              <div className="fut-role">Zoho developer · Port Louis</div>
              <div className="fut-line" />
              <ul className="fut-stats">
                {STATS.map(([abbr, name, v]) => (
                  <li key={abbr} title={name}>
                    <b>{v}</b>
                    <span>{abbr}</span>
                  </li>
                ))}
              </ul>
              <div className="fut-foot">MetaBox Technology · Zoho Partner</div>
            </div>
            <p className="cs-note">Ratings are a bit of fun. The Zoho Creator certificate is real.</p>
          </aside>
        </div>

        <div className="cs-bottom">
          <button type="button" className="cs-classic" onClick={classic}>
            Switch to classic view
          </button>
          <a className="cs-down" href="#hero-title" aria-label="Continue to the full site">
            Full site <span aria-hidden="true">↓</span>
          </a>
        </div>
      </section>

      {/* Trophy toast */}
      <div className={`trophy-toast${toast ? ' is-on' : ''}`} role="status" aria-live="polite">
        {toast && (
          <>
            <span className="tt-ico" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 4h8v5a4 4 0 0 1-8 0V4ZM8 6H5v1a3 3 0 0 0 3 3M16 6h3v1a3 3 0 0 1-3 3M12 13v4M9 20h6M10 17h4" />
              </svg>
            </span>
            <span className="tt-text">
              <small>Trophy unlocked</small>
              <b>{toast.name}</b>
              <em>{toast.desc}</em>
            </span>
          </>
        )}
      </div>

      {/* Trophy case */}
      <dialog ref={dialog} className="trophy-case" aria-label="Trophy case" onClick={(e) => e.target === dialog.current && dialog.current.close()}>
        <div className="tc-head">
          <h2>Trophies</h2>
          <span>
            {won.length} / {TROPHIES.length}
          </span>
          <button type="button" className="cs-btn" onClick={() => dialog.current.close()} aria-label="Close trophy case">
            ✕
          </button>
        </div>
        <div className="tc-bar" aria-hidden="true">
          <i style={{ width: `${(won.length / TROPHIES.length) * 100}%` }} />
        </div>
        <ul className="tc-list">
          {TROPHIES.map((t) => {
            const has = won.includes(t.id);
            return (
              <li key={t.id} className={has ? 'is-won' : ''}>
                <span className="tc-ico" aria-hidden="true">
                  {has ? '★' : '•'}
                </span>
                <span>
                  <b>{t.name}</b>
                  <em>{has ? t.desc : 'Locked'}</em>
                </span>
              </li>
            );
          })}
        </ul>
      </dialog>
    </>
  );
}
