/**
 * DAMI — 3D hero scene.
 *
 * A procedurally modelled hoodie STUDY (placeholder form) in a minimal
 * architectural set: arched wall, plinth, soft key light and warm rim light.
 * It is NOT a DAMI product model — the official garment model (GLB) can be
 * dropped in later by replacing `buildHoodie()` with a GLTFLoader call.
 *
 * Built with plain three.js to keep the bundle lean (no R3F runtime needed for
 * a single, self-contained canvas). Rendering pauses when off-screen.
 */
import * as THREE from "three";
import { ParametricGeometry } from "three/examples/jsm/geometries/ParametricGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export type Colourway = { id: string; label: string; fabric: string; sheen: string; rib: string };

export const COLOURWAYS: Colourway[] = [
  { id: "bone", label: "Bone", fabric: "#e4d5bb", sheen: "#fff6e6", rib: "#dccbae" },
  { id: "bordeaux", label: "Bordeaux", fabric: "#5a1523", sheen: "#b0505e", rib: "#4f111e" },
  { id: "black", label: "Black", fabric: "#1d1c1c", sheen: "#6d6a66", rib: "#171616" },
  { id: "charcoal", label: "Charcoal", fabric: "#3e3d3c", sheen: "#8f8b86", rib: "#363535" },
];

export type View = "front" | "back" | "detail";

type Options = {
  quality: "high" | "medium";
  reducedMotion: boolean;
  onReady?: () => void;
};

const TAU = Math.PI * 2;
const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const spow = (v: number, p: number) => Math.sign(v) * Math.pow(Math.abs(v), p);

/* ───────────────────────── Procedural textures ───────────────────────── */

/** Brushed-fleece micro surface as a tangent-space normal map. */
function fleeceNormalMap(size = 256): THREE.DataTexture {
  const h = new Float32Array(size * size);
  // layered value noise
  const rand = (x: number, y: number) => {
    const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  const noise = (x: number, y: number, f: number) => {
    const xi = Math.floor(x * f), yi = Math.floor(y * f);
    const xf = x * f - xi, yf = y * f - yi;
    const w = (i: number, j: number) => rand((xi + i) % f, (yi + j) % f);
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    return lerp(lerp(w(0, 0), w(1, 0), u), lerp(w(0, 1), w(1, 1), u), v);
  };
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const nx = x / size, ny = y / size;
      h[y * size + x] = noise(nx, ny, 16) * 0.5 + noise(nx, ny, 32) * 0.3 + noise(nx, ny, 64) * 0.2;
    }
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const l = h[y * size + ((x - 1 + size) % size)], r = h[y * size + ((x + 1) % size)];
      const d = h[((y - 1 + size) % size) * size + x], u = h[((y + 1) % size) * size + x];
      const n = new THREE.Vector3((l - r) * 2.2, (d - u) * 2.2, 1).normalize();
      const i = (y * size + x) * 4;
      data[i] = (n.x * 0.5 + 0.5) * 255;
      data[i + 1] = (n.y * 0.5 + 0.5) * 255;
      data[i + 2] = (n.z * 0.5 + 0.5) * 255;
      data[i + 3] = 255;
    }
  const t = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.needsUpdate = true;
  return t;
}

