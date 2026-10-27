/**
 * Hero scene « Le seuil » : the Portico mark built in 3D (entablature, two
 * fluted columns, an arch), lit from inside the doorway. A tunnel of rings and
 * a stream of particles pass through the arch: a session going through.
 *
 * - Loaded lazily (dynamic import of three) after the page is interactive.
 * - Colours come from the theme tokens and follow `portico:theme`.
 * - One render loop, paused off-screen and on hidden tabs.
 * - prefers-reduced-motion: a single still frame, no intro, no drift.
 * - Scroll dollies the camera towards the doorway.
 */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { token } from './theme.ts';

const S = 0.01; // mark units (512-space of portico-mark.svg) → world units

function col(name: string, fallback: string): THREE.Color {
  return new THREE.Color(token(name) || fallback);
}

/** Cylinder with shallow flutes, like the TUI's `|:|:|` columns. */
function flutedColumn(radius: number, height: number, flutes = 16): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(radius, radius * 1.04, height, flutes * 6, 1, false);
  const p = g.attributes['position'] as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const r = Math.hypot(v.x, v.z);
    if (r < radius * 0.5) continue; // caps' centres
    const a = Math.atan2(v.z, v.x);
    const k = 1 - 0.045 * Math.max(0, Math.cos(a * flutes)) ** 2;
    p.setXYZ(i, v.x * k, v.y, v.z * k);
  }
  g.computeVertexNormals();
  return g;
}

/** The arch stroke of the mark, extruded. */
function archGeometry(depth: number): THREE.ExtrudeGeometry {
  const cx = 256 * S;
  const cy = -290 * S;
  const bottom = -392 * S;
  const ro = (48 + 11) * S;
  const ri = (48 - 11) * S;
  const s = new THREE.Shape();
  s.moveTo(cx - ro, bottom);
  s.lineTo(cx - ro, cy);
  s.absarc(cx, cy, ro, Math.PI, 0, true);
  s.lineTo(cx + ro, bottom);
  s.lineTo(cx + ri, bottom);
  s.lineTo(cx + ri, cy);
  s.absarc(cx, cy, ri, 0, Math.PI, false);
  s.lineTo(cx - ri, bottom);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01, bevelSegments: 2, curveSegments: 48 });
  g.translate(0, 0, -depth / 2);
  return g;
}

const GLOW_VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const GLOW_FRAG = /* glsl */ `
uniform vec3 uColor; uniform float uIntensity; uniform float uTime; uniform float uLight;
varying vec2 vUv;
void main() {
  vec2 p = vUv - vec2(0.5, 0.42);
  p.x *= 1.35;
  float d = length(p);
  float core = smoothstep(0.42, 0.0, d);
  float breath = 0.92 + 0.08 * sin(uTime * 0.9);
  float a = pow(core, 2.2) * uIntensity * breath;
  // Additive light on a dark ground; a soft wash of the accent on a light one (Marble).
  gl_FragColor = uLight > 0.5 ? vec4(uColor, min(a * 0.55, 0.8)) : vec4(uColor * a, a);
}`;

export interface HeroHandle {
  dispose(): void;
}

