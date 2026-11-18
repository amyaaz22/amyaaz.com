'use client';

// Babyfoot in 3D. You stand behind the green goal looking down the table. The ball has real
// height and gravity (it bounces, it can be chipped over the men), the men swing on their rods
// and hit the ball with their own velocity. Rivals are fictional; your ladder spot is saved on
// this device only.

import { useEffect, useRef, useState } from 'react';

// Logic coordinates: x runs along the table (green goal at x=0), y across, z up.
const FW = 1000;
const FH = 560;
const R = 10;
const GOAL_H = 190;
const ROD_Y = 64; // rod axis height
const LEG = 44; // pivot to foot centre
const GRAV = 1900;
const WIN = 5;

const RIVALS = [
  { n: 'Dodo FC', s: 300, r: 0.34 },
  { n: 'Port Louis Pelé', s: 400, r: 0.26 },
  { n: 'Le Pouce Rangers', s: 520, r: 0.2 },
  { n: 'The Wall', s: 640, r: 0.15 },
  { n: 'Keeper Killer', s: 780, r: 0.1 },
  { n: 'Captain Noor', s: 940, r: 0.06 },
];

const ROD_DEFS = [
  { x: 0.055, team: 0, men: 1, gap: 0, h: 70 },
  { x: 0.17, team: 0, men: 2, gap: 200, h: 46 },
  { x: 0.3, team: 1, men: 3, gap: 180, h: 42 },
  { x: 0.425, team: 0, men: 5, gap: 108, h: 36 },
  { x: 0.575, team: 1, men: 5, gap: 108, h: 36 },
  { x: 0.7, team: 0, men: 3, gap: 180, h: 42 },
  { x: 0.83, team: 1, men: 2, gap: 200, h: 46 },
  { x: 0.945, team: 1, men: 1, gap: 0, h: 70 },
];

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const makeRods = () =>
  ROD_DEFS.map((d) => {
    const span = ((d.men - 1) / 2) * d.gap;
    return { ...d, px: d.x * FW, y: 0, ty: 0, lim: d.men === 1 ? FH / 2 - 150 : FH / 2 - d.h / 2 - 8 - span, a: 0, w: 0, cool: 0, vy: 0 };
  });