/** 2x2 rib knit — vertical wales. */
function ribNormalMap(): THREE.DataTexture {
  const w = 64, hgt = 8;
  const data = new Uint8Array(w * hgt * 4);
  for (let y = 0; y < hgt; y++)
    for (let x = 0; x < w; x++) {
      const phase = (x / w) * TAU * 4; // 4 wales per tile
      const nx = -Math.cos(phase) * 0.75;
      const n = new THREE.Vector3(nx, 0, 1).normalize();
      const i = (y * w + x) * 4;
      data[i] = (n.x * 0.5 + 0.5) * 255;
      data[i + 1] = 128;
      data[i + 2] = (n.z * 0.5 + 0.5) * 255;
      data[i + 3] = 255;
    }
  const t = new THREE.DataTexture(data, w, hgt, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.needsUpdate = true;
  return t;
}

/* ───────────────────────── Garment geometry ───────────────────────── */

const NECK_Y = 0.62;
const SHOULDER_Y = 0.47;
const HEM_Y = -0.6;
const RIB_H = 0.15;

/** Half-width and half-depth of the torso at height y (boxy, dropped shoulder). */
function torso(y: number) {
  if (y > SHOULDER_Y) {
    const t = (y - SHOULDER_Y) / (NECK_Y - SHOULDER_Y);
    const k = Math.pow(1 - Math.pow(t, 1.7), 0.6);
    return { a: 0.21 + 0.43 * k, b: 0.15 + 0.08 * k };
  }
  // gentle blouson above the hem rib, then gathered into the rib
  const blouse = smooth(-0.25, -0.5, y) * 0.018;
  const gather = smooth(-0.53, HEM_Y, y) * 0.06;
  return { a: 0.64 + blouse - gather, b: 0.23 + blouse * 0.6 - gather * 0.45 };
}

function bodyFn(u: number, v: number, target: THREE.Vector3) {
  const y = lerp(NECK_Y, HEM_Y, v);
  const { a, b } = torso(y);
  const th = u * TAU - Math.PI / 2; // seam at the side
  const n = 3.1;
  let x = a * spow(Math.cos(th), 2 / n);
  let z = b * spow(Math.sin(th), 2 / n);
  // slight chest / shoulder-blade shaping
  if (z > 0) z *= 1 - 0.05 * smooth(0.3, -0.2, y);
  else z *= 1 + 0.06 * smooth(0.2, 0.42, y) * smooth(0.55, 0.42, y);
  // fabric folds: soft horizontal drape + compression folds above the hem rib
  const side = Math.abs(Math.cos(th));
  const fold =
    0.006 * Math.sin(y * 17 + Math.cos(th) * 3) * (0.4 + side) +
    0.011 * Math.sin(th * 13 + 1.3) * smooth(-0.35, -0.58, y) +
    0.007 * Math.sin(th * 7 + y * 9) * smooth(0.1, -0.3, y) * side;
  const r = Math.hypot(x, z) || 1;
  x += (x / r) * fold;
  z += (z / r) * fold;
  target.set(x, y, z);
}

function ribFn(cx: number, cy: number, a: number, b: number, h: number) {
  return (u: number, v: number, t: THREE.Vector3) => {
    const th = u * TAU - Math.PI / 2;
    const n = 2.6;
    const swell = 1 + 0.03 * Math.sin(v * Math.PI);
    t.set(cx + a * swell * spow(Math.cos(th), 2 / n), cy - v * h, b * swell * spow(Math.sin(th), 2 / n));
  };
}

function sleeve(side: 1 | -1) {
  const pts = [
    new THREE.Vector3(0.5 * side, 0.29, -0.01),
    new THREE.Vector3(0.67 * side, 0.15, 0.0),
    new THREE.Vector3(0.77 * side, -0.1, 0.03),
    new THREE.Vector3(0.81 * side, -0.36, 0.07),
    new THREE.Vector3(0.81 * side, -0.58, 0.1),
  ];
  const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal");
  const tub = 96, rad = 40;
  const geo = new THREE.TubeGeometry(curve, tub, 1, rad, false);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const c = new THREE.Vector3(), p = new THREE.Vector3();
  for (let i = 0; i <= tub; i++) {
    const s = i / tub;
    curve.getPointAt(s, c);
    // radius profile: armhole → bicep → elbow → gathered above cuff
    let r = lerp(0.185, 0.16, smooth(0, 0.3, s));
    r = lerp(r, 0.14, smooth(0.35, 0.75, s));
    r = lerp(r, 0.105, smooth(0.85, 1, s));
    // stacked folds above the cuff
    r += 0.012 * Math.sin(s * 70) * smooth(0.65, 0.92, s) + 0.004 * Math.sin(s * 31);
    for (let j = 0; j <= rad; j++) {
      const k = i * (rad + 1) + j;
      p.fromBufferAttribute(pos, k).sub(c);
      const ang = (j / rad) * TAU;
      const flat = 1 - 0.12 * Math.cos(ang * 2) ** 2; // slightly oval sleeve
      p.multiplyScalar(r * flat);
      pos.setXYZ(k, c.x + p.x, c.y + p.y, c.z + p.z);
    }
  }
  geo.computeVertexNormals();
  const end = curve.getPointAt(1);
  const tan = curve.getTangentAt(1);
  return { geo, end, tan };
}

/** Hood lying down on the back: a draped collar thick at the back, crossing at the front. */
function hoodFn(u: number, v: number, t: THREE.Vector3) {
  const th = u * TAU; // 0 = front centre
  const back = (1 - Math.cos(th)) / 2; // 0 front → 1 back
  // neckline path
  const px = 0.235 * Math.sin(th);
  const pz = 0.16 * Math.cos(th) - 0.05 * back;
  const py = NECK_Y - 0.02 - 0.11 * Math.pow(Math.max(0, Math.cos(th)), 6) + 0.05 * back;
  // section: rolls outward then hangs down the back
  const phi = v * TAU;
  const rw = lerp(0.03, 0.14, Math.pow(back, 1.3));
  const rh = lerp(0.035, 0.24, Math.pow(back, 1.6));
  const outward = new THREE.Vector2(Math.sin(th), Math.cos(th) * 0.9).normalize();
  const sx = Math.cos(phi) * rw;
  let sy = Math.sin(phi) * rh;
  sy -= rh * 0.55 * back; // drape down
  const pull = 0.06 * back * (1 + Math.cos(phi)); // lie against the back
  t.set(px + outward.x * (sx + pull), py + sy, pz + outward.y * (sx + pull) - 0.05 * back * back);
}

function pocketGeometry() {
  // Kangaroo pocket: narrow top, angled hand openings, wider base.
  const s = new THREE.Shape();
  const topW = 0.29, botW = 0.4, h = 0.36, open = 0.17;
  s.moveTo(-topW, 0);
  s.lineTo(topW, 0);
  s.bezierCurveTo(topW + 0.03, -open * 0.4, botW - 0.02, -open, botW, -open - 0.02);
  s.lineTo(botW, -h + 0.03);
  s.quadraticCurveTo(botW, -h, botW - 0.03, -h);
  s.lineTo(-botW + 0.03, -h);
  s.quadraticCurveTo(-botW, -h, -botW, -h + 0.03);
  s.lineTo(-botW, -open - 0.02);
  s.bezierCurveTo(-botW + 0.02, -open, -topW - 0.03, -open * 0.4, -topW, 0);
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.012, bevelSegments: 4, curveSegments: 24 });
  // bend to follow the torso front
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    pos.setZ(i, pos.getZ(i) - 0.22 * Math.pow(Math.abs(x) / 0.45, 3.1) * 0.6);
  }
  geo.computeVertexNormals();
  return { geo, shape: s };
}

