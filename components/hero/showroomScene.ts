/**
 * DAMI — WebGL showroom (hero).
 *
 * A slow carousel of arch-framed panels showing the supplied concept imagery.
 * Custom shaders: cover-fit + arch mask, noise-dissolve from front to back view
 * on hover, velocity bend while dragging, floor reflection, depth dimming.
 * Unlit and texture-only, so it stays light enough for phones.
 */
import * as THREE from "three";

export type ShowroomItem = { front: string; back: string; title: string; label: string; code: string; href: string };

type Options = {
  items: ShowroomItem[];
  reducedMotion: boolean;
  onActive: (index: number) => void;
  onNavigate: (href: string) => void;
  onReady: () => void;
};

const vert = /* glsl */ `
  uniform float uBend;
  uniform float uTime;
  uniform float uHover;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 p = position;
    // gentle constant curvature + velocity bend
    float cx = uv.x - 0.5;
    p.z += -cx * cx * 0.35 + sin(uv.x * 3.14159) * uBend;
    p.z += sin(uv.y * 3.14159) * uHover * 0.08;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const frag = /* glsl */ `
  precision highp float;
  uniform sampler2D tFront;
  uniform sampler2D tBack;
  uniform float uMix;
  uniform float uDim;
  uniform float uPlaneAspect;
  uniform float uImgAspect;
  uniform float uTime;
  uniform float uReflect;
  uniform float uOpacity;
  uniform vec3 uLine;
  uniform vec3 uBg;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; } return v; }

  vec2 cover(vec2 uv) {
    vec2 s = vec2(1.0);
    if (uPlaneAspect < uImgAspect) s.x = uPlaneAspect / uImgAspect; else s.y = uImgAspect / uPlaneAspect;
    // bias framing towards the top (heads/hoods)
    return vec2((uv.x - 0.5) * s.x + 0.5, (uv.y - 0.5) * s.y + 0.5 + (1.0 - s.y) * 0.35);
  }

  void main() {
    vec2 uv = vUv;
    // arch mask: rectangle with a semicircular top
    float r = 0.5 * uPlaneAspect;            // radius in "height" units
    vec2 q = vec2((uv.x - 0.5) * uPlaneAspect, uv.y);
    float cy = 1.0 - r;
    float d = uv.y > cy ? length(q - vec2(0.0, cy)) - r : abs(q.x) - r;
    float aa = fwidth(d) * 1.2;
    float mask = 1.0 - smoothstep(-aa, aa, d);
    if (mask < 0.01) discard;

    // dissolve front -> back
    float n = fbm(uv * vec2(3.0, 5.0) + uTime * 0.05);
    float edge = smoothstep(uMix - 0.08, uMix + 0.08, n * 0.9 + uv.y * 0.1 + 0.02);
    vec2 cuv = cover(uv);
    vec2 warp = vec2(0.0, (1.0 - abs(edge * 2.0 - 1.0)) * 0.02);
    vec3 a = texture2D(tFront, cuv + warp).rgb;
    vec3 b = texture2D(tBack, cuv - warp).rgb;
    vec3 col = mix(a, b, edge);
    // champagne glow on the dissolve seam
    float seam = (1.0 - abs(edge * 2.0 - 1.0));
    col += uLine * pow(seam, 6.0) * 0.6 * step(0.001, uMix) * step(uMix, 0.999);

    // inner hairline frame
    float frame = 1.0 - smoothstep(0.0, aa * 1.5, abs(d + 0.012));
    col = mix(col, uLine, frame * 0.55);

    // vignette + depth dim
    float vig = smoothstep(1.2, 0.2, length((uv - vec2(0.5, 0.45)) * vec2(1.0, 0.8)));
    col *= mix(0.78, 1.0, vig);
    col = mix(uBg, col, uDim);

    float alpha = mask * uOpacity;
    if (uReflect > 0.5) {
      // reflection: fade out quickly away from the floor line
      alpha *= (1.0 - smoothstep(0.0, 0.4, uv.y)) * 0.2;
      col = mix(uBg, col, 0.7);
    }
    gl_FragColor = vec4(col, alpha);
    #include <colorspace_fragment>
  }
