'use client';

// Guide rail: a slim track in the right gutter (desktop only) with a football that glides
// with scroll. The ball tilts toward the cursor, clicking it advances a section, the dots
// jump to sections, and the tour button walks the page. Three.js loads from jsDelivr at
// runtime; if WebGL or the CDN is unavailable the rail still works without the 3D ball.

import { useEffect, useRef, useState } from 'react';

const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const STOPS = [
  { id: null, label: 'Intro' },
  { id: 'services', label: 'Services' },
  { id: 'work', label: 'Work' },
  { id: 'articles', label: 'Articles' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
];

const HEADER_OFFSET = 72;
const TOUR_MS = 3200;
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function topOf(id) {
  if (!id) return 0;
  const el = document.getElementById(id);
  return el ? el.getBoundingClientRect().top + window.scrollY : 0;
}

// Continuous position along the stops: 0 at Intro, 1 at Services, ... fractional in between.
function stopPosition() {
  const y = window.scrollY + window.innerHeight * 0.4;
  const tops = STOPS.map((s) => topOf(s.id));
  let i = 0;
  tops.forEach((t, k) => {
    if (t <= y) i = k;
  });
  if (i >= tops.length - 1) return tops.length - 1;
  const a = tops[i];
  const b = tops[i + 1];
  const f = b > a ? Math.min(1, Math.max(0, (y - a) / (b - a))) : 0;
  return i + f;
}

function goTo(i) {
  const stop = STOPS[i];
  const top = stop.id ? Math.max(0, topOf(stop.id) - HEADER_OFFSET) : 0;
  window.scrollTo({ top, behavior: reduceMotion() ? 'auto' : 'smooth' });
}

export default function GuideBall() {
  const trackRef = useRef(null);
  const ballRef = useRef(null);
  const fillRef = useRef(null);
  const mountRef = useRef(null);
  const barRef = useRef(null);
  const indexRef = useRef(0);
  const tiltRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const [index, setIndex] = useState(0);
  const [touring, setTouring] = useState(false);

  // Position the ball, fill and progress bar every frame (cheap, no React re-renders).
  useEffect(() => {
    let raf = 0;
    let curY = null;
    const last = STOPS.length - 1;
    const tick = () => {
      const trackH = trackRef.current ? trackRef.current.clientHeight : 0;
      const pos = stopPosition();
      const targetY = (pos / last) * trackH;
      curY = curY === null ? targetY : curY + (targetY - curY) * 0.14;
      if (ballRef.current) ballRef.current.style.transform = `translate3d(0, ${curY.toFixed(1)}px, 0)`;
      if (fillRef.current) fillRef.current.style.height = `${curY.toFixed(1)}px`;

      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      if (barRef.current) barRef.current.style.transform = `scaleX(${Math.min(1, window.scrollY / max)})`;

      const i = Math.min(last, Math.floor(pos + 0.0001));
      if (i !== indexRef.current) {
        indexRef.current = i;
        setIndex(i);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Guided tour: walk section by section until the end, or until the visitor takes over.
  useEffect(() => {
    if (!touring) return undefined;
    let i = indexRef.current;
    const stop = () => setTouring(false);
    const timer = setInterval(() => {
      i += 1;
      if (i >= STOPS.length) return stop();
      goTo(i);
    }, TOUR_MS);
    i += 1;
    if (i < STOPS.length) goTo(i);
    const onKey = (e) => {
      if (e.key === 'Escape') stop();
    };
    window.addEventListener('wheel', stop, { passive: true });
    window.addEventListener('touchstart', stop, { passive: true });
    window.addEventListener('keydown', onKey);
    return () => {
      clearInterval(timer);
      window.removeEventListener('wheel', stop);
      window.removeEventListener('touchstart', stop);
      window.removeEventListener('keydown', onKey);
    };
  }, [touring]);

  // Football: loaded only in the browser. Tilts toward the cursor and rolls as it moves.
  useEffect(() => {
    let disposed = false;
    let raf = 0;
    let renderer = null;
    const reduce = reduceMotion();
    const tilt = tiltRef.current;

    const onMove = (e) => {
      const el = ballRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / 320;
      const dy = (e.clientY - (r.top + r.height / 2)) / 320;
      tilt.ty = Math.max(-0.7, Math.min(0.7, dx));
      tilt.tx = Math.max(-0.5, Math.min(0.5, dy));
    };
    const onLeave = () => {
      tilt.tx = 0;
      tilt.ty = 0;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);

    (async () => {
      let THREE;
      try {
        THREE = await import(/* webpackIgnore: true */ THREE_URL);
      } catch {
        return;
      }
      const mount = mountRef.current;
      if (disposed || !mount) return;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      } catch {
        return;
      }
      const size = 44;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(size, size);
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
      camera.position.z = 4.6;
      scene.add(new THREE.AmbientLight(0xffffff, 0.75));
      const key = new THREE.DirectionalLight(0xffffff, 1.6);
      key.position.set(3, 4, 5);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0xffffff, 0.5);
      rim.position.set(-4, -2, -3);
      scene.add(rim);

      // Classic football: a white ball with twelve black pentagons centred on the
      // directions of an icosahedron's vertices.
      const ball = new THREE.Group();
      const white = new THREE.MeshPhysicalMaterial({ color: 0xf7f7f5, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.2 });
      ball.add(new THREE.Mesh(new THREE.SphereGeometry(1, 64, 64), white));

      const black = new THREE.MeshStandardMaterial({ color: 0x0d0d0f, roughness: 0.42, metalness: 0.05 });
      const shape = new THREE.Shape();
      for (let k = 0; k < 5; k += 1) {
        const ang = (k * Math.PI * 2) / 5 + Math.PI / 2;
        const x = Math.cos(ang) * 0.3;
        const y = Math.sin(ang) * 0.3;
        if (k === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
      }
      shape.closePath();
      const pentGeo = new THREE.ShapeGeometry(shape);

      const phi = (1 + Math.sqrt(5)) / 2;
      const dirs = [];
      [-1, 1].forEach((a) => {
        [-phi, phi].forEach((b) => {
          dirs.push([0, a, b], [a, b, 0], [b, 0, a]);
        });
      });
      dirs.forEach(([x, y, z]) => {
        const v = new THREE.Vector3(x, y, z).normalize();
        const patch = new THREE.Mesh(pentGeo, black);
        patch.position.copy(v.clone().multiplyScalar(1.02));
        patch.lookAt(v.clone().multiplyScalar(2));
        ball.add(patch);
      });
      scene.add(ball);

      let t = 0;
      let last = performance.now();
      const render = (now) => {
        if (disposed) return;
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        if (!reduce) t += dt;

        tilt.x += (tilt.tx - tilt.x) * 0.12;
        tilt.y += (tilt.ty - tilt.y) * 0.12;
        ball.rotation.x = tilt.x + (reduce ? 0 : Math.sin(t * 0.9) * 0.15);
        ball.rotation.y = tilt.y + (reduce ? 0 : t * 0.7);

        renderer.render(scene, camera);
        raf = requestAnimationFrame(render);
      };
      raf = requestAnimationFrame(render);
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      if (renderer) {
        renderer.dispose();
        renderer.domElement.remove();
      }
    };
  }, []);

  const next = () => {
    const i = indexRef.current + 1;
    goTo(i >= STOPS.length ? 0 : i);
  };

  return (
    <>
      <div className="scroll-progress" ref={barRef} aria-hidden="true" />
      <aside className="guide-rail" aria-label="Page guide">
        <div className="guide-stage" ref={trackRef}>
          <div className="guide-line" aria-hidden="true" />
          <div className="guide-fill" ref={fillRef} aria-hidden="true" />
          {STOPS.map((s, i) => (
            <button
              key={s.label}
              type="button"
              className={`guide-dot${i === index ? ' is-on' : ''}`}
              style={{ top: `${(i / (STOPS.length - 1)) * 100}%` }}
              onClick={() => goTo(i)}
              aria-label={`Go to ${s.label}`}
            >
              <span>{s.label}</span>
            </button>
          ))}
          <div className="guide-ball-wrap" ref={ballRef}>
            <button
              type="button"
              className="guide-ball"
              onClick={next}
              aria-label={`Guide. You are in ${STOPS[index].label}. Activate to go to the next section.`}
            >
              <span className="guide-mount" ref={mountRef} aria-hidden="true" />
            </button>
            <span className="guide-label" aria-hidden="true">{STOPS[index].label}</span>
          </div>
        </div>
        <button
          type="button"
          className="guide-tour"
          aria-pressed={touring}
          onClick={() => setTouring((v) => !v)}
        >
          {touring ? 'Stop' : 'Tour'}
        </button>
      </aside>
    </>
  );
}