export default function Babyfoot() {
  const ref = useRef(null);
  const ctl = useRef({});
  const [ui, setUi] = useState({ you: 0, ai: 0, level: 0, msg: 'Click the table, then A / D slide · Space kick', over: false, sound: false, flash: 0, gl: true });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    let disposed = false;
    let raf = 0;
    let cleanup = () => {};

    (async () => {
      let THREE;
      try {
        THREE = await import('three');
      } catch (e) {
        setUi((u) => ({ ...u, gl: false }));
        return;
      }
      if (disposed) return;
      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
      } catch (e) {
        setUi((u) => ({ ...u, gl: false }));
        return;
      }
      const coarse = window.matchMedia('(pointer: coarse)').matches;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0a0a12);
      scene.fog = new THREE.Fog(0x0a0a12, 1300, 2600);
      const camera = new THREE.PerspectiveCamera(48, 16 / 10, 10, 4000);
      const camBase = new THREE.Vector3(0, 540, 900);
      camera.position.copy(camBase);
      camera.lookAt(0, -30, -110);

      scene.add(new THREE.HemisphereLight(0xbcc4ff, 0x2a2018, 0.8));
      const sun = new THREE.DirectionalLight(0xfff1d6, 2.2);
      sun.position.set(-300, 900, 400);
      sun.castShadow = true;
      const sm = coarse ? 1024 : 2048;
      sun.shadow.mapSize.set(sm, sm);
      Object.assign(sun.shadow.camera, { left: -700, right: 700, top: 700, bottom: -700, near: 100, far: 2200 });
      sun.shadow.bias = -0.0006;
      scene.add(sun);
      const spot = new THREE.PointLight(0x818cf8, 0.9, 1800);
      spot.position.set(380, 420, -200);
      scene.add(spot);

      // three.x = logic y, three.y = height, three.z = -logic x
      const P = (x, y, z) => new THREE.Vector3(y - FH / 2, z, -(x - FW / 2));

      // Felt texture with mow stripes + markings
      const feltTex = (() => {
        const c = document.createElement('canvas');
        c.width = 2000;
        c.height = 1120;
        const g = c.getContext('2d');
        const sx = c.width / FW;
        const sy = c.height / FH;
        for (let i = 0; i < 10; i += 1) {
          g.fillStyle = i % 2 ? '#1b7a3e' : '#1f8a47';
          g.fillRect(i * 200, 0, 200, c.height);
        }
        g.strokeStyle = 'rgba(255,255,255,.8)';
        g.lineWidth = 6;
        g.strokeRect(6, 6, c.width - 12, c.height - 12);
        g.beginPath();
        g.moveTo(c.width / 2, 0);
        g.lineTo(c.width / 2, c.height);
        g.stroke();
        g.beginPath();
        g.arc(c.width / 2, c.height / 2, 70 * sx, 0, Math.PI * 2);
        g.stroke();
        g.strokeRect(0, c.height / 2 - 150 * sy, 120 * sx, 300 * sy);
        g.strokeRect(c.width - 120 * sx, c.height / 2 - 150 * sy, 120 * sx, 300 * sy);
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 8;
        return t;
      })();
      const felt = new THREE.Mesh(new THREE.PlaneGeometry(FH, FW), new THREE.MeshStandardMaterial({ map: feltTex, roughness: 0.95 }));
      felt.rotation.x = -Math.PI / 2;
      felt.receiveShadow = true;
      scene.add(felt);

      const wood = new THREE.MeshStandardMaterial({ color: 0x7b4a24, roughness: 0.55, metalness: 0.05 });
      const darkWood = new THREE.MeshStandardMaterial({ color: 0x4a2c14, roughness: 0.6 });
      const WH = 44;
      const WT = 36;
      const box = (w, h, d, mat, x, y, z) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        m.position.set(x, y, z);
        m.castShadow = true;
        m.receiveShadow = true;
        scene.add(m);
        return m;
      };
      // side rails (along length)
      box(WT, WH, FW + WT * 2, wood, -FH / 2 - WT / 2, WH / 2, 0);
      box(WT, WH, FW + WT * 2, wood, FH / 2 + WT / 2, WH / 2, 0);
      // end walls with the goal opening
      const seg = (FH - GOAL_H) / 2;
      [-1, 1].forEach((s) => {
        const z = s * (FW / 2 + WT / 2);
        box(seg, WH, WT, wood, -FH / 2 + seg / 2, WH / 2, z);
        box(seg, WH, WT, wood, FH / 2 - seg / 2, WH / 2, z);
        box(GOAL_H, WH - 18, WT, darkWood, 0, (WH - 18) / 2 + 18, z);
        // goal pocket
        box(GOAL_H + 20, 40, 90, new THREE.MeshStandardMaterial({ color: 0x050a07, roughness: 1 }), 0, 8, s * (FW / 2 + WT + 40));
      });
      // table body + legs
      box(FH + WT * 2 + 20, 120, FW + WT * 2 + 20, darkWood, 0, -70, 0);
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([ax, az]) => box(46, 380, 46, darkWood, ax * (FH / 2 + 10), -320, az * (FW / 2 - 40)));
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000), new THREE.MeshStandardMaterial({ color: 0x0d0d16, roughness: 0.9 }));
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -515;
      floor.receiveShadow = true;
      scene.add(floor);

      // Rods and men
      const rods = makeRods();
      const rodMeshes = rods.map((r) => {
        const col = r.team === 0 ? 0x4ade80 : 0xf472b6;
        const body = new THREE.MeshStandardMaterial({ color: col, roughness: 0.4, metalness: 0.15 });
        const skinM = new THREE.MeshStandardMaterial({ color: 0xe8c9a8, roughness: 0.6 });
        const group = new THREE.Group();
        group.position.set(0, ROD_Y, -(r.px - FW / 2));
        const steel = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.9, roughness: 0.25 });
        const rod = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, FH + 300, 14), steel);
        rod.rotation.z = Math.PI / 2;
        rod.castShadow = true;
        group.add(rod);
        const hx = (r.team === 0 ? 1 : -1) * (FH / 2 + 140);
        const knob = new THREE.Mesh(new THREE.CylinderGeometry(13, 13, 62, 20), new THREE.MeshStandardMaterial({ color: 0x15151c, roughness: 0.5 }));
        knob.rotation.z = Math.PI / 2;
        knob.position.x = hx;
        knob.castShadow = true;
        group.add(knob);
        const cap = new THREE.Mesh(new THREE.SphereGeometry(14, 16, 12), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.1 }));
        cap.position.x = hx + (r.team === 0 ? 34 : -34);
        group.add(cap);
        const dir = r.team === 0 ? 1 : -1;
        const men = [];
        for (let k = 0; k < r.men; k += 1) {
          const piv = new THREE.Group();
          piv.position.x = (k - (r.men - 1) / 2) * r.gap;
          const leg = new THREE.Mesh(new THREE.BoxGeometry(r.h * 0.78, LEG, 14), body);
          leg.position.y = -LEG / 2;
          const foot = new THREE.Mesh(new THREE.BoxGeometry(r.h, 14, 24), body);
          foot.position.set(0, -LEG + 5, -dir * 5);
          const torso = new THREE.Mesh(new THREE.BoxGeometry(r.h * 0.9, 28, 15), body);
          torso.position.y = 16;
          const head = new THREE.Mesh(new THREE.SphereGeometry(10, 16, 12), skinM);
          head.position.y = 38;
          [leg, foot, torso, head].forEach((m) => {
            m.castShadow = true;
            piv.add(m);
          });
          group.add(piv);
          men.push(piv);
        }
        scene.add(group);
        return { group, men, dir, mat: body };
      });

      // Ball
      const ballTex = (() => {
        const c = document.createElement('canvas');
        c.width = 256;
        c.height = 128;
        const g = c.getContext('2d');
        g.fillStyle = '#f8fafc';
        g.fillRect(0, 0, 256, 128);
        g.fillStyle = '#111';
        for (let i = 0; i < 12; i += 1) {
          g.beginPath();
          g.arc(((i * 53) % 256), ((i * 37) % 112) + 8, 13, 0, Math.PI * 2);
          g.fill();
        }
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace;
        return t;
      })();
      const ballMesh = new THREE.Mesh(new THREE.SphereGeometry(R, 28, 20), new THREE.MeshStandardMaterial({ map: ballTex, roughness: 0.35, emissive: 0xffffff, emissiveIntensity: 0.12 }));
      ballMesh.castShadow = true;
      scene.add(ballMesh);

      // Confetti
      const NP = 160;
      const ppos = new Float32Array(NP * 3);
      const pcol = new Float32Array(NP * 3);
      const pvel = new Float32Array(NP * 3);
      const plife = new Float32Array(NP);
      const pg = new THREE.BufferGeometry();
      pg.setAttribute('position', new THREE.BufferAttribute(ppos, 3));
      pg.setAttribute('color', new THREE.BufferAttribute(pcol, 3));
      const confetti = new THREE.Points(pg, new THREE.PointsMaterial({ size: 9, vertexColors: true, transparent: true, depthWrite: false }));
      confetti.frustumCulled = false;
      scene.add(confetti);
      const burst = (x, y, cols) => {
        for (let i = 0; i < NP; i += 1) {
          const v = P(x, y, 40);
          ppos.set([v.x, v.y, v.z], i * 3);
          const a = Math.random() * Math.PI * 2;
          const s = 120 + Math.random() * 420;
          pvel.set([Math.cos(a) * s, 200 + Math.random() * 520, Math.sin(a) * s], i * 3);
          const c = new THREE.Color(cols[i % cols.length]);
          pcol.set([c.r, c.g, c.b], i * 3);
          plife[i] = 1 + Math.random() * 1.2;
        }
        pg.attributes.color.needsUpdate = true;
      };

      // ---- Game state ----
      let level = 0;
      try {
        level = clamp(parseInt(localStorage.getItem('babyfoot.level') || '0', 10) || 0, 0, RIVALS.length - 1);
      } catch (e) {
        /* no storage */
      }
      const G = {
        rods,
        ball: { x: FW / 2, y: FH / 2, z: R, vx: 0, vy: 0, vz: 0 },
        you: 0,
        ai: 0,
        level,
        active: 5,
        assist: true,
        keys: {},
        pointerX: null,
        state: 'ready',
        timer: 0,
        towards: 1,
        sound: false,
        actx: null,
        visible: true,
        shake: 0,
      };
      ctl.current.G = G;
      window.__babyfoot = G;
      const push = (extra) => setUi((u) => ({ ...u, you: G.you, ai: G.ai, level: G.level, ...extra }));
      push({});

      const beep = (f, d = 0.08, type = 'sine', v = 0.06) => {
        if (!G.sound) return;
        try {
          if (!G.actx) G.actx = new (window.AudioContext || window.webkitAudioContext)();
          const a = G.actx;
          const o = a.createOscillator();
          const g = a.createGain();
          o.type = type;
          o.frequency.value = f;
          g.gain.setValueAtTime(v, a.currentTime);
          g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + d);
          o.connect(g).connect(a.destination);
          o.start();
          o.stop(a.currentTime + d);
        } catch (e) {
          /* audio unavailable */
        }
      };

      const serve = (towards) => {
        Object.assign(G.ball, { x: FW / 2, y: FH / 2 + (Math.random() - 0.5) * 120, z: R + 90, vx: 0, vy: 0, vz: 0 });
        G.state = 'ready';
        G.timer = 0.9;
        G.towards = towards;
      };
      serve(Math.random() < 0.5 ? 1 : -1);
      ctl.current.reset = () => {
        G.you = 0;
        G.ai = 0;
        G.rods.forEach((r) => Object.assign(r, { y: 0, ty: 0, a: 0, w: 0 }));
        serve(1);
        push({ over: false, msg: 'Fresh match. Kick off!' });
      };
      ctl.current.nextRival = (up) => {
        G.level = clamp(G.level + (up ? 1 : 0), 0, RIVALS.length - 1);
        try {
          localStorage.setItem('babyfoot.level', String(G.level));
        } catch (e) {
          /* no storage */
        }
        ctl.current.reset();
      };
      ctl.current.toggleSound = () => {
        G.sound = !G.sound;
        if (G.sound) beep(660, 0.1);
        push({ sound: G.sound });
      };

      const playerRods = () => G.rods.map((r, i) => (r.team === 0 ? i : -1)).filter((i) => i >= 0);
      const pickRod = () => {
        if (!G.assist) return;
        let best = -1;
        let bd = 1e9;
        playerRods().forEach((i) => {
          const d = Math.abs(G.rods[i].px - G.ball.x) + (G.rods[i].px < G.ball.x ? 0 : 120);
          if (d < bd) {
            bd = d;
            best = i;
          }
        });
        if (best >= 0) G.active = best;
      };
      const kickRod = (r) => {
        if (r.cool > 0) return;
        r.w = 22; // angular velocity, rad/s toward the opponent's goal
        r.cool = 0.3;
        beep(220, 0.05, 'square', 0.03);
      };
      ctl.current.kick = () => kickRod(G.rods[G.active]);
      ctl.current.move = (d) => {
        G.keys.__dx = d;
      };

      const onMove = (e) => {
        const r = canvas.getBoundingClientRect();
        G.pointerX = ((e.clientX - r.left) / r.width - 0.5) * FH * 1.6;
      };
      const onDown = (e) => {
        canvas.focus({ preventScroll: true });
        onMove(e);
        kickRod(G.rods[G.active]);
      };
      const onLeave = () => {
        G.pointerX = null;
      };
      const onKey = (e) => {
        const k = e.key.toLowerCase();
        if (['a', 'd', 'arrowleft', 'arrowright', ' ', '1', '2', '3', '4', 'q', 'e'].includes(k)) e.preventDefault();
        if (e.type === 'keydown') {
          G.keys[k] = true;
          if (k === ' ' || k === 'enter') kickRod(G.rods[G.active]);
          const pr = playerRods();
          if (['1', '2', '3', '4'].includes(k)) {
            G.active = pr[Number(k) - 1];
            G.assist = false;
            push({ msg: 'Rod locked. Press Q for auto-rod.' });
          }
          if (k === 'q') {
            G.assist = true;
            push({ msg: 'Auto-rod on: I pick the rod nearest the ball.' });
          }
          if (k === 'e') {
            G.assist = false;
            G.active = pr[(pr.indexOf(G.active) + 1) % pr.length];
          }
        } else G.keys[k] = false;
      };
      canvas.addEventListener('pointermove', onMove);
      canvas.addEventListener('pointerdown', onDown);
      canvas.addEventListener('pointerleave', onLeave);
      canvas.addEventListener('keydown', onKey);
      canvas.addEventListener('keyup', onKey);
      const io = new IntersectionObserver((en) => {
        G.visible = en[0].isIntersecting;
      });
      io.observe(canvas);

      const goal = (who) => {
        if (who === 0) G.you += 1;
        else G.ai += 1;
        G.shake = 0.4;
        burst(who === 0 ? FW : 0, G.ball.y, who === 0 ? [0x4ade80, 0xfbbf24, 0xffffff] : [0xf472b6, 0x818cf8, 0xffffff]);
        beep(who === 0 ? 880 : 180, 0.35, who === 0 ? 'triangle' : 'sawtooth', 0.08);
        if (G.you >= WIN || G.ai >= WIN) {
          G.state = 'over';
          const won = G.you >= WIN;
          push({
            over: true,
            won,
            flash: Date.now(),
            msg: won
              ? G.level >= RIVALS.length - 1
                ? 'You beat the whole ladder. Legend.'
                : `You beat ${RIVALS[G.level].n}. Next: ${RIVALS[G.level + 1].n}.`
              : `${RIVALS[G.level].n} wins this one. Run it back?`,
          });
        } else {
          G.state = 'goal';
          G.timer = 1.4;
          G.towards = who === 0 ? -1 : 1;
          push({ flash: Date.now(), msg: who === 0 ? 'GOAL! Green scores.' : `Goal for ${RIVALS[G.level].n}.` });
        }
      };

      const step = (dt) => {
        const riv = RIVALS[G.level];
        const pr = G.rods[G.active];
        if (G.pointerX !== null) pr.ty = G.pointerX;
        const dx = (G.keys.a || G.keys.arrowleft ? -1 : 0) + (G.keys.d || G.keys.arrowright ? 1 : 0) + (G.keys.__dx || 0);
        if (dx) {
          pr.ty = pr.y + dx * 900 * dt;
          G.pointerX = null;
        }
        G.rods.forEach((r, i) => {
          r.cool = Math.max(0, r.cool - dt);
          // swing dynamics: spring back to vertical, a little overshoot
          r.w += (-420 * r.a - 22 * r.w) * dt;
          r.a = clamp(r.a + r.w * dt, -1.2, 1.35);
          let target = r.ty;
          let sp = 1100;
          if (r.team === 1) {
            const b = G.ball;
            target = b.y - FH / 2 + (b.x < r.px ? 0.05 : 0.12) * b.vy + Math.sin(performance.now() / 520 + i) * 66 * riv.r;
            sp = riv.s;
            if (Math.abs(b.x - r.px) < 62 && b.z < 50 && G.state === 'play' && Math.random() < dt / riv.r) {
              const near = Array.from({ length: r.men }, (_, k) => r.y + (k - (r.men - 1) / 2) * r.gap + FH / 2).some((my) => Math.abs(my - b.y) < r.h / 2 + 22);
              if (near) kickRod(r);
            }
          } else if (i !== G.active) {
            target = (G.ball.y - FH / 2) * 0.6;
            sp = 340;
          }
          const old = r.y;
          r.y = clamp(r.y + clamp(target - r.y, -sp * dt, sp * dt), -r.lim, r.lim);
          r.vy = (r.y - old) / dt;
        });

        if (G.state === 'ready' || G.state === 'goal') {
          G.timer -= dt;
          if (G.state === 'ready') {
            // hold the ball in the air above the centre spot until the drop
            G.ball.vz = 0;
            G.ball.z = R + 90;
          }
          if (G.timer <= 0) {
            if (G.state === 'goal') serve(G.towards);
            G.state = 'play';
            if (!G.ball.vx) {
              G.ball.vx = (G.towards || 1) * 240;
              G.ball.vy = (Math.random() - 0.5) * 200;
            }
          }
        }
        if (G.state !== 'play' && G.state !== 'goal') return;
        if (G.state === 'play') pickRod();
        const b = G.ball;
        b.vz -= GRAV * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.z += b.vz * dt;
        const onFloor = b.z <= R + 0.5;
        if (b.z < R) {
          b.z = R;
          if (b.vz < 0) {
            const hit = -b.vz;
            b.vz = hit > 140 ? hit * 0.52 : 0;
            if (hit > 220) beep(110 + hit * 0.05, 0.05, 'triangle', Math.min(0.05, hit / 8000));
          }
        }
        if (b.z > 260) {
          b.z = 260;
          b.vz = -Math.abs(b.vz) * 0.4;
        }
        const fr = Math.exp((onFloor ? -0.5 : -0.05) * dt);
        b.vx *= fr;
        b.vy *= fr;
        const sp2 = Math.hypot(b.vx, b.vy);
        if (sp2 > 1500) {
          b.vx *= 1500 / sp2;
          b.vy *= 1500 / sp2;
        }
        if (G.state !== 'play') return;
        if (sp2 < 30 && onFloor) b.vx += (b.x < FW / 2 ? 1 : -1) * 90 * dt;
        // side walls
        if (b.y < R) {
          b.y = R;
          b.vy = Math.abs(b.vy) * 0.82;
        }
        if (b.y > FH - R) {
          b.y = FH - R;
          b.vy = -Math.abs(b.vy) * 0.82;
        }
        const inGoal = Math.abs(b.y - FH / 2) < GOAL_H / 2 - R * 0.4;
        if (b.x < R) {
          if (inGoal && b.x < -R && b.z < 40) return goal(1);
          if (!inGoal || b.z >= 40) {
            b.x = R;
            b.vx = Math.abs(b.vx) * 0.8;
          }
        }
        if (b.x > FW - R) {
          if (inGoal && b.x > FW + R && b.z < 40) return goal(0);
          if (!inGoal || b.z >= 40) {
            b.x = FW - R;
            b.vx = -Math.abs(b.vx) * 0.8;
          }
        }
        // feet: sphere vs box, using the foot's own swing velocity
        G.rods.forEach((r) => {
          const dir = r.team === 0 ? 1 : -1;
          const sa = Math.sin(r.a);
          const ca = Math.cos(r.a);
          const fx = r.px + dir * LEG * sa;
          const fz = ROD_Y - LEG * ca;
          const fvx = dir * LEG * r.w * ca;
          const fvz = LEG * r.w * sa;
          for (let k = 0; k < r.men; k += 1) {
            const my = FH / 2 + r.y + (k - (r.men - 1) / 2) * r.gap;
            const hx = 12;
            const hy = r.h / 2;
            const hz = 10;
            const nx = clamp(b.x, fx - hx, fx + hx);
            const ny = clamp(b.y, my - hy, my + hy);
            const nz = clamp(b.z, fz - hz, fz + hz);
            const ddx = b.x - nx;
            const ddy = b.y - ny;
            const ddz = b.z - nz;
            const d = Math.hypot(ddx, ddy, ddz);
            if (d < R) {
              let ux = ddx;
              let uy = ddy;
              let uz = ddz;
              if (d < 0.001) {
                ux = dir;
                uy = 0;
                uz = 0;
              } else {
                ux /= d;
                uy /= d;
                uz /= d;
              }
              b.x = nx + ux * R;
              b.y = ny + uy * R;
              b.z = Math.max(R, nz + uz * R);
              const rvx = b.vx - fvx;
              const rvy = b.vy - r.vy;
              const rvz = b.vz - fvz;
              const vn = rvx * ux + rvy * uy + rvz * uz;
              if (vn < 0) {
                const j = -(1 + 0.68) * vn;
                b.vx += j * ux;
                b.vy += j * uy;
                b.vz += j * uz;
                if (Math.abs(r.w) > 4) {
                  G.shake = Math.max(G.shake, 0.08);
                  beep(r.team === 0 ? 420 : 300, 0.06, 'square', 0.05);
                } else beep(180, 0.03, 'triangle', 0.03);
              }
            }
          }
        });
      };

      // ---- Render sync ----
      const ballQ = new THREE.Quaternion();
      const axis = new THREE.Vector3();
      const up = new THREE.Vector3(0, 1, 0);
      const sync = (dt) => {
        const b = G.ball;
        const v = P(b.x, b.y, b.z);
        ballMesh.position.copy(v);
        const vx3 = b.vy;
        const vz3 = -b.vx;
        const spd = Math.hypot(vx3, vz3);
        if (spd > 1) {
          axis.set(vx3, 0, vz3).cross(up).normalize();
          axis.set(-axis.x, 0, -axis.z); // roll direction
          ballQ.setFromAxisAngle(axis, (spd * dt) / R);
          ballMesh.quaternion.premultiply(ballQ);
        }
        G.rods.forEach((r, i) => {
          const m = rodMeshes[i];
          m.group.position.x = r.y;
          m.men.forEach((piv) => {
            piv.rotation.x = m.dir * r.a;
          });
          m.mat.emissive.setHex(i === G.active && r.team === 0 ? 0x4ade80 : 0x000000);
          m.mat.emissiveIntensity = i === G.active && r.team === 0 ? 0.28 : 0;
        });
        for (let i = 0; i < NP; i += 1) {
          if (plife[i] > 0) {
            plife[i] -= dt;
            pvel[i * 3 + 1] -= 900 * dt;
            ppos[i * 3] += pvel[i * 3] * dt;
            ppos[i * 3 + 1] = Math.max(2, ppos[i * 3 + 1] + pvel[i * 3 + 1] * dt);
            ppos[i * 3 + 2] += pvel[i * 3 + 2] * dt;
          } else ppos[i * 3 + 1] = -9999;
        }
        pg.attributes.position.needsUpdate = true;
        // camera: slight look-around from the pointer + goal shake
        const px = G.pointerX === null ? 0 : G.pointerX / (FH * 0.8);
        camera.position.x += (camBase.x + px * 60 - camera.position.x) * Math.min(1, dt * 3);
        camera.position.y = camBase.y + Math.sin(performance.now() / 1400) * 3 + (G.shake > 0 ? (Math.random() - 0.5) * G.shake * 30 : 0);
        camera.lookAt(0, -30, -110);
      };

      const resize = () => {
        const w = canvas.clientWidth || 800;
        const h = canvas.clientHeight || 500;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      resize();
      window.addEventListener('resize', resize);

      let last = performance.now();
      const loop = (now) => {
        raf = requestAnimationFrame(loop);
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        if (!G.visible) return;
        for (let i = 0; i < 4; i += 1) step(dt / 4);
        G.shake = Math.max(0, G.shake - dt);
        sync(dt);
        renderer.render(scene, camera);
      };
      raf = requestAnimationFrame(loop);

      cleanup = () => {
        cancelAnimationFrame(raf);
        io.disconnect();
        window.removeEventListener('resize', resize);
        canvas.removeEventListener('pointermove', onMove);
        canvas.removeEventListener('pointerdown', onDown);
        canvas.removeEventListener('pointerleave', onLeave);
        canvas.removeEventListener('keydown', onKey);
        canvas.removeEventListener('keyup', onKey);
        scene.traverse((o) => {
          if (o.geometry) o.geometry.dispose();
          if (o.material) [].concat(o.material).forEach((m) => {
            if (m.map) m.map.dispose();
            m.dispose();
          });
        });
        renderer.dispose();
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  const riv = RIVALS[ui.level];
  return (
    <section id="babyfoot" className="section babyfoot" aria-labelledby="babyfoot-title" data-shape="ambient">
      <div className="wrap">
        <div className="label" data-reveal>
          Take a break
        </div>
        <h2 className="title" id="babyfoot-title" data-reveal>
          A quick game of <em>babyfoot</em>.
        </h2>
        <p className="lead" data-reveal>
          First to {WIN}. You are green, defending the goal nearest you. The ball has real weight: it bounces, and a hard swing can chip it over the men. Beat a rival to climb the ladder. Rivals are fictional; your spot is saved on this device.
        </p>
        <div className="bf-board">
          <div className="bf-top">
            <div className="bf-score" aria-live="polite">
              <b>You</b> <span>{ui.you}</span> <i>:</i> <span>{ui.ai}</span> <b>{riv.n}</b>
            </div>
            <div className="bf-actions">
              <button type="button" className="btn btn-ghost" onClick={() => ctl.current.toggleSound?.()}>
                Sound {ui.sound ? 'on' : 'off'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => ctl.current.reset?.()}>
                Restart
              </button>
            </div>
          </div>
          <div className="bf-stage">
            <canvas
              ref={ref}
              className="bf-canvas"
              tabIndex={0}
              role="application"
              aria-label="Babyfoot game. Click the table, then use A and D to slide the rod, Space to kick, 1 to 4 to pick a rod, Q for auto rod."
            />
            {ui.flash ? (
              <div className="bf-flash" key={ui.flash} aria-hidden="true">
                {ui.over ? (ui.won ? 'WINNER' : 'FULL TIME') : 'GOAL!'}
              </div>
            ) : null}
            {!ui.gl ? <p className="bf-nogl">The 3D table needs WebGL, which this browser doesn't have.</p> : null}
            {ui.over ? (
              <div className="bf-over" role="status">
                <p>{ui.msg}</p>
                <button type="button" className="btn btn-primary" onClick={() => ctl.current.nextRival?.(ui.won)}>
                  {ui.won && ui.level < RIVALS.length - 1 ? `Face ${RIVALS[ui.level + 1].n}` : 'Play again'}
                </button>
              </div>
            ) : null}
          </div>
          <p className="bf-msg">{ui.msg}</p>
          <div className="bf-touch" aria-hidden="true">
            <button type="button" onPointerDown={() => ctl.current.move?.(-1)} onPointerUp={() => ctl.current.move?.(0)} onPointerLeave={() => ctl.current.move?.(0)}>
              ◄
            </button>
            <button type="button" className="kick" onPointerDown={() => ctl.current.kick?.()}>
              KICK
            </button>
            <button type="button" onPointerDown={() => ctl.current.move?.(1)} onPointerUp={() => ctl.current.move?.(0)} onPointerLeave={() => ctl.current.move?.(0)}>
              ►
            </button>
          </div>
          <ol className="bf-ladder" aria-label="Rival ladder (fictional)">
            {RIVALS.map((r, i) => (
              <li key={r.n} className={i === ui.level ? 'on' : i < ui.level ? 'done' : ''}>
                <span>{i + 1}</span>
                {r.n}
              </li>
            ))}
          </ol>
          <p className="bf-keys">A / D or mouse slide · Space or click kick · 1–4 lock a rod · Q auto-rod</p>
        </div>
      </div>
    </section>
  );
}
