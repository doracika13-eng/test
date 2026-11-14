/**
 * DAMI — scroll-driven 3D tunnel (hero).
 *
 * The camera flies forward through a corridor of floating images and
 * arch-shaped portals as the visitor scrolls. Images are spread around the
 * path (golden-angle spiral), fade in from the dark and dissolve as they pass.
 * Scroll velocity bends the panels and adds a faint chromatic split.
 */
import * as THREE from "three";

export type TunnelItem = { src: string; alt: string; title: string; label: string; collection: string; href: string; hero?: boolean };

type Options = {
  items: TunnelItem[];
  reducedMotion: boolean;
  getProgress: () => number;
  onIndex?: (index: number) => void;
  onReady: () => void;
};

const vert = /* glsl */ `
  uniform float uBend;
  varying vec2 vUv;
  varying float vDepth;
  void main() {
    vUv = uv;
    vec3 p = position;
    p.z += sin(uv.x * 3.14159) * uBend;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const frag = /* glsl */ `
  precision highp float;
  uniform sampler2D tMap;
  uniform float uPlaneAspect;
  uniform float uImgAspect;
  uniform float uShift;
  uniform float uArch;
  uniform float uFar;
  uniform vec3 uBg;
  uniform vec3 uLine;
  varying vec2 vUv;
  varying float vDepth;

  vec2 cover(vec2 uv) {
    vec2 s = vec2(1.0);
    if (uPlaneAspect < uImgAspect) s.x = uPlaneAspect / uImgAspect; else s.y = uImgAspect / uPlaneAspect;
    return (uv - 0.5) * s + 0.5;
  }

  void main() {
    vec2 uv = vUv;
    // shape: arch (rounded top) or soft rectangle
    vec2 q = vec2((uv.x - 0.5) * uPlaneAspect, uv.y);
    float d;
    if (uArch > 0.5) {
      float r = 0.5 * uPlaneAspect;
      float cy = 1.0 - r;
      d = uv.y > cy ? length(q - vec2(0.0, cy)) - r : abs(q.x) - r;
    } else {
      vec2 h = vec2(0.5 * uPlaneAspect, 0.5) - 0.02;
      vec2 e = abs(q - vec2(0.0, 0.5)) - h;
      d = length(max(e, 0.0)) + min(max(e.x, e.y), 0.0) - 0.02;
    }
    float aa = fwidth(d) * 1.2;
    float mask = 1.0 - smoothstep(-aa, aa, d);
    if (mask < 0.01) discard;

    vec2 c = cover(uv);
    vec3 col;
    col.r = texture2D(tMap, c + vec2(uShift, 0.0)).r;
    col.g = texture2D(tMap, c).g;
    col.b = texture2D(tMap, c - vec2(uShift, 0.0)).b;

    float frame = 1.0 - smoothstep(0.0, aa * 1.5, abs(d + 0.01));
    col = mix(col, uLine, frame * 0.35);

    // depth: emerge from darkness far away, dissolve when passing the camera
    float far = smoothstep(uFar, uFar * 0.35, vDepth);
    float near = smoothstep(0.35, 1.6, vDepth);
    col = mix(uBg, col, far);
    gl_FragColor = vec4(col, mask * near);
    #include <colorspace_fragment>
  }