export function mountHero3D(stage: HTMLElement, onReady: () => void): HeroHandle | null {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    return null; // no WebGL: the static fallback stays
  }
  stage.appendChild(canvas);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  // Soft studio reflections so stone and brass read as materials, not silhouettes.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  scene.environmentIntensity = 0.3;
  pmrem.dispose();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 80);
  const fog = new THREE.Fog(0x000000, 7, 26);
  scene.fog = fog;

  // ---- The portico.
  const portico = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.3 });
  const brass = new THREE.MeshStandardMaterial({ roughness: 0.28, metalness: 1 });
  const D = 0.62;
  const bar = (x0: number, x1: number, y: number, depth: number, mat: THREE.Material) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry((x1 - x0) * S, 22 * S, depth), mat);
    m.position.set(((x0 + x1) / 2) * S, -y * S, 0);
    portico.add(m);
    return m;
  };
  bar(116, 396, 150, D + 0.12, stone);
  bar(136, 376, 186, D, stone);
  const base = bar(108, 404, 412, D + 0.24, stone);
  base.scale.y = 1.25;
  // Brass fillets on the entablature and base: the accent of the mark.
  const fillet = (x0: number, x1: number, y: number, z: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry((x1 - x0) * S, 0.022, 0.022), brass);
    m.position.set(((x0 + x1) / 2) * S, -y * S, z);
    portico.add(m);
  };
  fillet(116, 396, 139, (D + 0.12) / 2);
  fillet(136, 376, 197, D / 2);
  fillet(108, 404, 400, (D + 0.24) / 2);
  const colH = (392 - 186) * S;
  for (const x of [160, 352]) {
    const c = new THREE.Mesh(flutedColumn(0.13, colH), stone);
    c.position.set(x * S, -((186 + 392) / 2) * S, 0);
    portico.add(c);
    for (const y of [192, 386]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.142, 0.012, 8, 48), brass);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(x * S, -y * S, 0);
      portico.add(ring);
    }
  }
  const arch = new THREE.Mesh(archGeometry(D * 0.7), brass);
  portico.add(arch);

  // Centre the mark on the origin.
  const box = new THREE.Box3().setFromObject(portico);
  const centre = box.getCenter(new THREE.Vector3());
  portico.children.forEach((c) => c.position.sub(centre));
  scene.add(portico);
  const archCentre = new THREE.Vector3(256 * S - centre.x, -340 * S - centre.y, 0);

  // ---- Light from the doorway.
  const glowMat = new THREE.ShaderMaterial({
    vertexShader: GLOW_VERT,
    fragmentShader: GLOW_FRAG,
    uniforms: { uColor: { value: new THREE.Color() }, uIntensity: { value: 0 }, uTime: { value: 0 }, uLight: { value: 0 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), glowMat);
  glow.position.copy(archCentre).add(new THREE.Vector3(0, 0.05, -0.35));
  scene.add(glow);

  const doorLight = new THREE.PointLight(0xffffff, 0, 6, 1.6);
  doorLight.position.copy(archCentre).add(new THREE.Vector3(0, 0.1, -0.2));
  scene.add(doorLight);
  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(-4, 5, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 1.6);
  rim.position.set(3, 2, -6);
  scene.add(rim);
  const hemi = new THREE.HemisphereLight(0xffffff, 0x000000, 0.35);
  scene.add(hemi);

  // ---- Tunnel of rings behind the doorway, drifting towards the threshold.
  const RINGS = 14;
  const SPACING = 1.1;
  const ringMat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const ringGeo = new THREE.TorusGeometry(0.62, 0.004, 6, 96);
  const rings: THREE.Mesh[] = [];
  for (let i = 0; i < RINGS; i++) {
    const r = new THREE.Mesh(ringGeo, ringMat.clone());
    r.position.set(archCentre.x, archCentre.y, -0.9 - i * SPACING);
    scene.add(r);
    rings.push(r);
  }

  // ---- Packets: particles streaming out through the arch.
  const N = 420;
  const pos = new Float32Array(N * 3);
  const speed = new Float32Array(N);
  const seed = (i: number) => {
    const a = Math.random() * Math.PI * 2;
    const rr = Math.sqrt(Math.random()) * 0.5;
    pos[i * 3] = archCentre.x + Math.cos(a) * rr;
    pos[i * 3 + 1] = archCentre.y + Math.sin(a) * rr * 1.2;
    pos[i * 3 + 2] = -16 + Math.random() * 18;
    speed[i] = 0.6 + Math.random() * 1.4;
  };
  for (let i = 0; i < N; i++) seed(i);
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pMat = new THREE.PointsMaterial({ size: 0.022, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
  const points = new THREE.Points(pGeo, pMat);
  scene.add(points);

  // ---- Ground: a faint grid, swallowed by the fog.
  const grid = new THREE.GridHelper(40, 80, 0xffffff, 0xffffff);
  grid.position.y = box.min.y - centre.y - 0.001;
  const gridMat = grid.material as THREE.Material;
  gridMat.transparent = true;
  gridMat.opacity = 0.07;
  scene.add(grid);

  // ---- Theme.
  const applyTheme = () => {
    const accent = col('--accent', '#c8a96b');
    const bg = col('--bg-base', '#0b0c0e');
    const elevated = col('--bg-elevated', '#171a1e');
    const secondary = col('--text-secondary', '#a8a59d');
    // Marble (light): normal blending, since additive light vanishes on a light ground.
    const isLight = bg.getHSL({ h: 0, s: 0, l: 0 }).l > 0.5;
    const blending = isLight ? THREE.NormalBlending : THREE.AdditiveBlending;
    for (const m of [glowMat, pMat, ...rings.map((r) => r.material as THREE.Material)]) {
      m.blending = blending;
      m.needsUpdate = true;
    }
    glowMat.uniforms['uLight']!.value = isLight ? 1 : 0;
    fog.color.copy(bg);
    stone.color.copy(elevated).lerp(secondary, isLight ? 0.1 : 0.24);
    brass.color.copy(accent);
    glowMat.uniforms['uColor']!.value = accent.clone();
    doorLight.color.copy(accent);
    rim.color.copy(accent).lerp(new THREE.Color(0xffffff), 0.4);
    key.color.copy(isLight ? new THREE.Color(0xffffff) : secondary);
    rings.forEach((r) => ((r.material as THREE.MeshBasicMaterial).color = accent.clone()));
    pMat.color.copy(accent).lerp(new THREE.Color(isLight ? 0x000000 : 0xffffff), isLight ? 0.1 : 0.35);
    (grid.material as THREE.LineBasicMaterial).color = secondary.clone();
  };
  applyTheme();

  // ---- Layout: portico to the right of the copy on wide screens.
  let wide = true;
  const resize = () => {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    wide = w > 1100;
    camera.clearViewOffset();
    if (wide) camera.setViewOffset(w, h, -w * 0.2, 0, w, h);
    camera.updateProjectionMatrix();
    frame(performance.now(), true);
  };

  // ---- Motion.
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let scroll = 0;
  const start = performance.now();
  let last = start;
  let visible = true;
  let raf = 0;
  let readySent = false;

  const frame = (now: number, still = false) => {
    const t = (now - start) / 1000;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const calm = reduced.matches;
    const intro = calm ? 1 : Math.min(1, t / 1.8);
    const ease = 1 - (1 - intro) ** 3;

    pointer.x += (pointer.tx - pointer.x) * 0.05;
    pointer.y += (pointer.ty - pointer.y) * 0.05;
    const sway = calm ? 0 : Math.sin(t * 0.25) * 0.06;
    portico.rotation.y = -0.32 + sway + pointer.x * 0.16 + (1 - ease) * -0.5;
    portico.rotation.x = pointer.y * 0.05;
    portico.position.y = (1 - ease) * -0.25;

    const z = (wide ? 9.4 : 9.8) - scroll * 4.6;
    camera.position.set(pointer.x * 0.3, 0.35 + pointer.y * -0.15, z);
    camera.lookAt(0, -0.05, 0);

    glowMat.uniforms['uIntensity']!.value = 1.35 * ease;
    glowMat.uniforms['uTime']!.value = t;
    doorLight.intensity = 9 * ease;
    glow.rotation.y = portico.rotation.y;

    if (!calm && !still) {
      for (const r of rings) {
        r.position.z += dt * 0.55;
        if (r.position.z > -0.6) r.position.z -= RINGS * SPACING;
        const depth = (-r.position.z - 0.6) / (RINGS * SPACING);
        (r.material as THREE.MeshBasicMaterial).opacity = (1 - depth) * 0.55 * ease;
      }
      for (let i = 0; i < N; i++) {
        pos[i * 3 + 2]! += dt * speed[i]! * 1.6;
        if (pos[i * 3 + 2]! > 2.5) {
          seed(i);
          pos[i * 3 + 2] = -16;
        }
      }
      pGeo.attributes['position']!.needsUpdate = true;
    } else {
      rings.forEach((r) => {
        const depth = (-r.position.z - 0.6) / (RINGS * SPACING);
        (r.material as THREE.MeshBasicMaterial).opacity = (1 - depth) * 0.55;
      });
    }
    pMat.opacity = 0.85 * ease;

    renderer.render(scene, camera);
    if (!readySent) {
      readySent = true;
      onReady();
    }
  };

  const loop = (now: number) => {
    raf = 0;
    if (!visible || document.hidden || reduced.matches) return;
    frame(now);
    raf = requestAnimationFrame(loop);
  };
  const kick = () => {
    if (!raf && visible && !document.hidden && !reduced.matches) {
      last = performance.now();
      raf = requestAnimationFrame(loop);
    }
  };

  const ro = new ResizeObserver(resize);
  ro.observe(stage);
  const io = new IntersectionObserver(([e]) => {
    visible = e?.isIntersecting ?? false;
    kick();
  });
  io.observe(stage);
  const onMove = (e: PointerEvent) => {
    pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
    if (reduced.matches) return;
    kick();
  };
  const onScroll = () => {
    const h = stage.offsetHeight || 1;
    scroll = Math.min(1, Math.max(0, window.scrollY / h));
    if (reduced.matches) frame(performance.now(), true);
  };
  const onTheme = () => {
    applyTheme();
    frame(performance.now(), true);
  };
  const onMotion = () => (reduced.matches ? frame(performance.now(), true) : kick());
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('portico:theme', onTheme);
  document.addEventListener('visibilitychange', kick);
  reduced.addEventListener('change', onMotion);
  canvas.addEventListener('webglcontextlost', (e) => e.preventDefault());
  resize();
  kick();

  return {
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('portico:theme', onTheme);
      document.removeEventListener('visibilitychange', kick);
      reduced.removeEventListener('change', onMotion);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose();
      });
      envTex.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}
