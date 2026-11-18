'use client';

import { useEffect, useRef, useState } from 'react';

/* ----------------------------------------------------------------------------
   Interactive studio: a procedural 3D room (no model files) with a laptop, a
   window onto Port Louis that follows the island's real time of day, and
   clickable objects that fly the camera in and link to real sections.
---------------------------------------------------------------------------- */

const HOT = {
  laptop: { label: 'Open the portfolio', title: 'Open the portfolio', text: 'Booting up…', pose: { p: [0.15, 1.02, -0.62], l: [0.15, 1.0, -1.75] } },
  work: { label: 'Work', title: 'Real systems, shipped', text: 'MRA e-invoicing, VAT returns in the MRA format and approval workflows, built on Zoho.', href: '#work', cta: 'See the work', pose: { p: [1.1, 1.65, 1.7], l: [3.3, 1.6, -0.55] } },
  credentials: { label: 'Credentials', title: 'Certified and recognised', text: 'Zoho certification and recognition, framed on the wall.', href: '#credential', cta: 'See credentials', pose: { p: [-1.2, 1.65, 1.6], l: [-3.3, 1.65, -0.25] } },
  globe: { label: 'Middle East and Africa', title: 'Zoho delivery across the region', text: 'Based in Mauritius, working remotely with teams in the Middle East and Africa.', href: '/zoho-developer-middle-east-africa/', cta: 'Middle East and Africa', pose: { p: [-0.15, 1.2, 0.15], l: [-0.45, 0.98, -1.3] } },
  phone: { label: 'Contact', title: 'Start a project', text: 'Tell me what your business runs on and what is slowing it down.', href: '#contact', cta: 'Get in touch', pose: { p: [0.75, 1.2, -0.35], l: [0.88, 0.82, -1.1] } },
  books: { label: 'Articles', title: 'Writing on the Zoho stack', text: 'Notes on Deluge, Creator, Flow and Catalyst from real projects.', href: '#articles', cta: 'Read the articles', pose: { p: [-0.95, 1.2, -0.35], l: [-1.15, 0.86, -1.3] } },
  ball: { label: 'Penalty shoot-out', title: 'Take a penalty', text: 'A small game hidden on the site. Beat the keeper.', href: '#coach', cta: 'Play', pose: { p: [-1.1, 0.85, 1.7], l: [-2.0, 0.15, 0.4] } },
  window: { label: 'Port Louis', title: 'Home base: Port Louis', text: 'Mauritius. The sky outside follows the real time of day on the island.', pose: { p: [0, 1.7, -0.3], l: [0, 1.9, -8] } },
};

const ORDER = ['laptop', 'work', 'credentials', 'globe', 'phone', 'books', 'ball', 'window'];
const PHASES = ['day', 'golden', 'night'];
const PHASE_LABEL = { day: 'Day', golden: 'Golden hour', night: 'Night' };

function portLouisClock() {
  const d = new Date(Date.now() + 4 * 3600 * 1000);
  return { h: d.getUTCHours() + d.getUTCMinutes() / 60, text: `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}` };
}
function phaseFor(h) {
  if (h >= 6 && h < 16.5) return 'day';
  if ((h >= 16.5 && h < 19) || (h >= 5.5 && h < 6)) return 'golden';
  return 'night';
}