`;

const GOLDEN = Math.PI * (3 - Math.sqrt(5));

export function createTunnel(canvas: HTMLCanvasElement, opts: Options) {
  const { items } = opts;
  const mobile = window.matchMedia("(max-width: 767px)").matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.75 : 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const bg = new THREE.Color("#111111");
  const line = new THREE.Color("#d8c7a8");
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(bg, 4, mobile ? 16 : 20);
  const camera = new THREE.PerspectiveCamera(mobile ? 62 : 52, 1, 0.05, 80);

  const GAP = mobile ? 1.55 : 1.7;
  const START = mobile ? 5 : 6;
  const LENGTH = items.length * GAP + 4;
  const FAR = mobile ? 15 : 19;

  /* ── image panels ── */
  const loader = new THREE.TextureLoader();
  let loaded = 0;
  const geo = new THREE.PlaneGeometry(1, 1, 24, 1);
  type Panel = { mesh: THREE.Mesh; u: Record<string, THREE.IUniform>; z: number; base: THREE.Vector3; seed: number };
  const panels: Panel[] = items.map((it, i) => {
    const hero = !!it.hero;
    const h = hero ? (mobile ? 1.7 : 2.05) : mobile ? 1.05 : 1.3;
    const u: Record<string, THREE.IUniform> = {
      tMap: { value: null },
      uPlaneAspect: { value: 0.7 },
      uImgAspect: { value: 0.7 },
      uShift: { value: 0 },
      uBend: { value: 0 },
      uArch: { value: hero ? 1 : 0 },
      uFar: { value: FAR },
      uBg: { value: bg },
      uLine: { value: line },
    };
    const mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: u, vertexShader: vert, fragmentShader: frag, transparent: true, depthWrite: false }));
    u.tMap.value = loader.load(
      it.src,
      (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        const img = t.image as HTMLImageElement;
        const a = img.width / img.height;
        u.uImgAspect.value = a;
        const pa = hero ? Math.min(0.72, a) : THREE.MathUtils.clamp(a, 0.68, 1.45);
        u.uPlaneAspect.value = pa;
        mesh.scale.set(h * pa, h, 1);
        if (++loaded === items.length) opts.onReady();
      },
      undefined,
      () => {
        if (++loaded === items.length) opts.onReady();
      },
    );
    mesh.scale.set(h * 0.7, h, 1);

    // placement: heroes near the path, details spiral around the walls
    const z = -START - i * GAP;
    let x: number, y: number;
    if (hero) {
      const side = i % 2 === 0 ? 1 : -1;
      x = side * (mobile ? 0.62 : 1.05);
      y = 0.05;
    } else {
      const ang = i * GOLDEN * 2.3;
      const rx = mobile ? 1.55 : 2.6;
      const ry = mobile ? 1.9 : 1.5;
      x = Math.cos(ang) * rx;
      y = Math.sin(ang) * ry;
      if (Math.abs(x) < (mobile ? 0.9 : 1.4)) x = Math.sign(x || 1) * (mobile ? 1.0 : 1.5);
    }
    const base = new THREE.Vector3(x, y, z);
    mesh.position.copy(base);
    // turn slightly toward the path so they read as the tunnel walls
    mesh.rotation.y = -x * (hero ? 0.12 : 0.22);
    mesh.rotation.x = y * 0.08;
    scene.add(mesh);
    return { mesh, u, z, base, seed: Math.random() * Math.PI * 2 };
  });

  /* ── arch portals along the path ── */
  const archGroup = new THREE.Group();
  const archShape = (w: number, h: number) => {
    const p = new THREE.Path();
    const r = w / 2;
    p.moveTo(-r, -h / 2);
    p.lineTo(-r, h / 2 - r);
    p.absarc(0, h / 2 - r, r, Math.PI, 0, true);
    p.lineTo(r, -h / 2);
    return p.getSpacedPoints(160).map((v) => new THREE.Vector3(v.x, v.y, 0));
  };
  const aw = mobile ? 3.0 : 5.2, ah = mobile ? 5.6 : 4.8;
  const archGeoA = new THREE.BufferGeometry().setFromPoints(archShape(aw, ah));
  const archGeoB = new THREE.BufferGeometry().setFromPoints(archShape(aw * 0.94, ah * 0.96));
  const archMat = new THREE.LineBasicMaterial({ color: line, transparent: true, opacity: 0.42, fog: true });
  const archMat2 = new THREE.LineBasicMaterial({ color: line, transparent: true, opacity: 0.16, fog: true });
  for (let z = -START + 1.2; z > -START - LENGTH; z -= GAP * 4) {
    const a = new THREE.Line(archGeoA, archMat);
    const b = new THREE.Line(archGeoB, archMat2);
    a.position.set(0, 0.25, z);
    b.position.set(0, 0.25 - ah * 0.02, z - 0.06);
    archGroup.add(a, b);
  }
  scene.add(archGroup);

  // floor guide lines (perspective rails)
  const railMat = new THREE.LineBasicMaterial({ color: line, transparent: true, opacity: 0.12, fog: true });
  for (const x of [-aw / 2, aw / 2]) {
    const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, -ah / 2 + 0.25, 4), new THREE.Vector3(x, -ah / 2 + 0.25, -START - LENGTH)]);
    scene.add(new THREE.Line(g, railMat));
  }

  /* ── dust ── */
  const COUNT = mobile ? 500 : 1100;
  const pos = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 7;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 5;
    pos[i * 3 + 2] = 4 - Math.random() * (LENGTH + START + 4);
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: line, size: 0.014, transparent: true, opacity: 0.55, sizeAttenuation: true, fog: true, depthWrite: false }));
  scene.add(dust);

  /* ── input ── */
  const st = { p: 0, prevZ: 0, px: 0, py: 0, tx: 0, ty: 0, index: -1 };
  const onMove = (e: PointerEvent) => {
    st.tx = (e.clientX / window.innerWidth) * 2 - 1;
    st.ty = (e.clientY / window.innerHeight) * 2 - 1;
  };
  window.addEventListener("pointermove", onMove, { passive: true });

  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  let visible = true, raf = 0;
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) loop();
  });
  io.observe(canvas);
  const timer = new THREE.Timer();

  function frame() {
    timer.update();
    const t = timer.getElapsed();
    const target = THREE.MathUtils.clamp(opts.getProgress(), 0, 1);
    st.p = target; // smoothing is done by the scroll controller

    // idle drift so the scene breathes even before scrolling
    const drift = opts.reducedMotion ? 0 : (Math.sin(t * 0.3) * 0.5 + 0.5) * 0.25 * (1 - st.p);
    const camZ = 2.2 - st.p * (LENGTH + 0.5) - drift;
    const vel = camZ - st.prevZ;
    st.prevZ = camZ;

    st.px += (st.tx - st.px) * 0.05;
    st.py += (st.ty - st.py) * 0.05;
    const sway = opts.reducedMotion ? 0 : 1;
    camera.position.set(Math.sin(camZ * 0.18) * 0.35 * sway + st.px * 0.3, 0.12 + Math.cos(camZ * 0.13) * 0.15 * sway - st.py * 0.18, camZ);
    camera.lookAt(st.px * 0.6, 0.05 - st.py * 0.3, camZ - 6);
    camera.rotation.z = Math.sin(camZ * 0.09) * 0.03 * sway - st.px * 0.02;

    const bend = THREE.MathUtils.clamp(-vel * 2.5, -0.35, 0.35);
    const shift = THREE.MathUtils.clamp(Math.abs(vel) * 0.03, 0, 0.006);
    let nearest = 0, best = Infinity;
    panels.forEach((p, i) => {
      p.u.uBend.value = bend;
      p.u.uShift.value = shift;
      if (!opts.reducedMotion) p.mesh.position.y = p.base.y + Math.sin(t * 0.6 + p.seed) * 0.04;
      const d = p.z - (camZ - 3.2);
      if (items[i].hero && Math.abs(d) < best) {
        best = Math.abs(d);
        nearest = i;
      }
    });
    if (nearest !== st.index) {
      st.index = nearest;
      opts.onIndex?.(nearest);
    }

    renderer.render(scene, camera);
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
    dispose() {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pointermove", onMove);
      panels.forEach((p) => {
        (p.u.tMap.value as THREE.Texture | null)?.dispose();
        (p.mesh.material as THREE.Material).dispose();
      });
      geo.dispose();
      archGeoA.dispose();
      archGeoB.dispose();
      archMat.dispose();
      archMat2.dispose();
      railMat.dispose();
      dustGeo.dispose();
      (dust.material as THREE.Material).dispose();
      renderer.dispose();
    },
  };
}

export type Tunnel = ReturnType<typeof createTunnel>;