`;

export function createShowroom(canvas: HTMLCanvasElement, opts: Options) {
  const { items } = opts;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  const ring = new THREE.Group();
  scene.add(ring);

  const N = items.length;
  const STEP = (Math.PI * 2) / N;
  const R = Math.max(3.6, N * 0.62);
  const H = 3.0;
  const W = 2.08;
  const FLOOR = -H / 2 - 0.04;

  const loader = new THREE.TextureLoader();
  const bg = new THREE.Color("#111111");
  const line = new THREE.Color("#d8c7a8");
  let loaded = 0;
  const total = N * 2;
  const tex = (src: string, onAspect?: (a: number) => void) =>
    loader.load(src, (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      const img = t.image as HTMLImageElement;
      onAspect?.(img.width / img.height);
      loaded++;
      if (loaded === total) opts.onReady();
    }, undefined, () => {
      loaded++;
      if (loaded === total) opts.onReady();
    });

  const geo = new THREE.PlaneGeometry(W, H, 48, 24);
  type Panel = { mesh: THREE.Mesh; refl: THREE.Mesh; u: Record<string, THREE.IUniform>; hover: number; target: number };
  const panels: Panel[] = items.map((it, i) => {
    const u: Record<string, THREE.IUniform> = {
      tFront: { value: null },
      tBack: { value: null },
      uMix: { value: 1 },
      uDim: { value: 1 },
      uPlaneAspect: { value: W / H },
      uImgAspect: { value: 0.7 },
      uTime: { value: 0 },
      uBend: { value: 0 },
      uHover: { value: 0 },
      uReflect: { value: 0 },
      uOpacity: { value: 1 },
      uLine: { value: line },
      uBg: { value: bg },
    };
    u.tFront.value = tex(it.front, (a) => (u.uImgAspect.value = a));
    u.tBack.value = tex(it.back);
    const mat = new THREE.ShaderMaterial({ uniforms: u, vertexShader: vert, fragmentShader: frag, transparent: true });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData.index = i;
    const ru = { ...u, uReflect: { value: 1 } };
    const rmat = new THREE.ShaderMaterial({ uniforms: ru, vertexShader: vert, fragmentShader: frag, transparent: true, depthWrite: false });
    const refl = new THREE.Mesh(geo, rmat);
    refl.scale.y = -1;
    refl.renderOrder = -1;
    const holder = new THREE.Group();
    holder.add(mesh, refl);
    mesh.position.y = 0;
    refl.position.y = FLOOR * 2;
    ring.add(holder);
    return { mesh, refl, u, hover: 0, target: 0 };
  });

  // floor hairline
  const floorLine = new THREE.Mesh(
    new THREE.RingGeometry(R + 0.9, R + 0.905, 256),
    new THREE.MeshBasicMaterial({ color: line, transparent: true, opacity: 0.18, side: THREE.DoubleSide }),
  );
  floorLine.rotation.x = -Math.PI / 2;
  floorLine.position.set(0, FLOOR, -R);
  scene.add(floorLine);

  /* ── state ── */
  const st = {
    rot: 0, // continuous index position (0 = item 0 in front)
    target: 0,
    vel: 0,
    dragging: false,
    lastX: 0,
    downX: 0,
    downT: 0,
    moved: 0,
    px: 0,
    py: 0,
    hovered: -1,
    active: 0,
    lastInteract: performance.now(),
    dist: 9,
  };

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const pick = (cx: number, cy: number) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(panels.map((p) => p.mesh))[0];
    return hit ? (hit.object.userData.index as number) : -1;
  };

  const onDown = (e: PointerEvent) => {
    st.dragging = true;
    st.lastX = st.downX = e.clientX;
    st.downT = performance.now();
    st.moved = 0;
    st.lastInteract = performance.now();
  };
  const onMove = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    st.px = ((e.clientX - r.left) / r.width) * 2 - 1;
    st.py = ((e.clientY - r.top) / r.height) * 2 - 1;
    if (st.dragging) {
      const dx = e.clientX - st.lastX;
      st.lastX = e.clientX;
      st.moved += Math.abs(dx);
      const k = -dx / Math.max(240, r.width * 0.32);
      st.rot += k;
      st.target = st.rot;
      st.vel = k;
      st.lastInteract = performance.now();
    } else if (e.pointerType === "mouse") {
      st.hovered = pick(e.clientX, e.clientY);
      canvas.style.cursor = st.hovered >= 0 ? "pointer" : "grab";
    }
  };
  const onUp = (e: PointerEvent) => {
    if (!st.dragging) return;
    st.dragging = false;
    // momentum then snap
    st.target = Math.round(st.rot + st.vel * 8);
    st.lastInteract = performance.now();
    if (st.moved < 6 && performance.now() - st.downT < 400) {
      const i = pick(e.clientX, e.clientY);
      if (i >= 0) {
        const front = ((Math.round(st.rot) % N) + N) % N;
        if (i === front) opts.onNavigate(items[i].href);
        else goTo(i);
      }
    }
  };
  const onLeave = () => (st.hovered = -1);
  canvas.addEventListener("pointerdown", onDown);
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
  canvas.addEventListener("pointerleave", onLeave);

  function goTo(i: number) {
    const cur = Math.round(st.target);
    const curIdx = ((cur % N) + N) % N;
    let d = i - curIdx;
    if (d > N / 2) d -= N;
    if (d < -N / 2) d += N;
    st.target = cur + d;
    st.lastInteract = performance.now();
  }

  /* ── sizing ── */
  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const fitH = (H * 1.55) / (2 * t);
    const fitW = (W * (camera.aspect < 0.9 ? 2.5 : 1.9)) / (2 * t * camera.aspect);
    st.dist = Math.max(fitH, fitW);
    if (w >= 1024) camera.setViewOffset(w, h, -w * 0.12, h * 0.03, w, h);
    else if (w / h < 0.9) camera.setViewOffset(w, h, 0, h * 0.13, w, h);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  /* ── loop ── */
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

    // auto-advance when idle
    if (!opts.reducedMotion && !st.dragging && st.hovered < 0 && performance.now() - st.lastInteract > 5200) {
      st.target = Math.round(st.target) + 1;
      st.lastInteract = performance.now();
    }
    if (!st.dragging) {
      const prev = st.rot;
      st.rot += (st.target - st.rot) * (opts.reducedMotion ? 0.3 : 0.065);
      st.vel = st.rot - prev;
    }

    const activeIdx = ((Math.round(st.rot) % N) + N) % N;
    if (activeIdx !== st.active) {
      st.active = activeIdx;
      opts.onActive(activeIdx);
    }

    const bend = THREE.MathUtils.clamp(st.vel * 6, -0.5, 0.5);
    panels.forEach((p, i) => {
      const a = (i - st.rot) * STEP;
      const holder = p.mesh.parent!;
      holder.position.set(Math.sin(a) * R, 0, Math.cos(a) * R - R);
      holder.rotation.y = a;
      const facing = Math.cos(a);
      const isFront = i === activeIdx;
      // hover (or touch-hold on front) reveals the back view
      p.target = st.hovered === i ? 1 : 0;
      p.hover += (p.target - p.hover) * 0.06;
      const lift = isFront ? 1 : 0;
      p.mesh.position.y += ((lift * 0.06) - p.mesh.position.y) * 0.08;
      p.u.uMix.value = 1 - p.hover;
      p.u.uHover.value = p.hover;
      p.u.uBend.value = bend;
      p.u.uTime.value = t;
      p.u.uDim.value = THREE.MathUtils.clamp(0.12 + 0.88 * THREE.MathUtils.smoothstep(facing, -0.2, 1), 0, 1) * (isFront ? 1 : 0.5);
      (p.refl.material as THREE.ShaderMaterial).uniforms.uDim.value = p.u.uDim.value;
      (p.refl.material as THREE.ShaderMaterial).uniforms.uMix.value = p.u.uMix.value;
      p.mesh.renderOrder = Math.round(facing * 100);
    });

    // camera: slow breathing + pointer parallax
    const px = opts.reducedMotion ? 0 : st.px;
    const py = opts.reducedMotion ? 0 : st.py;
    const breathe = opts.reducedMotion ? 0 : Math.sin(t * 0.25) * 0.08;
    camera.position.set(px * 0.35, 0.25 - py * 0.15 + breathe, st.dist);
    camera.lookAt(px * 0.08, 0.05, -R * 0.25);

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
    next: () => goTo((((Math.round(st.target) % N) + N) % N + 1) % N),
    prev: () => goTo((((Math.round(st.target) % N) + N) % N - 1 + N) % N),
    goTo,
    dispose() {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      panels.forEach((p) => {
        (p.u.tFront.value as THREE.Texture | null)?.dispose();
        (p.u.tBack.value as THREE.Texture | null)?.dispose();
        (p.mesh.material as THREE.Material).dispose();
        (p.refl.material as THREE.Material).dispose();
      });
      geo.dispose();
      floorLine.geometry.dispose();
      (floorLine.material as THREE.Material).dispose();
      renderer.dispose();
    },
  };
}

export type Showroom = ReturnType<typeof createShowroom>;
