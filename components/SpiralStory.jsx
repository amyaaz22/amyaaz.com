'use client';

// First-person scroll story. You sit in a seat with your hands on a dial. Scrolling (or
// dragging a circle on the dial) turns it, and you travel down a spiral of small animated
// objects. Each chapter of the story is real text in the DOM; the canvas is decoration.

import { useEffect, useRef, useState } from 'react';

const CHAPTERS = [
  {
    k: 'Sit down',
    t: 'Every system starts as a <em>mess</em>.',
    p: 'Spreadsheets, email approvals and apps that do not talk to each other. Every handover is a place for work to get lost. Turn the dial to begin.',
  },
  {
    k: '01 · Capture',
    t: 'First, a clean <em>form</em>.',
    p: 'I map how your data, people and processes fit together, then give each piece a home in Zoho Creator.',
  },
  {
    k: '02 · Logic',
    t: 'Then it learns the <em>rules</em>.',
    p: 'Deluge scripts handle validation, approvals and calculations, so people stop policing the process by hand.',
  },
  {
    k: '03 · Flow',
    t: 'Then everything <em>connects</em>.',
    p: 'Zoho Flow and Catalyst link Books, CRM, payment gateways and the tools you already run on.',
  },
  {
    k: '04 · Compliance',
    t: 'Then it files itself with the <em>MRA</em>.',
    p: 'E-invoicing, VAT returns and audit trails built into the same system, not bolted on afterwards.',
  },
  {
    k: '05 · Reach',
    t: 'One system, <em>end to end</em>.',
    p: 'Designed, built and handed over with documentation, for teams in Mauritius, the Middle East and Africa.',
    cta: true,
  },
];

const LABELS = ['Form', 'Deluge', 'Flow', 'Invoice', 'Approval', 'API', 'Report', 'Catalyst', 'MRA', 'VAT', 'CRM', 'Books'];
const COLORS = [0x4ade80, 0x818cf8, 0xf472b6, 0xfbbf24];

