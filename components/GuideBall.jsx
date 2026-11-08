'use client';

// A 3D guide ball that walks the visitor down the page as they scroll.
// Click it to jump to the next section, or start the guided tour.
// Three.js is loaded from jsDelivr at runtime, so the static build stays small.
// If WebGL or the CDN is unavailable, the ball simply does not render and the
// tour button and scroll progress bar keep working.

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

function currentIndex() {
  const mid = window.scrollY + window.innerHeight * 0.4;
  let idx = 0;
  STOPS.forEach((s, i) => {
    if (s.id && topOf(s.id) <= mid) idx = i;
  });
  return idx;
}

function goTo(i) {
  const stop = STOPS[i];
  const top = stop.id ? Math.max(0, topOf(stop.id) - HEADER_OFFSET) : 0;
  window.scrollTo({ top, behavior: reduceMotion() ? 'auto' : 'smooth' });
}

export default function GuideBall() {
  const wrapRef = useRef(null);
  const mountRef = useRef(null);
  const barRef = useRef(null);
  const indexRef = useRef(0);
  const [index, setIndex] = useState(0);
  const [touring, setTouring] = useState(false);

  // Keep the label in sync with where the visitor is.
  useEffect(() => {
    const onScroll = () => {
      const i = currentIndex();
      if (i !== indexRef.current) {
        indexRef.current = i;
        setIndex(i);
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Guided tour: walk section by section until the end, or until the visitor takes over.
  useEffect(() => {
    if (!touring) return undefined;
    let i = currentIndex();
    const stop = () => setTouring(false);
    const step = () => {
      i += 1;
      if (i >= STOPS.length) return stop();
      goTo(i);
    };
    const timer = setInterval(step, TOUR_MS);
    step();
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

  // 3D ball: loaded and animated only in the browser.
  useEffect(() => {
    let disposed = false;
    let raf = 0;
    let renderer = null;
    const reduce = reduceMotion();

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
      const size = mount.clientWidth || 96;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(size, size);
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
      camera.position.z = 4.4;

      scene.add(new THREE.AmbientLight(0xffffff, 0.35));
      const key = new THREE.DirectionalLight(0xffffff, 2.2);
      key.position.set(3, 4, 5);
      scene.add(key);
      const fill = new THREE.DirectionalLight(0x818cf8, 0.9);
      fill.position.set(-4, -2, 2);
      scene.add(fill);

      const ball = new THREE.Mesh(
        new THREE.SphereGeometry(1, 64, 64),
        new THREE.MeshPhysicalMaterial({
          color: 0x4ade80,
          roughness: 0.22,
          metalness: 0.05,
          clearcoat: 1,
          clearcoatRoughness: 0.12,
          emissive: 0x0a3d1f,
          emissiveIntensity: 0.35,
        })
      );
      scene.add(ball);

      const TILT = Math.PI / 2.6;
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.45, 0.012, 16, 180),
        new THREE.MeshBasicMaterial({ color: 0x818cf8 })
      );
      ring.rotation.x = TILT;
      scene.add(ring);

      const sat = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 24, 24),
        new THREE.MeshBasicMaterial({ color: 0xf472b6 })
      );
      scene.add(sat);

      const pad = 8;
      let curY = null;
      let prevY = null;
      let t = 0;
      let last = performance.now();

      const tick = (now) => {
        if (disposed) return;
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        if (!reduce) t += dt;

        const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const p = Math.min(1, window.scrollY / max);
        if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;

        const travel = window.innerHeight - size - pad * 2;
        const target = pad + p * Math.max(0, travel);
        curY = curY === null ? target : curY + (target - curY) * 0.12;
        const v = prevY === null ? 0 : curY - prevY;
        prevY = curY;

        if (wrapRef.current) {
          const bob = reduce ? 0 : Math.sin(t * 3) * 3;
          wrapRef.current.style.transform = `translate3d(0, ${(curY + bob).toFixed(1)}px, 0)`;
        }

        // Roll toward the direction of travel and squash slightly while moving.
        ball.rotation.y += 0.008 + Math.abs(v) * 0.04;
        ball.rotation.x = reduce ? 0 : Math.sin(t) * 0.18;
        const sq = Math.min(0.08, Math.abs(v) * 0.5);
        ball.scale.set(1 + sq, 1 - sq, 1 + sq * 0.5);

        ring.rotation.z += reduce ? 0 : 0.005;
        const a = t * 1.3;
        sat.position.set(
          Math.cos(a) * 1.45,
          Math.sin(a) * Math.cos(TILT) * 1.45,
          Math.sin(a) * Math.sin(TILT) * 1.45
        );

        renderer.render(scene, camera);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
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
      <div className="guide-wrap" ref={wrapRef}>
        <button
          type="button"
          className="guide-ball"
          onClick={next}
          aria-label={`Guide. You are in ${STOPS[index].label}. Activate to go to the next section.`}
        >
          <span className="guide-mount" ref={mountRef} aria-hidden="true" />
          <span className="guide-label" aria-hidden="true">{STOPS[index].label}</span>
        </button>
      </div>
      <button
        type="button"
        className="guide-tour"
        aria-pressed={touring}
        onClick={() => setTouring((v) => !v)}
      >
        {touring ? 'Stop tour' : 'Take the tour'}
      </button>
    </>
  );
}
