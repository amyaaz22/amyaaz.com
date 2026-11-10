'use client';

// Particle field: one fixed WebGL layer behind the page. Thousands of points morph between
// shapes as sections scroll past. A section opts in with data-shape="wave|ambient|scatter|
// lattice|mark|globe" and optional data-shape-x (fraction of viewport width to shift the
// shape) and data-shape-o (opacity multiplier). Between two shaped elements the morph is
// scrubbed by scroll; inside one the shape holds. Points also drift away from the cursor.
// Skipped entirely for reduced motion, and if WebGL or the CDN is unavailable.

import { useEffect, useRef } from 'react';

const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
const FOV = 50;
const CAM_Z = 10;
const VIEW_H = 2 * CAM_Z * Math.tan((FOV / 2) * (Math.PI / 180));

const gauss = () => (Math.random() + Math.random() + Math.random() + Math.random() - 2) / 2;

// Rough coastlines as [lon, lat] rings: Africa, Madagascar, and the Middle East
// (Arabian Peninsula, Levant, Iraq, Iran, Turkey).
const LAND = [
  [[-17, 15], [-17, 21], [-13, 27.5], [-10, 30], [-6, 35.5], [3, 37], [10, 37.3], [11, 33.5], [15, 32.3], [20, 31], [25, 31.8], [32, 31.3], [34, 27.5], [37, 21], [39, 15.5], [43, 11.8], [51, 11.8], [47.5, 4], [42, -1.5], [39.5, -6], [40.5, -11], [40.5, -15.5], [35, -20], [35.5, -24], [32.8, -26.5], [31, -30], [27, -33.8], [20, -34.8], [18.3, -33], [15, -27], [12, -17.5], [13.5, -12], [12, -5.5], [9, -1], [9.7, 3.7], [6, 4.4], [4.5, 6.3], [-2, 5], [-7.5, 4.5], [-11.5, 6.8], [-15, 11]],
  [[49.3, -12], [50.5, -15.5], [47.5, -24.8], [44, -25], [43.3, -22], [44.5, -16.5], [47, -14.5]],
  [[35, 29.5], [37, 24], [39, 21], [42.5, 16.5], [43.3, 12.7], [45, 12.8], [52, 16.5], [55, 17], [58.8, 20.5], [59.8, 22.5], [56.5, 24.5], [56.4, 26.3], [54, 24.2], [51.5, 24.3], [51.5, 26], [50, 26.5], [48, 29.5], [50.5, 29.5], [56.5, 27], [61.5, 25.2], [63.3, 27.2], [61, 31.5], [61, 36.5], [54, 37.3], [49, 38.5], [44.8, 39.7], [41.5, 41.5], [36, 42], [31.5, 41.2], [29, 41.2], [26.2, 40], [26.5, 38.5], [27.5, 37], [30.5, 36.3], [36, 36.2], [35.8, 34.5], [34.5, 31.3]],
];

function inPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i, i += 1) {
    const xi = poly[i][0];
    const yi = poly[i][1];
    const xj = poly[j][0];
    const yj = poly[j][1];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function sampleMark(n) {
  const path = document.querySelector('.brand svg path');
  const d = path ? path.getAttribute('d') : null;
  if (!d) return null;
  const c = document.createElement('canvas');
  c.width = 200;
  c.height = 200;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.fill(new Path2D(d), 'evenodd');
  const data = ctx.getImageData(0, 0, 200, 200).data;
  const filled = [];
  for (let y = 0; y < 200; y += 1) {
    for (let x = 0; x < 200; x += 1) {
      if (data[(y * 200 + x) * 4 + 3] > 128) filled.push(x, y);
    }
  }
  if (!filled.length) return null;
  const out = new Float32Array(n * 3);
  const S = 5.6 / 200;
  for (let i = 0; i < n; i += 1) {
    const k = Math.floor(Math.random() * (filled.length / 2)) * 2;
    out[i * 3] = (filled[k] + Math.random() - 100) * S;
    out[i * 3 + 1] = -(filled[k + 1] + Math.random() - 97) * S;
    out[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
  }
  return out;
}

function buildShapes(n) {
  const mk = (extra) => ({
    p: new Float32Array(n * 3),
    m: new Float32Array(n), // colour mix: 0 = accent, 1 = accent2
    a: new Float32Array(n).fill(1), // per-point alpha
    energy: 0.02,
    opacity: 0.9,
    wave: 0,
    spin: 0,
    ...extra,
  });
  const shapes = {};

  // Wave: a dotted floor that rolls under the hero.
  const wave = mk({ wave: 1, opacity: 0.85 });
  const cols = Math.ceil(Math.sqrt(n * 2.4));
  const rows = Math.ceil(n / cols);
  for (let i = 0; i < n; i += 1) {
    const c = i % cols;
    const r = Math.floor(i / cols);
    wave.p[i * 3] = (c / (cols - 1) - 0.5) * 24;
    wave.p[i * 3 + 1] = -3.7;
    wave.p[i * 3 + 2] = -12 + (r / Math.max(1, rows - 1)) * 13;
    wave.m[i] = r % 5 === 0 ? 1 : 0;
  }
  shapes.wave = wave;

  // Ambient: a quiet star field behind content sections.
  const ambient = mk({ energy: 0.12, opacity: 0.26 });
  for (let i = 0; i < n; i += 1) {
    ambient.p[i * 3] = (Math.random() - 0.5) * 22;
    ambient.p[i * 3 + 1] = (Math.random() - 0.5) * 11;
    ambient.p[i * 3 + 2] = -8 + Math.random() * 9;
    ambient.m[i] = Math.random() < 0.3 ? 1 : 0;
  }
  shapes.ambient = ambient;

  // Scatter: restless clusters, the "disconnected systems" beat.
  const scatter = mk({ energy: 0.55, opacity: 0.85 });
  const centres = [];
  for (let k = 0; k < 7; k += 1) centres.push([(Math.random() - 0.5) * 12, (Math.random() - 0.5) * 6.4, -3 + Math.random() * 4.5]);
  for (let i = 0; i < n; i += 1) {
    if (Math.random() < 0.2) {
      scatter.p[i * 3] = (Math.random() - 0.5) * 18;
      scatter.p[i * 3 + 1] = (Math.random() - 0.5) * 9;
      scatter.p[i * 3 + 2] = -5 + Math.random() * 6;
    } else {
      const c = centres[i % centres.length];
      scatter.p[i * 3] = c[0] + gauss() * 2.2;
      scatter.p[i * 3 + 1] = c[1] + gauss() * 2.2;
      scatter.p[i * 3 + 2] = c[2] + gauss() * 2.2;
    }
    scatter.m[i] = Math.random() < 0.5 ? 1 : 0;
  }
  shapes.scatter = scatter;

  // Lattice: nodes joined by edges, the "one architecture" beat.
  const lattice = mk({ energy: 0.008, spin: 1 });
  const G = 4;
  const sp = 1.2;
  const half = ((G - 1) * sp) / 2;
  const tx = 0.5;
  const ty = 0.66;
  for (let i = 0; i < n; i += 1) {
    const node = [Math.floor(Math.random() * G), Math.floor(Math.random() * G), Math.floor(Math.random() * G)];
    let jitter = 0.05;
    const pos = [node[0] * sp - half, node[1] * sp - half, node[2] * sp - half];
    if (i % 3 !== 0) {
      const axis = Math.floor(Math.random() * 3);
      if (node[axis] === G - 1) node[axis] -= 1;
      pos[axis] = (node[axis] + Math.random()) * sp - half;
      jitter = 0.008;
      lattice.m[i] = 1;
      lattice.a[i] = 0.5;
    }
    let x = pos[0] + gauss() * jitter;
    let y = pos[1] + gauss() * jitter;
    let z = pos[2] + gauss() * jitter;
    // Bake a tilt so the cube reads as 3D even when still.
    const y1 = y * Math.cos(tx) - z * Math.sin(tx);
    const z1 = y * Math.sin(tx) + z * Math.cos(tx);
    y = y1;
    z = z1;
    const x2 = x * Math.cos(ty) + z * Math.sin(ty);
    const z2 = -x * Math.sin(ty) + z * Math.cos(ty);
    x = x2;
    z = z2;
    lattice.p[i * 3] = x;
    lattice.p[i * 3 + 1] = y;
    lattice.p[i * 3 + 2] = z;
  }
  shapes.lattice = lattice;

  // Mark: the logo, sampled from the header SVG.
  const markPts = sampleMark(n);
  if (markPts) {
    const mark = mk({ energy: 0.02, opacity: 0.95, spin: 0.35 });
    mark.p = markPts;
    shapes.mark = mark;
  } else {
    shapes.mark = lattice;
  }

  // Globe: a dim sphere with Africa and the Middle East drawn in dense points, and a
  // bright marker on Mauritius. Outlines are rough [lon, lat] polygons.
  const globe = mk({ energy: 0.008, spin: 0.5 });
  const R = 2.35;
  const LON0 = 34; // longitude that faces the viewer
  const put = (i, lonDeg, latDeg, r) => {
    const lat = (latDeg * Math.PI) / 180;
    const lon = ((lonDeg - LON0) * Math.PI) / 180;
    globe.p[i * 3] = Math.sin(lon) * Math.cos(lat) * r;
    globe.p[i * 3 + 1] = Math.sin(lat) * r;
    globe.p[i * 3 + 2] = Math.cos(lon) * Math.cos(lat) * r;
  };
  const nSphere = Math.floor(n * 0.42);
  const nMarker = Math.floor(n * 0.012);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < nSphere; i += 1) {
    const y = 1 - (i / (nSphere - 1)) * 2;
    const rad = Math.sqrt(1 - y * y);
    const th = i * golden;
    globe.p[i * 3] = Math.sin(th) * rad * R;
    globe.p[i * 3 + 1] = y * R;
    globe.p[i * 3 + 2] = Math.cos(th) * rad * R;
    globe.m[i] = 1;
    globe.a[i] = 0.3;
  }
  for (let i = nSphere; i < n - nMarker; i += 1) {
    let lon = 0;
    let lat = 0;
    for (let tries = 0; tries < 60; tries += 1) {
      lon = -18 + Math.random() * 82;
      lat = (Math.asin(-0.58 + Math.random() * 1.25) * 180) / Math.PI; // area-uniform in latitude
      if (LAND.some((poly) => inPoly(lon, lat, poly))) break;
    }
    put(i, lon, lat, R * 1.012);
    globe.m[i] = 0;
    globe.a[i] = 0.95;
  }
  for (let i = n - nMarker; i < n; i += 1) {
    put(i, 57.55 + gauss() * 0.9, -20.3 + gauss() * 0.9, R * (1.03 + Math.random() * 0.05));
    globe.m[i] = 0.5;
    globe.a[i] = 1;
  }
  shapes.globe = globe;

  return shapes;
}

const smooth = (t) => t * t * (3 - 2 * t);

export default function ParticleField() {
  const mountRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    let disposed = false;
    let raf = 0;
    let renderer = null;
    let cleanup = () => {};

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
        renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' });
      } catch {
        return;
      }

      const small = window.innerWidth < 900;
      const N = small ? 5000 : 13000;
      const shapes = buildShapes(N);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
      camera.position.z = CAM_Z;

      const cur = new Float32Array(N * 3);
      const mixArr = new Float32Array(N);
      const alphaArr = new Float32Array(N);
      const sizeArr = new Float32Array(N);
      const phase = new Float32Array(N);
      const lag = new Float32Array(N);
      for (let i = 0; i < N; i += 1) {
        // Start scattered so the first shape assembles on load.
        cur[i * 3] = (Math.random() - 0.5) * 26;
        cur[i * 3 + 1] = (Math.random() - 0.5) * 14;
        cur[i * 3 + 2] = -10 + Math.random() * 12;
        sizeArr[i] = 0.5 + Math.random();
        phase[i] = Math.random() * Math.PI * 2;
        lag[i] = 0.55 + Math.random() * 0.9;
      }

      const geo = new THREE.BufferGeometry();
      const posAttr = new THREE.BufferAttribute(cur, 3);
      const mixAttr = new THREE.BufferAttribute(mixArr, 1);
      const alphaAttr = new THREE.BufferAttribute(alphaArr, 1);
      posAttr.setUsage(THREE.DynamicDrawUsage);
      mixAttr.setUsage(THREE.DynamicDrawUsage);
      alphaAttr.setUsage(THREE.DynamicDrawUsage);
      geo.setAttribute('position', posAttr);
      geo.setAttribute('aMix', mixAttr);
      geo.setAttribute('aAlpha', alphaAttr);
      geo.setAttribute('aSize', new THREE.BufferAttribute(sizeArr, 1));

      const mat = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        depthTest: false,
        uniforms: {
          uC1: { value: new THREE.Color('#4ade80') },
          uC2: { value: new THREE.Color('#818cf8') },
          uOpacity: { value: 0 },
          uScale: { value: 1 },
          uSize: { value: 0.05 },
        },
        vertexShader: `
          attribute float aMix; attribute float aAlpha; attribute float aSize;
          uniform float uScale; uniform float uSize;
          varying float vMix; varying float vAlpha;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = max(1.0, uSize * aSize * uScale / -mv.z);
            vMix = aMix;
            vAlpha = aAlpha * smoothstep(-24.0, -8.0, mv.z);
          }`,
        fragmentShader: `
          uniform vec3 uC1; uniform vec3 uC2; uniform float uOpacity;
          varying float vMix; varying float vAlpha;
          void main() {
            float d = length(gl_PointCoord - 0.5);
            float a = smoothstep(0.5, 0.08, d) * vAlpha * uOpacity;
            if (a < 0.004) discard;
            gl_FragColor = vec4(mix(uC1, uC2, vMix), a);
          }`,
      });
      const points = new THREE.Points(geo, mat);
      points.frustumCulled = false;
      scene.add(points);

      let themeFactor = 1;
      const applyTheme = () => {
        const light = document.documentElement.getAttribute('data-theme') === 'light';
        mat.uniforms.uC1.value.set(light ? '#15803d' : '#4ade80');
        mat.uniforms.uC2.value.set(light ? '#4f46e5' : '#818cf8');
        mat.blending = light ? THREE.NormalBlending : THREE.AdditiveBlending;
        mat.needsUpdate = true;
        themeFactor = light ? 0.75 : 1;
      };
      applyTheme();
      const themeObs = new MutationObserver(applyTheme);
      themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

      let viewW = VIEW_H;
      let narrow = small;
      const resize = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const pr = Math.min(window.devicePixelRatio || 1, 1.75);
        renderer.setPixelRatio(pr);
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        viewW = VIEW_H * camera.aspect;
        narrow = w < 900;
        mat.uniforms.uScale.value = (h * pr) / (2 * Math.tan((FOV / 2) * (Math.PI / 180)));
      };
      resize();
      mount.appendChild(renderer.domElement);
      window.addEventListener('resize', resize);

      // Pointer in world units on the z = 0 plane; far away until the mouse moves.
      const ptr = { x: 999, y: 999 };
      const onMove = (e) => {
        ptr.x = (e.clientX / window.innerWidth - 0.5) * viewW;
        ptr.y = -(e.clientY / window.innerHeight - 0.5) * VIEW_H;
      };
      const onLeave = () => {
        ptr.x = 999;
        ptr.y = 999;
      };
      const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      if (finePointer) {
        window.addEventListener('pointermove', onMove, { passive: true });
        document.addEventListener('pointerleave', onLeave);
      }

      // Which shapes are in play for the current scroll position.
      let anchors = [];
      let anchorsAt = -1e9;
      const readAnchor = (el) => ({
        shape: shapes[el.getAttribute('data-shape')] || shapes.ambient,
        x: parseFloat(el.getAttribute('data-shape-x') || '0') || 0,
        o: parseFloat(el.getAttribute('data-shape-o') || '1') || 1,
      });
      const DEFAULT = { shape: shapes.ambient, x: 0, o: 1 };
      const pick = (now) => {
        if (now - anchorsAt > 1000) {
          anchors = Array.from(document.querySelectorAll('[data-shape]'));
          anchorsAt = now;
        }
        const c = window.innerHeight / 2;
        let above = null;
        let aboveBottom = -Infinity;
        let below = null;
        let belowTop = Infinity;
        for (let i = 0; i < anchors.length; i += 1) {
          const r = anchors[i].getBoundingClientRect();
          if (r.top <= c && r.bottom >= c) {
            const a = readAnchor(anchors[i]);
            return [a, a, 0];
          }
          if (r.bottom < c && r.bottom > aboveBottom) {
            aboveBottom = r.bottom;
            above = anchors[i];
          }
          if (r.top > c && r.top < belowTop) {
            belowTop = r.top;
            below = anchors[i];
          }
        }
        if (above && below) {
          const t = Math.min(1, Math.max(0, (c - aboveBottom) / Math.max(1, belowTop - aboveBottom)));
          return [readAnchor(above), readAnchor(below), smooth(t)];
        }
        if (above) {
          const a = readAnchor(above);
          return [a, a, 0];
        }
        if (below) {
          const b = readAnchor(below);
          return [b, b, 0];
        }
        return [DEFAULT, DEFAULT, 0];
      };

      let time = 0;
      let last = performance.now();
      let shown = 0;
      const frame = (now) => {
        if (disposed) return;
        const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
        last = now;
        time += dt;

        const [A, B, t] = pick(now);
        const sa = A.shape;
        const sb = B.shape;
        const u = 1 - t;
        const energy = sa.energy * u + sb.energy * t;
        const waveAmt = sa.wave * u + sb.wave * t;
        const spin = sa.spin * u + sb.spin * t;
        const ox = narrow ? 0 : (A.x * u + B.x * t) * viewW;
        const scale = Math.min(1, viewW / 9.5);
        const rot = Math.sin(time * 0.25) * 0.45 * spin;
        const cosR = Math.cos(rot);
        const sinR = Math.sin(rot);
        const k = 1 - Math.exp(-dt * 3.2);
        const pa = sa.p;
        const pb = sb.p;
        const R2 = 1.7 * 1.7;

        for (let i = 0; i < N; i += 1) {
          const j = i * 3;
          let x = pa[j] * u + pb[j] * t;
          let y = pa[j + 1] * u + pb[j + 1] * t;
          let z = pa[j + 2] * u + pb[j + 2] * t;
          if (spin > 0.001) {
            const rx = x * cosR + z * sinR;
            z = -x * sinR + z * cosR;
            x = rx;
          }
          if (waveAmt > 0.001) {
            y += (Math.sin(x * 0.55 + time * 0.9) * 0.28 + Math.sin(z * 0.8 + time * 0.6) * 0.22) * waveAmt;
          } else {
            x *= scale;
            y *= scale;
            z *= scale;
          }
          const ph = phase[i];
          x += Math.sin(time * (0.5 + lag[i] * 0.5) + ph) * energy + ox;
          y += Math.cos(time * (0.4 + lag[i] * 0.6) + ph * 1.7) * energy;
          z += Math.sin(time * 0.45 + ph * 2.3) * energy;

          const dx = x - ptr.x;
          const dy = y - ptr.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < R2) {
            const d = Math.sqrt(d2) + 0.0001;
            const push = (1 - d / 1.7) * (1 - d / 1.7) * 0.9;
            x += (dx / d) * push;
            y += (dy / d) * push;
          }

          const ki = Math.min(1, k * lag[i]);
          cur[j] += (x - cur[j]) * ki;
          cur[j + 1] += (y - cur[j + 1]) * ki;
          cur[j + 2] += (z - cur[j + 2]) * ki;
          mixArr[i] += (sa.m[i] * u + sb.m[i] * t - mixArr[i]) * ki;
          alphaArr[i] += (sa.a[i] * u + sb.a[i] * t - alphaArr[i]) * ki;
        }
        posAttr.needsUpdate = true;
        mixAttr.needsUpdate = true;
        alphaAttr.needsUpdate = true;

        const target = (sa.opacity * A.o * u + sb.opacity * B.o * t) * themeFactor * (narrow ? 0.6 : 1);
        shown += (target - shown) * Math.min(1, dt * 2.5);
        mat.uniforms.uOpacity.value = shown;

        renderer.render(scene, camera);
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);

      cleanup = () => {
        window.removeEventListener('resize', resize);
        window.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerleave', onLeave);
        themeObs.disconnect();
        geo.dispose();
        mat.dispose();
      };
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      cleanup();
      if (renderer) {
        renderer.dispose();
        renderer.domElement.remove();
      }
    };
  }, []);

  return <div className="particle-field" ref={mountRef} aria-hidden="true" />;
}