export default function SpiralStory() {
  const sec = useRef(null);
  const cvs = useRef(null);
  const [chapter, setChapter] = useState(0);
  const [mode, setMode] = useState('loading'); // loading | webgl | static
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const section = sec.current;
    const canvas = cvs.current;
    if (!section || !canvas) return undefined;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setMode('static');
      return undefined;
    }
    let disposed = false;
    let raf = 0;
    let cleanup = () => {};

    (async () => {
      let THREE;
      let RoundedBoxGeometry;
      try {
        THREE = await import('three');
        ({ RoundedBoxGeometry } = await import('three/examples/jsm/geometries/RoundedBoxGeometry.js'));
      } catch (e) {
        setMode('static');
        return;
      }
      if (disposed) return;
      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
      } catch (e) {
        setMode('static');
        return;
      }
      const coarse = window.matchMedia('(pointer: coarse)').matches;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x07070d);
      scene.fog = new THREE.FogExp2(0x07070d, 0.045);
      const camera = new THREE.PerspectiveCamera(64, 1, 0.05, 120);
      camera.position.set(0, 0, 0);
      scene.add(camera);

      scene.add(new THREE.HemisphereLight(0x8890ff, 0x10101a, 0.55));
      const key = new THREE.PointLight(0xfff0e0, 2.4, 3.2);
      key.position.set(0, -0.2, -0.6);
      camera.add(key);
      const rim = new THREE.PointLight(0x818cf8, 1.6, 6);
      rim.position.set(0, 1.2, 0.4);
      camera.add(rim);

      const glowTex = (() => {
        const c = document.createElement('canvas');
        c.width = c.height = 64;
        const g = c.getContext('2d');
        const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
        gr.addColorStop(0, 'rgba(255,255,255,1)');
        gr.addColorStop(0.35, 'rgba(255,255,255,0.35)');
        gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gr;
        g.fillRect(0, 0, 64, 64);
        return new THREE.CanvasTexture(c);
      })();

      const labelTex = (text, color) => {
        const c = document.createElement('canvas');
        c.width = 256;
        c.height = 96;
        const g = c.getContext('2d');
        g.font = '700 38px "Space Mono", ui-monospace, monospace';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillStyle = '#' + color.toString(16).padStart(6, '0');
        g.fillText(text, 128, 48);
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace;
        return t;
      };

      // ---- Hands + dial, attached to the camera so they stay in your lap ----
      const rig = new THREE.Group();
      rig.position.set(0, -0.5, -0.95);
      rig.rotation.x = -1.05;
      camera.add(rig);

      const dial = new THREE.Group();
      rig.add(dial);
      const ringMat = new THREE.MeshStandardMaterial({ color: 0x15151f, metalness: 0.7, roughness: 0.35 });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.045, 20, 120), ringMat);
      dial.add(ring);
      const tickMat = new THREE.MeshStandardMaterial({ color: 0x4ade80, emissive: 0x4ade80, emissiveIntensity: 1.4 });
      for (let i = 0; i < 48; i += 1) {
        const a = (i / 48) * Math.PI * 2;
        const long = i % 6 === 0;
        const tk = new THREE.Mesh(new RoundedBoxGeometry(long ? 0.03 : 0.014, long ? 0.1 : 0.05, 0.02, 2, 0.006), tickMat);
        tk.position.set(Math.cos(a) * 0.5, Math.sin(a) * 0.5, 0.02);
        tk.rotation.z = a - Math.PI / 2;
        dial.add(tk);
      }
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.05, 40), new THREE.MeshStandardMaterial({ color: 0x1b1b28, metalness: 0.8, roughness: 0.3 }));
      hub.rotation.x = Math.PI / 2;
      dial.add(hub);
      const arrow = new THREE.Mesh(new RoundedBoxGeometry(0.03, 0.26, 0.03, 2, 0.01), new THREE.MeshStandardMaterial({ color: 0xf472b6, emissive: 0xf472b6, emissiveIntensity: 1.2 }));
      arrow.position.set(0, 0.07, 0.04);
      dial.add(arrow);
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0x4ade80, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending }));
      halo.scale.set(2.2, 2.2, 1);
      halo.position.z = -0.02;
      dial.add(halo);

      const skin = new THREE.MeshStandardMaterial({ color: 0xb98563, roughness: 0.62, metalness: 0.02 });
      const sleeveMat = new THREE.MeshStandardMaterial({ color: 0x20202c, roughness: 0.8 });
      const cuffMat = new THREE.MeshStandardMaterial({ color: 0x4ade80, emissive: 0x4ade80, emissiveIntensity: 0.25, roughness: 0.4 });
      const makeHand = (side) => {
        const hand = new THREE.Group();
        const palm = new THREE.Mesh(new RoundedBoxGeometry(0.17, 0.055, 0.19, 4, 0.025), skin);
        hand.add(palm);
        const fingers = [];
        const lens = [0.1, 0.115, 0.108, 0.088];
        for (let i = 0; i < 4; i += 1) {
          const root = new THREE.Group();
          root.position.set(-0.062 + i * 0.042, 0, -0.085);
          const seg1 = new THREE.Mesh(new THREE.CapsuleGeometry(0.0165, lens[i] * 0.55, 6, 12), skin);
          seg1.rotation.x = Math.PI / 2;
          seg1.position.z = -lens[i] * 0.3;
          root.add(seg1);
          const knuckle = new THREE.Group();
          knuckle.position.z = -lens[i] * 0.62;
          const seg2 = new THREE.Mesh(new THREE.CapsuleGeometry(0.0145, lens[i] * 0.45, 6, 12), skin);
          seg2.rotation.x = Math.PI / 2;
          seg2.position.z = -lens[i] * 0.2;
          knuckle.add(seg2);
          root.add(knuckle);
          root.rotation.x = 0.25;
          knuckle.rotation.x = 0.7;
          hand.add(root);
          fingers.push({ root, knuckle });
        }
        const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.019, 0.07, 6, 12), skin);
        thumb.position.set(-side * 0.1, 0.005, -0.03);
        thumb.rotation.set(Math.PI / 2, 0, side * 0.9);
        hand.add(thumb);
        const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.07, 0.3, 24), sleeveMat);
        sleeve.rotation.x = Math.PI / 2;
        sleeve.position.set(0, 0.01, 0.23);
        hand.add(sleeve);
        const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.007, 10, 36), cuffMat);
        cuff.position.set(0, 0.01, 0.085);
        hand.add(cuff);
        // Lie flat on the dial plane, fingers pointing up the dial, arm coming from the bottom edge.
        const outer = new THREE.Group();
        hand.rotation.x = Math.PI / 2;
        outer.add(hand);
        outer.position.set(side * 0.55, -0.02, 0.075);
        outer.rotation.z = side * 0.6;
        outer.scale.setScalar(1.25);
        return { hand: outer, inner: hand, fingers, side };
      };
      const hl = makeHand(-1);
      const hr = makeHand(1);
      rig.add(hl.hand, hr.hand);

      // Armrests: you are sitting in something.
      const armMat = new THREE.MeshStandardMaterial({ color: 0x12121a, metalness: 0.5, roughness: 0.45 });
      [-1, 1].forEach((s) => {
        const arm = new THREE.Mesh(new RoundedBoxGeometry(0.22, 0.12, 1.1, 4, 0.05), armMat);
        arm.position.set(s * 1.25, -0.62, -0.1);
        arm.rotation.z = s * -0.1;
        camera.add(arm);
        const edge = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.01, 1.0), new THREE.MeshStandardMaterial({ color: 0x818cf8, emissive: 0x818cf8, emissiveIntensity: 1.2 }));
        edge.position.set(s * 1.14, -0.55, -0.1);
        camera.add(edge);
      });

      // ---- The spiral ----
      const world = new THREE.Group();
      scene.add(world);
      const N = 110;
      const STEP = 1.55;
      const nodes = [];
      const curve = [];
      const curve2 = [];
      const R = 2.5;
      for (let i = 0; i < N; i += 1) {
        const th = i * 0.46;
        const z = -3 - i * STEP;
        const rr = R + Math.sin(i * 0.3) * 0.35;
        const col = COLORS[i % 4];
        const g = new THREE.Group();
        g.position.set(Math.cos(th) * rr, Math.sin(th) * rr, z);
        const mat = new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.55, metalness: 0.3, roughness: 0.35 });
        let mesh;
        const kind = i % 4;
        if (kind === 0) mesh = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.3, 0.06, 3, 0.03), mat);
        else if (kind === 1) mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.24), mat);
        else if (kind === 2) mesh = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.05, 14, 40), mat);
        else mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 0), mat);
        g.add(mesh);
        const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: col, transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending }));
        h.scale.set(1.3, 1.3, 1);
        g.add(h);
        if (i % 3 === 0) {
          const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTex(LABELS[(i / 3) % LABELS.length | 0], col), transparent: true, depthWrite: false }));
          s.scale.set(1.1, 0.41, 1);
          s.position.set(0, -0.5, 0);
          g.add(s);
        }
        g.userData = { mesh, mat, halo: h, spin: 0.4 + (i % 5) * 0.15, base: 0.55 };
        world.add(g);
        nodes.push(g);
      }
      for (let i = 0; i <= N * 6; i += 1) {
        const u = i / 6;
        const th = u * 0.46;
        const rr = R + Math.sin(u * 0.3) * 0.35;
        const z = -3 - u * STEP;
        curve.push(new THREE.Vector3(Math.cos(th) * rr, Math.sin(th) * rr, z));
        curve2.push(new THREE.Vector3(Math.cos(th + Math.PI) * (rr * 0.8), Math.sin(th + Math.PI) * (rr * 0.8), z));
      }
      const lineA = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve), new THREE.LineBasicMaterial({ color: 0x818cf8, transparent: true, opacity: 0.5 }));
      const lineB = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve2), new THREE.LineBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.22 }));
      world.add(lineA, lineB);
      const DUST = 900;
      const dpos = new Float32Array(DUST * 3);
      for (let i = 0; i < DUST; i += 1) {
        dpos[i * 3] = (Math.random() - 0.5) * 12;
        dpos[i * 3 + 1] = (Math.random() - 0.5) * 12;
        dpos[i * 3 + 2] = -Math.random() * N * STEP;
      }
      const dg = new THREE.BufferGeometry();
      dg.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
      world.add(new THREE.Points(dg, new THREE.PointsMaterial({ color: 0xc7caff, size: 0.035, transparent: true, opacity: 0.55, depthWrite: false })));

      // ---- Sizing, input, loop ----
      const state = { p: 0, ps: 0, vel: 0, mx: 0, my: 0, dragAngle: null, visible: true, last: performance.now() };
      const resize = () => {
        const w = canvas.clientWidth || window.innerWidth;
        const h = canvas.clientHeight || window.innerHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.fov = w / h < 0.8 ? 78 : 64;
        camera.updateProjectionMatrix();
        rig.position.y = w / h < 0.8 ? -0.42 : -0.5;
        rig.scale.setScalar(w / h < 0.8 ? 0.86 : 1);
      };
      resize();
      window.addEventListener('resize', resize);

      const readProgress = () => {
        const r = section.getBoundingClientRect();
        const total = Math.max(1, r.height - window.innerHeight);
        state.p = Math.min(1, Math.max(0, -r.top / total));
        state.visible = r.bottom > 0 && r.top < window.innerHeight;
      };
      window.addEventListener('scroll', readProgress, { passive: true });
      readProgress();

      const onMove = (e) => {
        state.mx = (e.clientX / window.innerWidth - 0.5) * 2;
        state.my = (e.clientY / window.innerHeight - 0.5) * 2;
        if (state.dragAngle !== null) {
          const r = canvas.getBoundingClientRect();
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height * 0.84;
          const a = Math.atan2(e.clientY - cy, e.clientX - cx);
          let d = a - state.dragAngle;
          if (d > Math.PI) d -= Math.PI * 2;
          if (d < -Math.PI) d += Math.PI * 2;
          state.dragAngle = a;
          window.scrollBy(0, d * window.innerHeight * 0.9);
        }
      };
      const onDown = (e) => {
        const r = canvas.getBoundingClientRect();
        if (e.clientY - r.top < r.height * 0.55) return;
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height * 0.84;
        state.dragAngle = Math.atan2(e.clientY - cy, e.clientX - cx);
        canvas.setPointerCapture?.(e.pointerId);
        canvas.classList.add('is-grab');
      };
      const onUp = () => {
        state.dragAngle = null;
        canvas.classList.remove('is-grab');
      };
      window.addEventListener('pointermove', onMove);
      canvas.addEventListener('pointerdown', onDown);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);

      const L = (N - 6) * STEP;
      const TURNS = Math.PI * 7;
      let lastCh = -1;
      const frame = (now) => {
        raf = requestAnimationFrame(frame);
        if (!state.visible) {
          state.last = now;
          return;
        }
        const dt = Math.min(0.05, (now - state.last) / 1000);
        state.last = now;
        const k = 1 - Math.exp(-6 * dt);
        const prev = state.ps;
        state.ps += (state.p - state.ps) * k;
        state.vel += (((state.ps - prev) / Math.max(dt, 0.001)) - state.vel) * (1 - Math.exp(-10 * dt));
        const t = now / 1000;
        const ps = state.ps;

        world.position.z = ps * L;
        world.rotation.z = ps * TURNS * 0.18;
        dial.rotation.z = -ps * TURNS;

        // Look around slightly + breathe.
        camera.rotation.y += (-state.mx * 0.1 - camera.rotation.y) * k;
        camera.rotation.x += (-state.my * 0.06 + Math.sin(t * 1.1) * 0.004 - camera.rotation.x) * k;
        camera.rotation.z = Math.sin(ps * TURNS * 0.18) * 0.02;
        rig.position.y += ((-0.5 + Math.sin(t * 1.3) * 0.006) - rig.position.y) * 0.1;

        // Hands: wrists follow the dial a little, fingers flex with scroll speed.
        const flex = Math.min(1, Math.abs(state.vel) * 3.5);
        const sway = Math.max(-1, Math.min(1, state.vel * 4));
        [hl, hr].forEach((h, i) => {
          const side = i === 0 ? -1 : 1;
          h.hand.rotation.z = side * 0.6 + sway * 0.1 * side;
          h.hand.position.z = 0.075 + Math.sin(t * 1.3 + i) * 0.003;
          h.fingers.forEach((f, j) => {
            f.root.rotation.x = 0.25 + flex * 0.12 + Math.sin(t * 2 + j + i) * 0.015;
            f.knuckle.rotation.x = 0.7 + flex * 0.2;
          });
        });

        nodes.forEach((g, i) => {
          const d = g.userData;
          d.mesh.rotation.y += dt * d.spin;
          d.mesh.rotation.x += dt * d.spin * 0.5;
          const wz = g.position.z + world.position.z; // distance ahead (negative)
          const near = Math.max(0, 1 - Math.abs(wz + 3.5) / 6);
          const s = 1 + near * 0.55 + Math.sin(t * 2 + i) * 0.04;
          g.scale.setScalar(s);
          d.mat.emissiveIntensity = d.base + near * 1.5;
          d.halo.material.opacity = 0.28 + near * 0.5;
        });

        const ch = Math.min(CHAPTERS.length - 1, Math.floor(ps * CHAPTERS.length * 0.999));
        if (ch !== lastCh) {
          lastCh = ch;
          setChapter(ch);
        }
        renderer.render(scene, camera);
      };
      setMode('webgl');
      raf = requestAnimationFrame(frame);

      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', resize);
        window.removeEventListener('scroll', readProgress);
        window.removeEventListener('pointermove', onMove);
        canvas.removeEventListener('pointerdown', onDown);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
        scene.traverse((o) => {
          if (o.geometry) o.geometry.dispose();
          if (o.material) {
            [].concat(o.material).forEach((m) => {
              if (m.map) m.map.dispose();
              m.dispose();
            });
          }
        });
        renderer.dispose();
      };
    })();

    const progress = () => {
      const r = section.getBoundingClientRect();
      const total = Math.max(1, r.height - window.innerHeight);
      setPct(Math.min(1, Math.max(0, -r.top / total)));
    };
    window.addEventListener('scroll', progress, { passive: true });
    progress();

    return () => {
      disposed = true;
      window.removeEventListener('scroll', progress);
      cleanup();
    };
  }, []);

  const c = CHAPTERS[chapter];
  return (
    <section ref={sec} id="spiral" className={`spiral is-${mode}`} aria-label="How I work, in six steps">
      <div className="spiral-sticky">
        <canvas ref={cvs} className="spiral-canvas" aria-hidden="true" />
        <div className="spiral-vignette" aria-hidden="true" />
        <div className="spiral-copy wrap" key={chapter}>
          <p className="label">{c.k}</p>
          <h2 className="title" dangerouslySetInnerHTML={{ __html: c.t }} />
          <p className="lead">{c.p}</p>
          {c.cta ? (
            <div className="spiral-cta">
              <a href="#contact" className="btn btn-primary">
                Start a project <span className="arrow">→</span>
              </a>
              <a href="#babyfoot" className="btn btn-ghost">
                Take a break: babyfoot
              </a>
            </div>
          ) : null}
        </div>
        <div className="spiral-hint" aria-hidden="true">
          <svg viewBox="0 0 120 120" width="84" height="84">
            <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeOpacity=".25" strokeWidth="3" />
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${pct * 314} 314`}
              transform="rotate(-90 60 60)"
            />
            <text x="60" y="66" textAnchor="middle" fontSize="22" fill="currentColor" fontFamily="Space Mono, monospace">
              {String(chapter + 1).padStart(2, '0')}
            </text>
          </svg>
          <span>{pct < 0.02 ? 'Scroll or drag a circle on the dial' : 'Keep turning'}</span>
        </div>
        {/* Real text for crawlers and reduced-motion/no-WebGL visitors. */}
        <div className="spiral-static">
          {CHAPTERS.map((x) => (
            <article key={x.k}>
              <p className="label">{x.k}</p>
              <h3 className="title" dangerouslySetInnerHTML={{ __html: x.t }} />
              <p className="lead">{x.p}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