function stitchLine(shape: THREE.Shape, inset: number, material: THREE.Material) {
  const pts = shape.getSpacedPoints(160).map((p) => {
    const x = p.x * (1 - inset), y = p.y * (1 - inset) - inset * 0.18;
    return new THREE.Vector3(x, y, 0.034 - 0.22 * Math.pow(Math.abs(x) / 0.45, 3.1) * 0.6);
  });
  const g = new THREE.BufferGeometry().setFromPoints(pts);
  const l = new THREE.Line(g, material);
  l.computeLineDistances();
  return l;
}

function buildHoodie(fabric: THREE.MeshPhysicalMaterial, rib: THREE.MeshPhysicalMaterial, inner: THREE.MeshStandardMaterial, stitch: THREE.LineDashedMaterial) {
  const g = new THREE.Group();
  const add = (m: THREE.Object3D) => {
    m.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    g.add(m);
    return m;
  };

  add(new THREE.Mesh(new ParametricGeometry(bodyFn, 160, 120), fabric));

  // hem rib
  const hemA = torso(HEM_Y).a, hemB = torso(HEM_Y).b;
  const hem = new ParametricGeometry(ribFn(0, HEM_Y + 0.004, hemA * 0.99, hemB * 0.97, RIB_H), 200, 8);
  add(new THREE.Mesh(hem, rib));

  for (const side of [1, -1] as const) {
    const s = sleeve(side);
    add(new THREE.Mesh(s.geo, fabric));
    // cuff rib, aligned with the sleeve end tangent
    const cuff = new THREE.Mesh(new ParametricGeometry(ribFn(0, 0, 0.095, 0.085, 0.14), 96, 6), rib);
    cuff.position.copy(s.end);
    cuff.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), s.tan.clone().normalize());
    add(cuff);
  }

  const hood = new THREE.Mesh(new ParametricGeometry(hoodFn, 180, 48), fabric);
  add(hood);
  // hood interior shadow plug (dark inside of the neckline)
  const neck = new THREE.Mesh(new THREE.CircleGeometry(0.2, 48), inner);
  neck.rotation.x = -Math.PI / 2;
  neck.scale.set(1.1, 0.75, 1);
  neck.position.set(0, NECK_Y - 0.09, -0.03);
  g.add(neck);

  const p = pocketGeometry();
  const pocket = new THREE.Mesh(p.geo, fabric);
  pocket.position.set(0, -0.16, 0.214);
  add(pocket);
  const st = stitchLine(p.shape, 0.035, stitch);
  st.position.copy(pocket.position);
  g.add(st);

  return g;
}