function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export default function StudioRoom() {
  const mount = useRef(null);
  const ui = useRef({});
  const api = useRef({});
  const [active, setActive] = useState(null);
  const [phase, setPhase] = useState('day');
  const [clock, setClock] = useState('');
  const [status, setStatus] = useState('loading'); // loading | ready | fallback

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarse = window.matchMedia('(pointer: coarse)').matches;

    (async () => {
      let THREE;
      try {
        THREE = await import('three');
      } catch (e) {
        if (!disposed) setStatus('fallback');
        return;
      }
      if (disposed || !mount.current) return;

      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: !coarse, alpha: false, powerPreference: 'high-performance' });
      } catch (e) {
        setStatus('fallback');
        return;
      }
      const box = mount.current;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.6 : 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.shadowMap.enabled = !coarse;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      box.appendChild(renderer.domElement);
      renderer.domElement.setAttribute('aria-hidden', 'true');

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 80);
      const V3 = THREE.Vector3;

      /* ------------------------------------------------ helpers */
      const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.65, metalness: 0.05, ...o });
      const hotGroups = {};
      const hotMeshes = [];
      const reg = (id, obj) => {
        hotGroups[id] = obj;
        obj.traverse((m) => {
          if (m.isMesh) {
            m.userData.hot = id;
            hotMeshes.push(m);
            if (m.material && m.material.emissive) {
              m.userData.em0 = m.material.emissive.clone();
              m.userData.ei0 = m.material.emissiveIntensity;
            }
          }
        });
      };
      const mesh = (geo, mat, x = 0, y = 0, z = 0, parent = scene) => {
        const m = new THREE.Mesh(geo, mat);
        m.position.set(x, y, z);
        m.castShadow = true;
        m.receiveShadow = true;
        parent.add(m);
        return m;
      };
      const box3 = (w, h, d, mat, x, y, z, parent) => mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, parent);
      const canvasTex = (w, h, draw) => {
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const g = c.getContext('2d');
        draw(g, w, h);
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 4;
        return { c, g, t };
      };

      /* ------------------------------------------------ lights */
      const hemi = new THREE.HemisphereLight(0xbfd8ff, 0x6a5240, 0.6);
      scene.add(hemi);
      const sun = new THREE.DirectionalLight(0xffffff, 2.2);
      sun.position.set(-1.5, 3.2, -6);
      sun.target.position.set(0, 0.8, -1);
      sun.castShadow = !coarse;
      sun.shadow.mapSize.set(1024, 1024);
      Object.assign(sun.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 1, far: 16 });
      sun.shadow.bias = -0.0006;
      scene.add(sun, sun.target);
      const lampLight = new THREE.PointLight(0xffb36b, 6, 6, 2);
      lampLight.position.set(-0.95, 1.45, -1.55);
      scene.add(lampLight);
      // Picture lights over the shelf and the framed certificates.
      const sconceR = new THREE.PointLight(0xffd9a0, 3.2, 5, 2);
      sconceR.position.set(2.6, 2.3, -0.7);
      const sconceL = new THREE.PointLight(0xffd9a0, 3.2, 5, 2);
      sconceL.position.set(-2.6, 2.2, -0.25);
      scene.add(sconceR, sconceL);
      const screenLight = new THREE.PointLight(0x9fd0ff, 0.8, 2.5, 2);
      screenLight.position.set(0.15, 1.05, -1.2);
      scene.add(screenLight);

      /* ------------------------------------------------ room shell */
      const wallMat = M(0x2b2f3a, { roughness: 0.95 });
      const wallMat2 = M(0x262a34, { roughness: 0.95 });
      const woodTex = canvasTex(512, 512, (g, w, h) => {
        g.fillStyle = '#3a281d';
        g.fillRect(0, 0, w, h);
        const r = rng(7);
        for (let i = 0; i < 9; i++) {
          g.fillStyle = `rgba(${60 + r() * 30},${38 + r() * 20},${24 + r() * 14},0.55)`;
          g.fillRect(0, (i * h) / 9, w, h / 9 - 2);
          g.fillStyle = 'rgba(0,0,0,0.35)';
          g.fillRect(0, ((i + 1) * h) / 9 - 2, w, 2);
        }
      });
      woodTex.t.wrapS = woodTex.t.wrapT = THREE.RepeatWrapping;
      woodTex.t.repeat.set(3, 3);
      const floor = mesh(new THREE.PlaneGeometry(9, 9), M(0xffffff, { map: woodTex.t, roughness: 0.55 }), 0, 0, 0.5);
      floor.rotation.x = -Math.PI / 2;
      floor.castShadow = false;
      // Rug under the desk.
      const rug = mesh(new THREE.PlaneGeometry(3.6, 2.4), M(0x1d2a3a, { roughness: 1 }), 0, 0.004, -0.6);
      rug.rotation.x = -Math.PI / 2;
      rug.castShadow = false;

      const WALL_Z = -3;
      const WIN = { x0: -2.4, x1: 2.4, y0: 0.95, y1: 2.55 };
      // Back wall around the window opening.
      box3(1.3, 3.2, 0.2, wallMat, -3.05, 1.6, WALL_Z, scene);
      box3(1.3, 3.2, 0.2, wallMat, 3.05, 1.6, WALL_Z, scene);
      box3(WIN.x1 - WIN.x0, WIN.y0, 0.2, wallMat, 0, WIN.y0 / 2, WALL_Z, scene);
      box3(WIN.x1 - WIN.x0, 3.2 - WIN.y1, 0.2, wallMat, 0, (WIN.y1 + 3.2) / 2, WALL_Z, scene);
      // Window frame + mullions.
      const frameMat = M(0x14161c, { roughness: 0.5 });
      box3(WIN.x1 - WIN.x0 + 0.12, 0.06, 0.26, frameMat, 0, WIN.y0, WALL_Z + 0.02, scene);
      box3(WIN.x1 - WIN.x0 + 0.12, 0.06, 0.26, frameMat, 0, WIN.y1, WALL_Z + 0.02, scene);
      [WIN.x0, WIN.x1, -0.85, 0.85].forEach((x) => box3(0.06, WIN.y1 - WIN.y0, 0.26, frameMat, x, (WIN.y0 + WIN.y1) / 2, WALL_Z + 0.02, scene));
      // Side walls.
      const sideL = box3(0.2, 3.2, 8, wallMat2, -3.5, 1.6, 0.5, scene);
      const sideR = box3(0.2, 3.2, 8, wallMat2, 3.5, 1.6, 0.5, scene);
      sideL.castShadow = sideR.castShadow = false;
      // Skirting for depth.
      box3(7, 0.1, 0.05, M(0x15171d), 0, 0.05, WALL_Z + 0.12, scene);

      /* ------------------------------------------------ Port Louis through the window */
      const layers = {};
      const mkLayer = (name, w, h, cw, ch, x, y, z, transparent) => {
        const L = canvasTex(cw, ch, () => {});
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: L.t, transparent, toneMapped: false, depthWrite: !transparent }));
        m.position.set(x, y, z);
        scene.add(m);
        layers[name] = { ...L, w, h, y, top: y + h / 2 };
        return m;
      };
      mkLayer('sky', 34, 7, 2560, 520, 0, 2.0, -17, false);
      mkLayer('mount', 24, 5, 2400, 500, 0, 1.9, -11, true);
      mkLayer('city', 15, 3.6, 2250, 540, 0, 1.75, -6.2, true);

      const PAL = {
        day: { top: '#4f9fe0', mid: '#9fd0f2', bot: '#e6f4fb', sun: '#fff3c4', sunY: 0.2, sunX: 0.66, far: '#7e9db8', mid2: '#5f8296', near: '#46657a', cityA: '#aab6c4', cityB: '#8794a3', water: '#3d90b8', water2: '#7ec3dc', stars: 0, win: 0, cloud: 'rgba(255,255,255,0.85)', roof: '#657588' },
        golden: { top: '#27315f', mid: '#d4636a', bot: '#ffc079', sun: '#ffe0a8', sunY: 0.52, sunX: 0.62, far: '#6a5575', mid2: '#4a3a5c', near: '#32284a', cityA: '#2a2238', cityB: '#201a2e', water: '#c9715f', water2: '#ffb37a', stars: 0.1, win: 0.35, cloud: 'rgba(255,170,130,0.55)', roof: '#1b1626' },
        night: { top: '#050816', mid: '#101a3a', bot: '#26335f', sun: '#e8efff', sunY: 0.16, sunX: 0.3, far: '#141b33', mid2: '#0f1529', near: '#0b1020', cityA: '#0c1120', cityB: '#080c18', water: '#0a1730', water2: '#2a4678', stars: 1, win: 1, cloud: 'rgba(120,140,200,0.18)', roof: '#05070f' },
      };

      const toPx = (layer, wy) => ((layer.top - wy) / layer.h) * layer.c.height;
      const drawSky = (p) => {
        const L = layers.sky;
        const { g, c } = L;
        const gr = g.createLinearGradient(0, 0, 0, c.height);
        gr.addColorStop(0, p.top);
        gr.addColorStop(0.55, p.mid);
        gr.addColorStop(1, p.bot);
        g.fillStyle = gr;
        g.fillRect(0, 0, c.width, c.height);
        const r = rng(11);
        if (p.stars) {
          for (let i = 0; i < 260; i++) {
            g.fillStyle = `rgba(255,255,255,${0.25 + r() * 0.75 * p.stars})`;
            const s = r() * 1.8 + 0.4;
            g.fillRect(r() * c.width, r() * c.height * 0.6, s, s);
          }
        }
        const sx = c.width * p.sunX;
        const sy = c.height * (0.2 + p.sunY * 0.8);
        const glow = g.createRadialGradient(sx, sy, 4, sx, sy, 340);
        glow.addColorStop(0, p.sun);
        glow.addColorStop(0.12, p.sun + 'cc');
        glow.addColorStop(1, 'rgba(255,200,140,0)');
        g.fillStyle = glow;
        g.fillRect(0, 0, c.width, c.height);
        g.fillStyle = p.sun;
        g.beginPath();
        g.arc(sx, sy, phase === 'night' ? 26 : 34, 0, Math.PI * 2);
        g.fill();
        for (let i = 0; i < 14; i++) {
          const cx = r() * c.width;
          const cy = c.height * (0.2 + r() * 0.4);
          g.fillStyle = p.cloud;
          for (let k = 0; k < 5; k++) {
            g.beginPath();
            g.ellipse(cx + k * 38, cy + (r() - 0.5) * 8, 70 + r() * 60, 12 + r() * 8, 0, 0, Math.PI * 2);
            g.fill();
          }
        }
        L.t.needsUpdate = true;
      };

      const drawMountains = (p) => {
        const L = layers.mount;
        const { g, c } = L;
        g.clearRect(0, 0, c.width, c.height);
        const wx = (x) => (x / L.w + 0.5) * c.width;
        const base = toPx(L, 0.75);
        const ridge = (pts, color) => {
          g.fillStyle = color;
          g.beginPath();
          g.moveTo(wx(-12), c.height);
          pts.forEach(([x, y]) => g.lineTo(wx(x), toPx(L, y)));
          g.lineTo(wx(12), c.height);
          g.closePath();
          g.fill();
        };
        // Moka range (far, jagged), Le Pouce (thumb) and Pieter Both (rock cap).
        ridge([[-12, 1.2], [-8, 1.5], [-6, 1.35], [-5, 1.9], [-4.4, 1.6], [-3.6, 2.35], [-3.2, 2.7], [-2.9, 2.75], [-2.6, 2.4], [-2.2, 1.7], [-1, 1.5], [0.2, 1.25], [1.6, 1.6], [2.4, 2.1], [3, 2.5], [3.35, 2.95], [3.55, 3.05], [3.7, 2.95], [3.9, 2.45], [4.6, 1.8], [6, 1.55], [9, 1.3], [12, 1.2]], p.far);
        ridge([[-12, 1.0], [-7, 1.25], [-4.5, 1.1], [-1.5, 1.3], [0.4, 1.05], [2, 1.2], [4.6, 1.0], [8, 1.2], [12, 1.0]], p.mid2);
        // Signal Mountain with the Citadel (Fort Adelaide) on top.
        ridge([[-1.9, 0.75], [-1.2, 1.0], [-0.7, 1.22], [-0.35, 1.3], [0.1, 1.2], [0.7, 1.0], [1.4, 0.75]], p.near);
        g.fillStyle = p.near;
        const fx = wx(-0.35);
        const fy = toPx(L, 1.3);
        g.fillRect(fx - 34, fy - 16, 68, 16);
        for (let i = 0; i < 5; i++) g.fillRect(fx - 34 + i * 15, fy - 22, 8, 6);
        g.fillRect(fx - 4, fy - 30, 8, 14);
        if (p.win > 0.3) {
          g.fillStyle = 'rgba(255,200,120,0.9)';
          g.fillRect(fx - 12, fy - 10, 3, 4);
          g.fillRect(fx + 8, fy - 10, 3, 4);
        }
        L.t.needsUpdate = true;
      };

      const drawCity = (p) => {
        const L = layers.city;
        const { g, c } = L;
        g.clearRect(0, 0, c.width, c.height);
        const wx = (x) => (x / L.w + 0.5) * c.width;
        const seaTop = toPx(L, 0.85);
        const wg = g.createLinearGradient(0, seaTop, 0, c.height);
        wg.addColorStop(0, p.water2);
        wg.addColorStop(1, p.water);
        g.fillStyle = wg;
        g.fillRect(0, seaTop, c.width, c.height - seaTop);
        const r = rng(23);
        // Reflections.
        for (let i = 0; i < 70; i++) {
          g.fillStyle = `rgba(255,255,255,${0.04 + r() * 0.12 * (phase === 'night' ? 0.6 : 1)})`;
          g.fillRect(r() * c.width, seaTop + 6 + r() * (c.height - seaTop - 12), 20 + r() * 80, 2);
        }
        // Harbour: cranes and ships on the left.
        g.fillStyle = p.cityB;
        const crane = (x, h) => {
          const px = wx(x);
          const y = seaTop;
          g.fillRect(px, y - h, 5, h);
          g.fillRect(px - 36, y - h, 90, 5);
          g.fillRect(px + 44, y - h, 3, 34);
          g.fillRect(px - 36, y - h + 5, 2, 20);
        };
        crane(-4.8, 120);
        crane(-4.1, 100);
        crane(-3.4, 130);
        const ship = (x, w) => {
          const px = wx(x);
          g.fillStyle = p.cityB;
          g.beginPath();
          g.moveTo(px, seaTop - 2);
          g.lineTo(px + w, seaTop - 2);
          g.lineTo(px + w - 18, seaTop + 22);
          g.lineTo(px + 14, seaTop + 22);
          g.closePath();
          g.fill();
          g.fillRect(px + w * 0.55, seaTop - 40, w * 0.22, 38);
          for (let i = 0; i < 4; i++) {
            g.fillStyle = ['#8a3b32', '#2f5d7c', '#9b7d2c', '#3d6b4b'][i];
            g.fillRect(px + 12 + i * (w / 6), seaTop - 24, w / 7, 22);
          }
        };
        ship(-4.5, 230);
        ship(-2.8, 190);
        // Sailing boats.
        for (let i = 0; i < 4; i++) {
          const bx = wx(-1.4 + i * 0.6);
          const by = seaTop + 40 + (i % 2) * 36;
          g.fillStyle = p.cityA;
          g.beginPath();
          g.moveTo(bx, by);
          g.lineTo(bx + 24, by);
          g.lineTo(bx + 10, by - 38);
          g.closePath();
          g.fill();
          g.fillStyle = p.cityB;
          g.fillRect(bx - 4, by, 34, 5);
        }
        // City blocks (Caudan, towers).
        const rb = rng(5);
        let x = 0.6;
        while (x < 7.2) {
          const w = 0.22 + rb() * 0.34;
          const h = 0.25 + rb() * rb() * 1.25;
          const tower = rb() > 0.82;
          const hh = tower ? h + 0.5 : h;
          const px = wx(x);
          const bw = (w / L.w) * c.width;
          const top = toPx(L, 0.85 + hh);
          g.fillStyle = rb() > 0.5 ? p.cityA : p.cityB;
          g.fillRect(px, top, bw, seaTop - top + 2);
          g.fillStyle = p.roof;
          g.fillRect(px, top - 3, bw, 4);
          if (p.win > 0) {
            for (let wy = top + 8; wy < seaTop - 6; wy += 14) {
              for (let wxp = px + 5; wxp < px + bw - 6; wxp += 12) {
                if (rb() < 0.45 * p.win + 0.02) {
                  g.fillStyle = rb() > 0.3 ? 'rgba(255,214,140,0.85)' : 'rgba(180,220,255,0.7)';
                  g.fillRect(wxp, wy, 4, 6);
                }
              }
            }
          } else {
            g.fillStyle = 'rgba(255,255,255,0.16)';
            for (let wy = top + 8; wy < seaTop - 6; wy += 14) g.fillRect(px + 4, wy, bw - 8, 2);
          }
          x += w + 0.02;
        }
        // Palms at the edges.
        const palm = (px, ph) => {
          g.fillStyle = p.cityB;
          g.beginPath();
          g.moveTo(px, seaTop + 28);
          g.quadraticCurveTo(px + 8, seaTop - ph / 2, px + 4, seaTop - ph);
          g.lineTo(px + 10, seaTop - ph);
          g.quadraticCurveTo(px + 16, seaTop - ph / 2, px + 12, seaTop + 28);
          g.fill();
          for (let k = 0; k < 7; k++) {
            const a = -Math.PI + (k / 6) * Math.PI;
            g.beginPath();
            g.moveTo(px + 7, seaTop - ph);
            g.quadraticCurveTo(px + 7 + Math.cos(a) * 60, seaTop - ph - 50 + Math.sin(a) * 10, px + 7 + Math.cos(a) * 95, seaTop - ph + 24);
            g.quadraticCurveTo(px + 7 + Math.cos(a) * 55, seaTop - ph - 24, px + 7, seaTop - ph);
            g.fill();
          }
        };
        palm(wx(-7.1), 210);
        palm(wx(6.7), 240);
        L.t.needsUpdate = true;
      };

      const LIGHT = {
        day: { hemi: 1.7, sun: 3.4, sunColor: 0xfff1d6, lamp: 1.2, bg: 0x7fb7e6, exp: 1.05 },
        golden: { hemi: 0.45, sun: 2.6, sunColor: 0xff9a5c, lamp: 5, bg: 0x2a2540, exp: 1.1 },
        night: { hemi: 0.38, sun: 0.35, sunColor: 0x8aa6ff, lamp: 11, bg: 0x070a16, exp: 1.2 },
      };
      const bulbMats = [];
      const applyPhase = (ph) => {
        const p = PAL[ph];
        drawSky(p);
        drawMountains(p);
        drawCity(p);
        const l = LIGHT[ph];
        hemi.intensity = l.hemi;
        sun.intensity = l.sun;
        sun.color.setHex(l.sunColor);
        lampLight.intensity = l.lamp;
        renderer.toneMappingExposure = l.exp;
        scene.background = new THREE.Color(l.bg);
        bulbMats.forEach((m) => (m.emissiveIntensity = ph === 'day' ? 0.6 : 2.4));
      };

      /* ------------------------------------------------ desk */
      const deskMat = M(0x4a3426, { roughness: 0.45 });
      const desk = new THREE.Group();
      scene.add(desk);
      box3(3.0, 0.07, 1.05, deskMat, 0, 0.75, -1.5, desk);
      [[-1.4, -1.9], [1.4, -1.9], [-1.4, -1.1], [1.4, -1.1]].forEach(([x, z]) => box3(0.07, 0.72, 0.07, M(0x1b1d24, { metalness: 0.5 }), x, 0.36, z, desk));
      box3(0.5, 0.5, 0.9, M(0x3a2a20), 1.2, 0.46, -1.5, desk); // drawer unit

      /* ------------------------------------------------ laptop */
      const laptop = new THREE.Group();
      laptop.position.set(0.15, 0.785, -1.55);
      scene.add(laptop);
      const alu = M(0x9da2ad, { metalness: 0.75, roughness: 0.35 });
      box3(0.62, 0.018, 0.42, alu, 0, 0.009, 0, laptop);
      const kb = canvasTex(512, 320, (g, w, h) => {
        g.fillStyle = '#15171c';
        g.fillRect(0, 0, w, h);
        for (let r2 = 0; r2 < 5; r2++) for (let k = 0; k < 14; k++) {
          g.fillStyle = '#272b33';
          g.fillRect(14 + k * 35, 16 + r2 * 40, 31, 34);
        }
        g.fillStyle = '#20232a';
        g.fillRect(180, 226, 150, 70);
      });
      const kbPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 0.27), new THREE.MeshStandardMaterial({ map: kb.t, roughness: 0.7 }));
      kbPlane.rotation.x = -Math.PI / 2;
      kbPlane.position.set(0, 0.0195, -0.05);
      laptop.add(kbPlane);
      const lidPivot = new THREE.Group();
      lidPivot.position.set(0, 0.018, -0.21);
      lidPivot.rotation.x = -0.27;
      laptop.add(lidPivot);
      box3(0.62, 0.4, 0.012, alu, 0, 0.2, 0, lidPivot);
      const screen = canvasTex(1024, 640, () => {});
      const screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.57, 0.356), new THREE.MeshBasicMaterial({ map: screen.t, toneMapped: false }));
      screenMesh.position.set(0, 0.2, 0.0066);
      lidPivot.add(screenMesh);
      reg('laptop', laptop);
      screenMesh.userData.hot = 'laptop';
      hotMeshes.push(screenMesh);

      /* ------------------------------------------------ desk lamp */
      const lamp = new THREE.Group();
      lamp.position.set(-0.95, 0.785, -1.8);
      scene.add(lamp);
      const metal = M(0x20232b, { metalness: 0.7, roughness: 0.35 });
      mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.03, 24), metal, 0, 0.015, 0, lamp);
      const a1 = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.5, 8), metal, 0.05, 0.27, 0, lamp);
      a1.rotation.z = -0.25;
      const a2 = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.42, 8), metal, 0.05, 0.62, 0.0, lamp);
      a2.rotation.z = 0.55;
      const head = mesh(new THREE.ConeGeometry(0.11, 0.17, 24, 1, true), M(0x2a2e38, { side: THREE.DoubleSide, metalness: 0.6 }), 0.28, 0.75, 0.0, lamp);
      head.rotation.z = 2.2;
      const bulbMat = new THREE.MeshStandardMaterial({ color: 0xffe2b0, emissive: 0xffb36b, emissiveIntensity: 2 });
      bulbMats.push(bulbMat);
      mesh(new THREE.SphereGeometry(0.035, 16, 12), bulbMat, 0.31, 0.72, 0, lamp);
      lampLight.position.set(-0.95 + 0.31, 0.785 + 0.7, -1.8);

      /* ------------------------------------------------ mug + steam */
      const mug = new THREE.Group();
      mug.position.set(0.8, 0.785, -1.4);
      scene.add(mug);
      mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.09, 24), M(0xe8e2d4, { roughness: 0.3 }), 0, 0.045, 0, mug);
      const handle = mesh(new THREE.TorusGeometry(0.025, 0.007, 8, 16, Math.PI), M(0xe8e2d4), 0.05, 0.045, 0, mug);
      handle.rotation.z = -Math.PI / 2;
      mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.004, 24), M(0x3a1f12, { roughness: 0.2 }), 0, 0.088, 0, mug);
      const steamN = 28;
      const steamGeo = new THREE.BufferGeometry();
      const steamPos = new Float32Array(steamN * 3);
      const steamSeed = Array.from({ length: steamN }, (_, i) => i / steamN);
      steamGeo.setAttribute('position', new THREE.BufferAttribute(steamPos, 3));
      const steam = new THREE.Points(steamGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.025, transparent: true, opacity: 0.22, depthWrite: false, sizeAttenuation: true }));
      mug.add(steam);

      /* ------------------------------------------------ globe (Middle East and Africa) */
      const globe = new THREE.Group();
      globe.position.set(-0.5, 0.785, -1.2);
      scene.add(globe);
      mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.025, 24), M(0x1b1d24, { metalness: 0.6 }), 0, 0.0125, 0, globe);
      const ring = mesh(new THREE.TorusGeometry(0.17, 0.006, 8, 48), M(0xc9a24a, { metalness: 0.8, roughness: 0.3 }), 0, 0.2, 0, globe);
      ring.rotation.y = Math.PI / 2;
      ring.rotation.z = 0.2;
      const globeTex = canvasTex(1024, 512, (g, w, h) => {
        const X = (lon) => ((lon + 180) / 360) * w;
        const Y = (lat) => ((90 - lat) / 180) * h;
        g.fillStyle = '#0c2a4a';
        g.fillRect(0, 0, w, h);
        g.strokeStyle = 'rgba(120,180,255,0.12)';
        for (let i = 0; i < 12; i++) {
          g.beginPath();
          g.moveTo((i * w) / 12, 0);
          g.lineTo((i * w) / 12, h);
          g.stroke();
        }
        const land = (pts, col) => {
          g.fillStyle = col;
          g.beginPath();
          pts.forEach(([lo, la], i) => (i ? g.lineTo(X(lo), Y(la)) : g.moveTo(X(lo), Y(la))));
          g.closePath();
          g.fill();
        };
        land([[-17, 15], [-10, 28], [-5, 36], [10, 37], [32, 31], [35, 22], [43, 12], [51, 12], [40, -3], [40, -15], [35, -25], [20, -35], [12, -17], [9, 0], [-8, 4]], '#3f8f6a');
        land([[35, 30], [48, 30], [56, 25], [59, 22], [52, 14], [43, 13], [35, 28]], '#c9a24a');
        land([[-10, 36], [0, 44], [10, 55], [30, 60], [60, 70], [100, 75], [140, 65], [130, 45], [100, 30], [78, 8], [70, 20], [56, 26], [48, 30], [35, 36], [26, 40]], '#2d5f58');
        land([[44, -25], [50, -15], [49, -12], [44, -17]], '#3f8f6a');
        [[57.5, -20.2, '#4ade80', 14], [55.3, 25.2, '#fbbf24', 9], [36.8, -1.3, '#fbbf24', 9], [3.4, 6.5, '#fbbf24', 9], [31.2, 30, '#fbbf24', 9]].forEach(([lo, la, col, r2]) => {
          g.fillStyle = col;
          g.beginPath();
          g.arc(X(lo), Y(la), r2, 0, Math.PI * 2);
          g.fill();
          g.strokeStyle = col;
          g.globalAlpha = 0.5;
          g.beginPath();
          g.arc(X(lo), Y(la), r2 * 2, 0, Math.PI * 2);
          g.stroke();
          g.globalAlpha = 1;
        });
      });
      const sphere = mesh(new THREE.SphereGeometry(0.15, 40, 28), new THREE.MeshStandardMaterial({ map: globeTex.t, emissiveMap: globeTex.t, emissive: 0xffffff, emissiveIntensity: 0.45, roughness: 0.45, metalness: 0.1 }), 0, 0.2, 0, globe);
      sphere.rotation.y = 2.2;
      reg('globe', globe);

      /* ------------------------------------------------ phone */
      const phone = new THREE.Group();
      phone.position.set(0.88, 0.785, -1.05);
      phone.rotation.y = -0.35;
      scene.add(phone);
      box3(0.075, 0.009, 0.155, M(0x0f1116, { metalness: 0.6, roughness: 0.3 }), 0, 0.0045, 0, phone);
      const pscr = canvasTex(256, 512, (g, w, h) => {
        const gr = g.createLinearGradient(0, 0, 0, h);
        gr.addColorStop(0, '#1b2a44');
        gr.addColorStop(1, '#0b1020');
        g.fillStyle = gr;
        g.fillRect(0, 0, w, h);
        g.fillStyle = '#4ade80';
        g.beginPath();
        g.arc(40, 60, 16, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = '#e8ecf5';
        g.font = '600 22px sans-serif';
        g.fillText('New project?', 66, 56);
        g.fillStyle = '#9aa6c4';
        g.font = '18px sans-serif';
        g.fillText('Tap to get in touch', 66, 82);
        g.fillStyle = 'rgba(255,255,255,0.08)';
        g.fillRect(24, 120, 208, 70);
        g.fillRect(24, 204, 208, 70);
      });
      const pscreenMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.068, 0.145), new THREE.MeshBasicMaterial({ map: pscr.t, toneMapped: false }));
      pscreenMesh.rotation.x = -Math.PI / 2;
      pscreenMesh.position.y = 0.0097;
      phone.add(pscreenMesh);
      reg('phone', phone);

      /* ------------------------------------------------ books (articles) */
      const books = new THREE.Group();
      books.position.set(-1.15, 0.785, -1.3);
      scene.add(books);
      [[0.26, 0.04, 0.19, 0x2f6f5a, 0, 0.02, 0.05], [0.24, 0.035, 0.18, 0x6a4bb5, 0.01, 0.0575, 0.04], [0.22, 0.032, 0.17, 0xc9833a, -0.01, 0.091, 0.05]].forEach(([w, h, d, c, x, y, rot]) => {
        const b = box3(w, h, d, M(c, { roughness: 0.6 }), x, y, 0, books);
        b.rotation.y = rot * 3;
      });
      reg('books', books);

      /* ------------------------------------------------ football on the floor */
      const ball = new THREE.Group();
      ball.position.set(-2.0, 0.11, 0.4);
      scene.add(ball);
      const ballTex = canvasTex(512, 256, (g, w, h) => {
        g.fillStyle = '#f4f4f6';
        g.fillRect(0, 0, w, h);
        const r = rng(3);
        g.fillStyle = '#16181e';
        for (let i = 0; i < 22; i++) {
          const x = r() * w;
          const y = h * 0.12 + r() * h * 0.76;
          g.beginPath();
          for (let k = 0; k < 5; k++) {
            const a = (k / 5) * Math.PI * 2 - Math.PI / 2;
            g.lineTo(x + Math.cos(a) * 22, y + Math.sin(a) * 22);
          }
          g.closePath();
          g.fill();
        }
      });
      const ballMesh = mesh(new THREE.SphereGeometry(0.11, 32, 24), M(0xffffff, { map: ballTex.t, roughness: 0.4 }), 0, 0, 0, ball);
      reg('ball', ball);
      const ballState = { t: -1 };

      /* ------------------------------------------------ right wall: work shelf with trophies and plaques */
      const shelf = new THREE.Group();
      scene.add(shelf);
      const boardMat = M(0x4a3426, { roughness: 0.5 });
      box3(0.3, 0.05, 2.8, boardMat, 3.33, 1.3, -0.7, shelf);
      box3(0.3, 0.05, 2.8, boardMat, 3.33, 1.95, -0.7, shelf);
      const gold = M(0xd8a93a, { metalness: 0.9, roughness: 0.25 });
      const cup = (z, y, s = 1) => {
        const g = new THREE.Group();
        g.position.set(3.3, y, z);
        mesh(new THREE.CylinderGeometry(0.07 * s, 0.09 * s, 0.03 * s, 20), gold, 0, 0.015 * s, 0, g);
        mesh(new THREE.CylinderGeometry(0.012 * s, 0.012 * s, 0.1 * s, 12), gold, 0, 0.08 * s, 0, g);
        mesh(new THREE.CylinderGeometry(0.07 * s, 0.035 * s, 0.1 * s, 20, 1, true), M(0xd8a93a, { metalness: 0.9, roughness: 0.25, side: THREE.DoubleSide }), 0, 0.18 * s, 0, g);
        shelf.add(g);
      };
      cup(-1.6, 1.325, 1.1);
      cup(-1.15, 1.325, 0.8);
      const plaqueTex = (label, accent) =>
        canvasTex(256, 192, (g, w, h) => {
          g.fillStyle = '#12151c';
          g.fillRect(0, 0, w, h);
          g.strokeStyle = accent;
          g.lineWidth = 6;
          g.strokeRect(6, 6, w - 12, h - 12);
          g.fillStyle = accent;
          g.fillRect(24, 28, 40, 6);
          g.fillStyle = '#e8ecf5';
          g.font = '700 26px sans-serif';
          label.split('|').forEach((t, i) => g.fillText(t, 24, 80 + i * 34));
        });
      [['MRA|e-invoice', '#4ade80', -0.4], ['VAT|returns', '#818cf8', 0.15], ['Approval|workflows', '#fbbf24', 0.7]].forEach(([lbl, col, z]) => {
        const tx = plaqueTex(lbl, col);
        const p = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.315), new THREE.MeshStandardMaterial({ map: tx.t, roughness: 0.6 }));
        p.position.set(3.37, 1.5, z);
        p.rotation.y = -Math.PI / 2;
        p.castShadow = true;
        shelf.add(p);
        const p2 = p.clone();
        p2.position.y = 2.15;
        shelf.add(p2);
      });
      cup(0.95, 1.325, 0.9);
      cup(-0.6, 1.975, 0.9);
      reg('work', shelf);

      /* ------------------------------------------------ left wall: credentials */
      const cred = new THREE.Group();
      scene.add(cred);
      const frameM = M(0x1a1c23, { metalness: 0.4, roughness: 0.4 });
      const certTex = canvasTex(640, 460, (g, w, h) => {
        g.fillStyle = '#f2ede0';
        g.fillRect(0, 0, w, h);
        g.strokeStyle = '#b08a3e';
        g.lineWidth = 8;
        g.strokeRect(18, 18, w - 36, h - 36);
        g.lineWidth = 2;
        g.strokeRect(34, 34, w - 68, h - 68);
        g.fillStyle = '#2b2a33';
        g.font = '600 38px Georgia, serif';
        g.textAlign = 'center';
        g.fillText('CERTIFICATE', w / 2, 120);
        g.fillStyle = '#8c8a96';
        for (let i = 0; i < 4; i++) g.fillRect(120, 170 + i * 30, w - 240, 6);
        g.fillStyle = '#b08a3e';
        g.beginPath();
        g.arc(w / 2, 365, 36, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = '#f2ede0';
        g.font = '700 34px Georgia, serif';
        g.fillText('A', w / 2, 378);
      });
      const hang = (z, y, w, h, tex) => {
        box3(0.04, h + 0.1, w + 0.1, frameM, -3.38, y, z, cred);
        const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 }));
        p.position.set(-3.355, y, z);
        p.rotation.y = Math.PI / 2;
        cred.add(p);
      };
      hang(-0.9, 1.65, 0.9, 0.65, certTex.t);
      const mini = canvasTex(256, 256, (g, w, h) => {
        g.fillStyle = '#0f131c';
        g.fillRect(0, 0, w, h);
        g.fillStyle = '#4ade80';
        g.font = '700 150px Georgia, serif';
        g.textAlign = 'center';
        g.fillText('A', w / 2, 180);
      });
      hang(0.45, 1.65, 0.45, 0.45, mini.t);
      reg('credentials', cred);

      /* ------------------------------------------------ window hotspot (invisible pane) */
      const winPane = new THREE.Mesh(new THREE.PlaneGeometry(WIN.x1 - WIN.x0, WIN.y1 - WIN.y0), new THREE.MeshBasicMaterial({ visible: false }));
      winPane.position.set(0, (WIN.y0 + WIN.y1) / 2, WALL_Z + 0.05);
      winPane.userData.hot = 'window';
      scene.add(winPane);
      hotMeshes.push(winPane);

      /* ------------------------------------------------ dust in the light */
      const dustN = coarse ? 0 : 70;
      let dust = null;
      if (dustN) {
        const dg = new THREE.BufferGeometry();
        const dp = new Float32Array(dustN * 3);
        const r = rng(99);
        for (let i = 0; i < dustN; i++) {
          dp[i * 3] = (r() - 0.5) * 4;
          dp[i * 3 + 1] = 0.5 + r() * 2;
          dp[i * 3 + 2] = -2.5 + r() * 4;
        }
        dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
        dust = new THREE.Points(dg, new THREE.PointsMaterial({ color: 0xffe9c4, size: 0.014, transparent: true, opacity: 0.5, depthWrite: false }));
        scene.add(dust);
      }

      /* ------------------------------------------------ laptop screen drawing */
      const CODE = [
        ['//', ' Port Louis, Mauritius', '#6b7a99'],
        ['void', ' automate(invoice) {', '#c792ea'],
        ['  info', ' "Zoho Creator + Deluge";', '#82aaff'],
        ['  books', ' = zoho.books.create(...);', '#c3e88d'],
        ['  flow', '.trigger("approval");', '#f78c6c'],
        ['  return', ' success;', '#ffcb6b'],
        ['}', '', '#c792ea'],
      ];
      let typed = 0;
      let lastTyped = -1;
      const drawScreen = (time, mode) => {
        const { g, c, t } = screen;
        const W = c.width;
        const H = c.height;
        g.fillStyle = '#0b0f1a';
        g.fillRect(0, 0, W, H);
        const bg = g.createLinearGradient(0, 0, W, H);
        bg.addColorStop(0, '#101a33');
        bg.addColorStop(1, '#0a1f1b');
        g.fillStyle = bg;
        g.fillRect(0, 0, W, H);
        // Title bar.
        g.fillStyle = 'rgba(255,255,255,0.05)';
        g.fillRect(0, 0, W, 54);
        ['#ff5f57', '#febc2e', '#28c840'].forEach((col, i) => {
          g.fillStyle = col;
          g.beginPath();
          g.arc(36 + i * 34, 27, 9, 0, Math.PI * 2);
          g.fill();
        });
        g.fillStyle = '#8a96b4';
        g.font = '24px monospace';
        g.fillText('amyaaz.com  —  architect.dg', 160, 35);
        // Logo.
        g.fillStyle = '#4ade80';
        g.beginPath();
        g.moveTo(W - 120, 400);
        g.lineTo(W - 80, 330);
        g.lineTo(W - 40, 400);
        g.lineTo(W - 62, 400);
        g.lineTo(W - 80, 366);
        g.lineTo(W - 98, 400);
        g.closePath();
        g.globalAlpha = 0.9;
        g.fill();
        g.globalAlpha = 1;
        // Typed code.
        const total = CODE.reduce((n, l) => n + l[0].length + l[1].length, 0);
        typed = Math.min(total, typed);
        let left = Math.floor(typed);
        g.font = '34px monospace';
        let y = 120;
        for (const [a, b, col] of CODE) {
          if (left <= 0) break;
          const ta = a.slice(0, left);
          g.fillStyle = col;
          g.fillText(ta, 50, y);
          const wA = g.measureText(ta).width;
          left -= a.length;
          if (left > 0 && b) {
            const tb = b.slice(0, left);
            g.fillStyle = '#d6deef';
            g.fillText(tb, 50 + wA, y);
            left -= b.length;
          }
          y += 52;
        }
        if (Math.floor(time * 2) % 2 === 0) {
          g.fillStyle = '#4ade80';
          g.fillRect(50 + (typed >= total ? 14 : 0), y - 78 + (typed >= total ? 52 : 0), 16, 36);
        }
        // Status bar.
        g.fillStyle = 'rgba(255,255,255,0.05)';
        g.fillRect(0, H - 64, W, 64);
        g.fillStyle = '#4ade80';
        g.font = '24px monospace';
        g.fillText(mode === 'open' ? '▶ Opening the portfolio…' : '● Port Louis · UTC+4 · online', 36, H - 24);
        if (mode === 'open') {
          g.fillStyle = 'rgba(74,222,128,0.25)';
          g.fillRect(0, H - 70, W * ((time * 0.7) % 1), 6);
        }
        t.needsUpdate = true;
      };

      /* ------------------------------------------------ camera rig */
      const home = { p: new V3(), l: new V3(0, 1.35, -1.5) };
      const cur = { p: new V3(), l: new V3() };
      const tgt = { p: new V3(), l: new V3() };
      let rate = 1.0;
      let focus = null;
      const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
      const computeHome = () => {
        const w = box.clientWidth || 1;
        const h = box.clientHeight || 1;
        const aspect = w / h;
        camera.aspect = aspect;
        camera.fov = aspect >= 1.25 ? 42 : 42 + Math.min(1, (1.25 - aspect) / 0.8) * 30;
        camera.updateProjectionMatrix();
        home.p.set(0, 1.5, 3.0 + Math.min(1.8, Math.max(0, (1.25 - aspect) * 2.2)));
        renderer.setSize(w, h, false);
        renderer.domElement.style.width = '100%';
        renderer.domElement.style.height = '100%';
        if (!focus) tgt.p.copy(home.p);
      };
      computeHome();
      // Intro: start on the laptop screen, then pull back.
      cur.p.set(0.15, 1.02, -0.95);
      cur.l.set(0.15, 1.0, -1.75);
      tgt.p.copy(home.p);
      tgt.l.copy(home.l);
      rate = reduced ? 40 : 0.9;
      if (reduced) cur.p.copy(home.p), cur.l.copy(home.l);

      const flyTo = (id) => {
        const pose = HOT[id].pose;
        focus = id;
        tgt.p.set(...pose.p);
        tgt.l.set(...pose.l);
        rate = reduced ? 40 : id === 'laptop' ? 2.2 : 3.2;
        setActive(id);
      };
      const release = () => {
        focus = null;
        tgt.p.copy(home.p);
        tgt.l.copy(home.l);
        rate = reduced ? 40 : 2.6;
        setActive(null);
        screenMode = 'idle';
      };
      let screenMode = 'idle';
      let openTimer = null;
      const select = (id) => {
        if (!HOT[id]) return;
        flyTo(id);
        if (id === 'ball') ballState.t = 0;
        if (id === 'laptop') {
          screenMode = 'open';
          clearTimeout(openTimer);
          openTimer = setTimeout(() => {
            const el = document.getElementById('hero-title');
            if (el) el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
            setTimeout(() => release(), 900);
          }, reduced ? 200 : 1700);
        } else {
          clearTimeout(openTimer);
          screenMode = 'idle';
        }
      };
      api.current = { select, release, setPhase: (ph) => { applyPhase(ph); setPhase(ph); } };

      /* ------------------------------------------------ interaction */
      const ray = new THREE.Raycaster();
      const ndc = new THREE.Vector2();
      let hovered = null;
      const setHover = (id) => {
        if (id === hovered) return;
        if (hovered && hotGroups[hovered]) hotGroups[hovered].traverse((m) => {
          if (m.isMesh && m.userData.em0) {
            m.material.emissive.copy(m.userData.em0);
            m.material.emissiveIntensity = m.userData.ei0;
          }
        });
        hovered = id;
        if (id && hotGroups[id]) hotGroups[id].traverse((m) => {
          if (m.isMesh && m.userData.em0) {
            m.material.emissive.set(0x4ade80);
            m.material.emissiveIntensity = 0.45;
          }
        });
        renderer.domElement.style.cursor = id ? 'pointer' : 'default';
        const chip = ui.current.chip;
        if (chip) {
          chip.textContent = id ? HOT[id].label : '';
          chip.style.opacity = id && !focus ? '1' : '0';
        }
      };
      const pick = (clientX, clientY) => {
        const r = renderer.domElement.getBoundingClientRect();
        ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
        ray.setFromCamera(ndc, camera);
        const hit = ray.intersectObjects(hotMeshes, false)[0];
        return hit ? hit.object.userData.hot : null;
      };
      let down = null;
      const onMove = (e) => {
        const r = renderer.domElement.getBoundingClientRect();
        pointer.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
        pointer.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
        if (e.pointerType === 'mouse') {
          setHover(focus ? null : pick(e.clientX, e.clientY));
          const chip = ui.current.chip;
          if (chip) {
            chip.style.transform = `translate(${e.clientX - r.left + 16}px, ${e.clientY - r.top + 16}px)`;
          }
        }
      };
      const onDown = (e) => {
        down = { x: e.clientX, y: e.clientY };
      };
      const onUp = (e) => {
        if (!down) return;
        const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
        down = null;
        if (moved > 8) return;
        const id = pick(e.clientX, e.clientY);
        if (id) select(id);
        else if (focus) release();
      };
      const dom = renderer.domElement;
      dom.addEventListener('pointermove', onMove);
      dom.addEventListener('pointerdown', onDown);
      dom.addEventListener('pointerup', onUp);
      dom.addEventListener('pointerleave', () => setHover(null));
      const onKey = (e) => {
        if (e.key === 'Escape' && focus) release();
      };
      window.addEventListener('keydown', onKey);
      const onResize = () => computeHome();
      window.addEventListener('resize', onResize);

      /* ------------------------------------------------ loop */
      let visible = true;
      const io = new IntersectionObserver(([en]) => (visible = en.isIntersecting), { threshold: 0.05 });
      io.observe(box);
      let last = performance.now();
      let tAcc = 0;
      let raf = 0;
      let clockT = 0;
      const tmpL = new V3();
      const frame = (now) => {
        raf = requestAnimationFrame(frame);
        if (!visible || document.hidden) {
          last = now;
          return;
        }
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        tAcc += dt;
        const k = 1 - Math.exp(-rate * dt);
        cur.p.lerp(tgt.p, k);
        cur.l.lerp(tgt.l, k);
        pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 3);
        pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 3);
        const amp = focus ? 0.05 : reduced ? 0 : 0.45;
        camera.position.set(cur.p.x + pointer.x * amp, cur.p.y - pointer.y * amp * 0.3, cur.p.z);
        tmpL.set(cur.l.x + pointer.x * amp * 0.4, cur.l.y, cur.l.z);
        camera.lookAt(tmpL);
        // Laptop screen: typing + redraw at ~15fps.
        if (!reduced) typed += dt * 22;
        else typed = 999;
        const stepped = Math.floor(tAcc * 15);
        if (stepped !== lastTyped) {
          lastTyped = stepped;
          drawScreen(tAcc, screenMode);
        }
        // Steam.
        if (!reduced) {
          const arr = steamGeo.attributes.position.array;
          for (let i = 0; i < steamN; i++) {
            const s = (steamSeed[i] + tAcc * 0.12) % 1;
            arr[i * 3] = Math.sin(s * 9 + i) * 0.012 * s;
            arr[i * 3 + 1] = 0.1 + s * 0.22;
            arr[i * 3 + 2] = Math.cos(s * 7 + i * 2) * 0.012 * s;
          }
          steamGeo.attributes.position.needsUpdate = true;
          steam.material.opacity = 0.22;
          sphere.rotation.y += dt * 0.35;
          if (dust) {
            const dp = dust.geometry.attributes.position.array;
            for (let i = 0; i < dustN; i++) {
              dp[i * 3 + 1] += Math.sin(tAcc * 0.4 + i) * 0.0006;
              dp[i * 3] += Math.cos(tAcc * 0.3 + i * 1.7) * 0.0006;
            }
            dust.geometry.attributes.position.needsUpdate = true;
          }
        }
        // Ball hop when clicked.
        if (ballState.t >= 0) {
          ballState.t += dt;
          const u = ballState.t;
          ballMesh.parent.position.y = 0.11 + Math.abs(Math.sin(u * 7)) * 0.32 * Math.exp(-u * 1.6);
          ballMesh.rotation.z += dt * 6 * Math.exp(-u);
          if (u > 3) ballState.t = -1;
        }
        // Lamp flicker-free glow follows phase; clock label.
        clockT += dt;
        if (clockT > 20) {
          clockT = 0;
          setClock(portLouisClock().text);
        }
        renderer.render(scene, camera);
      };

      const { h, text } = portLouisClock();
      const startPhase = phaseFor(h);
      setClock(text);
      applyPhase(startPhase);
      setPhase(startPhase);
      drawScreen(0, 'idle');
      renderer.render(scene, camera);
      setStatus('ready');
      raf = requestAnimationFrame(frame);

      cleanup = () => {
        cancelAnimationFrame(raf);
        clearTimeout(openTimer);
        io.disconnect();
        window.removeEventListener('keydown', onKey);
        window.removeEventListener('resize', onResize);
        dom.removeEventListener('pointermove', onMove);
        dom.removeEventListener('pointerdown', onDown);
        dom.removeEventListener('pointerup', onUp);
        scene.traverse((o) => {
          if (o.geometry) o.geometry.dispose();
          if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); });
        });
        renderer.dispose();
        if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  const info = active ? HOT[active] : null;
  const cyclePhase = () => {
    const next = PHASES[(PHASES.indexOf(phase) + 1) % PHASES.length];
    if (api.current.setPhase) api.current.setPhase(next);
  };

  return (
    <section className={`studio is-${status}`} id="studio" aria-label="Interactive studio in Port Louis, Mauritius">
      <div className="studio-canvas" ref={mount} />
      <div className="studio-chip" ref={(el) => (ui.current.chip = el)} aria-hidden="true" />

      <div className="studio-head">
        <p className="studio-kicker">Port Louis, Mauritius{clock ? ` · ${clock}` : ''}</p>
        <p className="studio-title">Welcome to my studio</p>
        <p className="studio-sub">Click the laptop to enter the portfolio, or explore the room.</p>
      </div>

      <div className={`studio-card${info && info.href ? ' is-on' : info ? ' is-on' : ''}`} role="status" aria-live="polite">
        {info && active !== 'laptop' && (
          <>
            <b>{info.title}</b>
            <p>{info.text}</p>
            <div className="studio-card-actions">
              {info.href && (
                <a className="btn btn-primary" href={info.href}>
                  {info.cta}
                </a>
              )}
              <button type="button" className="studio-back" onClick={() => api.current.release && api.current.release()}>
                Back to the room
              </button>
            </div>
          </>
        )}
      </div>

      <div className="studio-bar">
        <div className="studio-spots" role="group" aria-label="Explore the room">
          {ORDER.map((id) => (
            <button key={id} type="button" className={`studio-spot${active === id ? ' is-on' : ''}`} onClick={() => api.current.select && api.current.select(id)}>
              {HOT[id].label}
            </button>
          ))}
        </div>
        <div className="studio-tools">
          <button type="button" className="studio-time" onClick={cyclePhase} aria-label={`Time of day: ${PHASE_LABEL[phase]}. Change`}>
            {PHASE_LABEL[phase]}
          </button>
          <a className="studio-skip" href="#hero-title">
            Skip to site <span aria-hidden="true">↓</span>
          </a>
        </div>
      </div>

      {status === 'fallback' && <p className="studio-fallback">The 3D room needs WebGL. The full site is just below.</p>}
    </section>
  );
}
