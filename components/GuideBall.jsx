'use client';

// Guide rail: a slim track in the right gutter (desktop only) with a football that glides
// with scroll. The ball tilts toward the cursor, clicking it advances a section, the dots
// jump to sections, and the tour button walks the page. Three.js loads from jsDelivr at
// runtime; if WebGL or the CDN is unavailable the rail still works without the 3D ball.

import { useEffect, useRef, useState } from 'react';

const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
const BALL_PX = 62; // keep in sync with .guide-ball / .guide-ball-wrap width in preview.css
const RAIL_MIN_WIDTH = 1280; // keep in sync with the .guide-rail breakpoint in preview.css

// Builds a real truncated-icosahedron ball: 12 pentagons (at the icosahedron's vertices)
// and 20 hexagons (at its faces), each panel curved onto the sphere so the silhouette
// stays round while the seams read as true geometry, not a flat decal.
function buildFootballGeometry(THREE, radius) {
  const t = (1 + Math.sqrt(5)) / 2;
  const verts = [
    [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
    [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
    [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1],
  ].map((v) => new THREE.Vector3(...v).normalize());

  const faces = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
  ];

  // Point 1/3 of the way from vertex u to vertex v, projected back onto the sphere.
  const trunc = (u, v) => verts[u].clone().multiplyScalar(2 / 3).add(verts[v].clone().multiplyScalar(1 / 3)).normalize();

  // The five faces meeting at vertex `u`, chained into cyclic order so the resulting
  // pentagon winds the right way: each face contributes "after n1 comes n2" at u.
  const neighborsAround = (u) => {
    const next = new Map();
    faces.forEach((f) => {
      const i = f.indexOf(u);
      if (i === -1) return;
      next.set(f[(i + 1) % 3], f[(i + 2) % 3]);
    });
    const start = next.keys().next().value;
    const order = [start];
    for (let k = 0; k < next.size - 1; k += 1) order.push(next.get(order[order.length - 1]));
    return order;
  };

  const positions = [];
  const colors = [];
  const BLACK = [0.04, 0.04, 0.05];
  const WHITE = [0.96, 0.96, 0.94];

  const addPanel = (ring, color) => {
    const center = ring.reduce((a, p) => a.add(p), new THREE.Vector3()).normalize();
    const n = ring.length;
    for (let i = 0; i < n; i += 1) {
      const a = center;
      const b = ring[i];
      const c = ring[(i + 1) % n];
      [a, b, c].forEach((p, k) => {
        positions.push(p.x * radius, p.y * radius, p.z * radius);
        // Darken a touch toward the panel's outer ring, like a soft seam bevel.
        const shade = k === 0 ? 1 : 0.82;
        colors.push(color[0] * shade, color[1] * shade, color[2] * shade);
      });
    }
  };

  // 12 pentagons, one per original vertex.
  for (let u = 0; u < 12; u += 1) {
    addPanel(neighborsAround(u).map((v) => trunc(u, v)), BLACK);
  }
  // 20 hexagons, one per original triangular face.
  faces.forEach(([a, b, c]) => {
    addPanel([trunc(a, b), trunc(b, a), trunc(b, c), trunc(c, b), trunc(c, a), trunc(a, c)], WHITE);
  });

  // Normals equal to the normalized position: every panel is a patch of the same
  // sphere, so this shades it as perfectly round instead of faceted triangle fans.
  const normals = new Float32Array(positions.length);
  for (let i = 0; i < positions.length; i += 3) {
    const inv = 1 / radius;
    normals[i] = positions[i] * inv;
    normals[i + 1] = positions[i + 1] * inv;
    normals[i + 2] = positions[i + 2] * inv;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  return geo;
}

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

  // Football: loaded only in the browser, and only where the rail is actually shown —
  // the rail is desktop-only, so there is no point spending a WebGL context on mobile.
  useEffect(() => {
    if (!window.matchMedia(`(min-width: ${RAIL_MIN_WIDTH}px)`).matches) return undefined;
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
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
      } catch {
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.5));
      renderer.setSize(BALL_PX, BALL_PX);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 100);
      camera.position.z = 5.2;

      // A soft studio rig rather than one flat light: a cool sky/ground wash, a bright
      // key light for the roll-off highlight, and a dim rim to separate the ball's edge.
      scene.add(new THREE.HemisphereLight(0xeaf2ff, 0x1a1a1f, 0.65));
      const key = new THREE.DirectionalLight(0xffffff, 2.1);
      key.position.set(2.6, 3.4, 4.2);
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xcfe0ff, 0.35);
      fill.position.set(-3, -1, 2);
      scene.add(fill);
      const rim = new THREE.DirectionalLight(0xffffff, 0.9);
      rim.position.set(-2.4, 1.6, -3.2);
      scene.add(rim);

      const ball = new THREE.Group();
      const geo = buildFootballGeometry(THREE, 1);
      const material = new THREE.MeshPhysicalMaterial({
        vertexColors: true,
        roughness: 0.3,
        metalness: 0.04,
        clearcoat: 0.85,
        clearcoatRoughness: 0.18,
        envMapIntensity: 0.9,
      });
      ball.add(new THREE.Mesh(geo, material));
      // A thin dark seam between every panel, drawn as wireframe over the same geometry.
      ball.add(new THREE.LineSegments(new THREE.WireframeGeometry(geo), new THREE.LineBasicMaterial({ color: 0x0a0a0a, transparent: true, opacity: 0.55 })));
      ball.rotation.set(-0.28, 0.5, 0.1);
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
        ball.rotation.x = -0.28 + tilt.x + (reduce ? 0 : Math.sin(t * 0.9) * 0.1);
        ball.rotation.y = 0.5 + tilt.y + (reduce ? 0 : t * 0.55);

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