/* ───────────────────────── Set & scene ───────────────────────── */

function buildSet(scene: THREE.Scene) {
  // Shadow-catching floor (transparent canvas: the architecture behind is HTML/CSS)
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: 0.45 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.3;
  floor.receiveShadow = true;
  scene.add(floor);

  // Stone plinth
  const stone = new THREE.MeshStandardMaterial({ color: "#2e2a27", roughness: 0.72, metalness: 0.02 });
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.78, 0.14, 96), stone);
  plinth.position.y = -1.23;
  plinth.receiveShadow = true;
  plinth.castShadow = true;
  scene.add(plinth);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.004, 8, 128), new THREE.MeshStandardMaterial({ color: "#d8c7a8", roughness: 0.4, metalness: 0.6 }));
  lip.rotation.x = Math.PI / 2;
  lip.position.y = -1.16;
  scene.add(lip);
}

export function createHoodieScene(canvas: HTMLCanvasElement, opts: Options) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: opts.quality === "high", alpha: true, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, opts.quality === "high" ? 1.75 : 1.25));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();

  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = env;
  scene.environmentIntensity = 0.32;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);

  // Materials
  const fleeceN = fleeceNormalMap();
  fleeceN.repeat.set(7, 7);
  const ribN = ribNormalMap();
  ribN.repeat.set(70, 1);
  const cw = COLOURWAYS[0];
  const fabric = new THREE.MeshPhysicalMaterial({
    color: cw.fabric,
    roughness: 0.93,
    metalness: 0,
    sheen: 1,
    sheenRoughness: 0.55,
    sheenColor: new THREE.Color(cw.sheen),
    normalMap: fleeceN,
    normalScale: new THREE.Vector2(0.28, 0.28),
    side: THREE.DoubleSide,
  });
  const rib = new THREE.MeshPhysicalMaterial({
    color: cw.rib,
    roughness: 0.9,
    sheen: 0.8,
    sheenRoughness: 0.6,
    sheenColor: new THREE.Color(cw.sheen),
    normalMap: ribN,
    normalScale: new THREE.Vector2(0.9, 0.9),
    side: THREE.DoubleSide,
  });
  const inner = new THREE.MeshStandardMaterial({ color: "#0d0c0c", roughness: 1 });
  const stitch = new THREE.LineDashedMaterial({ color: cw.rib, dashSize: 0.012, gapSize: 0.008, transparent: true, opacity: 0.55 });

  buildSet(scene);
  const garment = buildHoodie(fabric, rib, inner, stitch);
  garment.position.y = -0.05;
  const pivot = new THREE.Group();
  pivot.add(garment);
  scene.add(pivot);

  // Lighting — key, fill, warm rim, top
  scene.add(new THREE.HemisphereLight("#f5f1e9", "#1a1414", 0.35));
  const key = new THREE.SpotLight("#fff4e4", 38, 14, Math.PI / 6, 0.6, 1.4);
  key.position.set(-2.6, 3.6, 3.4);
  key.castShadow = true;
  key.shadow.mapSize.set(opts.quality === "high" ? 2048 : 1024, opts.quality === "high" ? 2048 : 1024);
  key.shadow.bias = -0.0004;
  key.shadow.radius = 6;
  key.target.position.set(0, -0.1, 0);
  scene.add(key, key.target);
  const rim = new THREE.SpotLight("#d8c7a8", 30, 12, Math.PI / 5, 0.8, 1.5);
  rim.position.set(2.4, 2.4, -2.6);
  rim.target.position.set(0, 0, 0);
  scene.add(rim, rim.target);
  const rim2 = new THREE.PointLight("#b8806a", 4, 6, 1.6);
  rim2.position.set(-2.2, 0.6, -1.8);
  scene.add(rim2);
  const fill = new THREE.DirectionalLight("#e9e2d6", 0.55);
  fill.position.set(3, 1, 4);
  scene.add(fill);

  /* ── interaction: drag to rotate (horizontal), slight tilt; keeps vertical page scroll ── */
  const state = {
    yaw: -0.35,
    yawVel: 0,
    tilt: 0,
    targetTilt: 0,
    dragging: false,
    lastX: 0,
    lastY: 0,
    pointerX: 0,
    pointerY: 0,
    view: "front" as View,
    camDist: 6.4,
    camDistTarget: 6.4,
    camY: 0.45,
    camYTarget: 0.45,
    autoYaw: !opts.reducedMotion,
    idle: 0,
    colourFrom: new THREE.Color(cw.fabric),
    colourTo: new THREE.Color(cw.fabric),
    sheenTo: new THREE.Color(cw.sheen),
    ribTo: new THREE.Color(cw.rib),
    colourT: 1,
  };

  const onDown = (e: PointerEvent) => {
    state.dragging = true;
    state.lastX = e.clientX;
    state.lastY = e.clientY;
    state.idle = 0;
    canvas.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    state.pointerX = ((e.clientX - r.left) / r.width) * 2 - 1;
    state.pointerY = ((e.clientY - r.top) / r.height) * 2 - 1;
    if (!state.dragging) return;
    const dx = e.clientX - state.lastX;
    const dy = e.clientY - state.lastY;
    state.lastX = e.clientX;
    state.lastY = e.clientY;
    state.yawVel = dx * 0.006;
    state.yaw += dx * 0.006;
    state.targetTilt = THREE.MathUtils.clamp(state.targetTilt + dy * 0.002, -0.18, 0.22);
  };
  const onUp = () => {
    state.dragging = false;
    state.idle = 0;
  };
  canvas.addEventListener("pointerdown", onDown);
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);

  /* ── sizing ── */
  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Portrait screens: pull back so the garment stays fully in frame
    const portrait = w / h < 0.9;
    state.camDistTarget = state.view === "detail" ? (portrait ? 4.2 : 3.4) : portrait ? 8.2 : 6.4;
    // Wide screens: shift the garment right of centre, leaving room for the headline.
    if (w >= 1024) camera.setViewOffset(w, h, -w * 0.09, 0, w, h);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  /* ── loop (paused off-screen / hidden tab) ── */
  let visible = true;
  let raf = 0;
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) loop();
  });
  io.observe(canvas);

  const clock = new THREE.Clock();
  let readySent = false;
  const tmp = new THREE.Color();

  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    if (!state.dragging) {
      state.idle += dt;
      state.yaw += state.yawVel;
      state.yawVel *= 0.93;
      if (state.autoYaw && state.idle > 2.5 && state.view !== "back" && state.view !== "detail") state.yaw += dt * 0.12;
    }
    state.tilt += (state.targetTilt - state.tilt) * 0.08;
    if (!state.dragging) state.targetTilt *= 0.985;

    pivot.rotation.y = state.yaw;
    pivot.rotation.x = state.tilt;
    // breathing drift
    if (!opts.reducedMotion) {
      garment.position.y = -0.05 + Math.sin(t * 0.8) * 0.018;
      garment.rotation.z = Math.sin(t * 0.5) * 0.008;
    }

    // camera: slow cinematic orbit + subtle pointer parallax
    state.camDist += (state.camDistTarget - state.camDist) * 0.05;
    state.camY += (state.camYTarget - state.camY) * 0.05;
    const orbit = opts.reducedMotion ? 0 : Math.sin(t * 0.12) * 0.22;
    const px = opts.reducedMotion ? 0 : state.pointerX * 0.18;
    const py = opts.reducedMotion ? 0 : state.pointerY * 0.1;
    camera.position.set(Math.sin(orbit + px) * state.camDist, state.camY + 0.25 - py, Math.cos(orbit + px) * state.camDist);
    camera.lookAt(0, state.view === "detail" ? 0.15 : -0.2, 0);

    // light breathes with pointer
    key.position.x = -2.6 + state.pointerX * 0.9;
    rim.intensity = 30 + Math.sin(t * 0.6) * 3;

    // colourway tween
    if (state.colourT < 1) {
      state.colourT = Math.min(1, state.colourT + dt * 1.6);
      const k = smooth(0, 1, state.colourT);
      fabric.color.copy(tmp.copy(state.colourFrom).lerp(state.colourTo, k));
      fabric.sheenColor.lerp(state.sheenTo, k * 0.2);
      rib.color.lerp(state.ribTo, k * 0.25);
      rib.sheenColor.lerp(state.sheenTo, k * 0.2);
      stitch.color.lerp(state.ribTo, k * 0.25);
    }

    renderer.render(scene, camera);
    if (!readySent) {
      readySent = true;
      opts.onReady?.();
    }
  }

  function loop() {
    cancelAnimationFrame(raf);
    const step = () => {
      if (!visible || document.hidden) return;
      frame();
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }
  const onVis = () => !document.hidden && visible && loop();
  document.addEventListener("visibilitychange", onVis);
  loop();

  return {
    setColour(id: string) {
      const c = COLOURWAYS.find((x) => x.id === id);
      if (!c) return;
      state.colourFrom.copy(fabric.color);
      state.colourTo.set(c.fabric);
      state.sheenTo.set(c.sheen);
      state.ribTo.set(c.rib);
      state.colourT = 0;
    },
    setView(v: View) {
      state.view = v;
      state.idle = 0;
      const norm = (a: number) => a - TAU * Math.round(a / TAU);
      const target = v === "back" ? Math.PI : v === "front" ? -0.35 : -0.6;
      const delta = norm(target - state.yaw);
      state.yawVel = 0;
      // ease toward target via a short tween
      const start = state.yaw;
      const t0 = performance.now();
      const dur = 1400;
      const ease = (x: number) => 1 - Math.pow(1 - x, 4);
      const tick = () => {
        const k = Math.min(1, (performance.now() - t0) / dur);
        state.yaw = start + delta * ease(k);
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      state.camYTarget = v === "detail" ? 0.4 : 0.45;
      resize();
    },
    dispose() {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose?.();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose?.();
      });
      fleeceN.dispose();
      ribN.dispose();
      env.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
  };
}

export type HoodieScene = ReturnType<typeof createHoodieScene>;
