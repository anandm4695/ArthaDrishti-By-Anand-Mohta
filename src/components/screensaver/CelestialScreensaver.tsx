import React, { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

interface CelestialScreensaverProps {
  onClose: () => void;
  autoCloseOnActivity?: boolean;
  /** Pointer movement is ignored for this long after mount (keys always wake after a short debounce). */
  pointerGraceMs?: number;
}

// "Artha Galaxy" — your wealth as a living spiral galaxy. Each arm is an asset class,
// the golden ArthaDrishti coin is the galactic core, and ₹ coins rise through the scene.
const ARMS = [
  { name: "Equities", rgb: [56, 189, 248] },
  { name: "Real Estate", rgb: [251, 146, 60] },
  { name: "Gold", rgb: [250, 204, 21] },
  { name: "EPF & PPF", rgb: [52, 211, 153] },
  { name: "Liquid Cash", rgb: [192, 132, 252] },
] as const;
const CORE_RGB = [255, 236, 179];
const DUST_RGB = [148, 163, 255];

const TAU = Math.PI * 2;
const INTRO_MS = 1800;
const KEY_DEBOUNCE_MS = 200;
const MOVE_THRESHOLD_PX = 6;
const FADE_OUT_MS = 220;

const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3);

const makeSprite = (rgb: readonly number[], size = 64, hotCore = true) => {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d") as CanvasRenderingContext2D;
  const h = size / 2;
  const grad = g.createRadialGradient(h, h, 0, h, h, h);
  const [r, gr, b] = rgb;
  if (hotCore) grad.addColorStop(0, "rgba(255,255,255,1)");
  else grad.addColorStop(0, `rgba(${r},${gr},${b},0.55)`);
  grad.addColorStop(0.18, `rgba(${r},${gr},${b},${hotCore ? 0.9 : 0.35})`);
  grad.addColorStop(0.45, `rgba(${r},${gr},${b},${hotCore ? 0.25 : 0.12})`);
  grad.addColorStop(1, `rgba(${r},${gr},${b},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return c;
};

export const CelestialScreensaver: React.FC<CelestialScreensaverProps> = ({
  onClose,
  autoCloseOnActivity = true,
  pointerGraceMs = 600,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isClosingRef = useRef(false);
  const [isClosing, setIsClosing] = useState(false);
  const [now, setNow] = useState(() => new Date());
  // Phones/tablets have no mouse or keyboard to "move" or "press" — word the hint for touch.
  const [isTouch] = useState(
    () => typeof window !== "undefined" && !!window.matchMedia?.("(hover: none)").matches
  );
  const wakeAction = isTouch ? "Tap anywhere" : "Move the mouse or press any key";
  const wakeHint = isTouch ? `${wakeAction} to return` : wakeAction;

  const handleWakeUp = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    setIsClosing(true);
    setTimeout(onClose, FADE_OUT_MS);
  }, [onClose]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Pull focus out of inputs / iframes (e.g. Turnstile) so every keystroke reaches us.
  useEffect(() => {
    const active = document.activeElement as HTMLElement | null;
    active?.blur?.();
    containerRef.current?.focus({ preventScroll: true });
  }, []);

  // Wake on any key press, pointer movement, click, touch or scroll.
  useEffect(() => {
    if (!autoCloseOnActivity) return;

    const mountTime = performance.now();
    let origin: { x: number; y: number } | null = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Swallow the key so it never types into the form or fires app shortcuts underneath.
      e.stopPropagation();
      if (!e.metaKey && !e.ctrlKey) e.preventDefault();
      if (performance.now() - mountTime < KEY_DEBOUNCE_MS) return;
      handleWakeUp();
    };

    const handlePointerMove = (e: PointerEvent | MouseEvent) => {
      if (performance.now() - mountTime < pointerGraceMs) {
        origin = { x: e.clientX, y: e.clientY };
        return;
      }
      if (!origin) {
        origin = { x: e.clientX, y: e.clientY };
        // movementX/Y lets the very first event after the grace window count.
        if (Math.hypot(e.movementX || 0, e.movementY || 0) < MOVE_THRESHOLD_PX) return;
      } else if (Math.hypot(e.clientX - origin.x, e.clientY - origin.y) < MOVE_THRESHOLD_PX) {
        return;
      }
      handleWakeUp();
    };

    const handleDiscrete = (e: Event) => {
      e.stopPropagation();
      if (performance.now() - mountTime < KEY_DEBOUNCE_MS) return;
      handleWakeUp();
    };

    const opts = { capture: true } as const;
    window.addEventListener("keydown", handleKeyDown, opts);
    window.addEventListener("pointermove", handlePointerMove, opts);
    window.addEventListener("mousemove", handlePointerMove, opts);
    window.addEventListener("pointerdown", handleDiscrete, opts);
    window.addEventListener("touchstart", handleDiscrete, opts);
    window.addEventListener("wheel", handleDiscrete, opts);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, opts);
      window.removeEventListener("pointermove", handlePointerMove, opts);
      window.removeEventListener("mousemove", handlePointerMove, opts);
      window.removeEventListener("pointerdown", handleDiscrete, opts);
      window.removeEventListener("touchstart", handleDiscrete, opts);
      window.removeEventListener("wheel", handleDiscrete, opts);
    };
  }, [autoCloseOnActivity, handleWakeUp, pointerGraceMs]);

  // 3D render engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const motion = reduced ? 0.35 : 1;

    let width = 0;
    let height = 0;
    let focal = 0;
    let bgGrad: CanvasGradient | null = null;
    let vignette: CanvasGradient | null = null;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      focal = Math.min(width, height) * 0.9;
      const maxDim = Math.max(width, height);
      bgGrad = ctx.createRadialGradient(
        width / 2,
        height * 0.45,
        0,
        width / 2,
        height / 2,
        maxDim * 0.8
      );
      bgGrad.addColorStop(0, "#0b1030");
      bgGrad.addColorStop(0.45, "#050818");
      bgGrad.addColorStop(1, "#010107");
      vignette = ctx.createRadialGradient(
        width / 2,
        height / 2,
        maxDim * 0.25,
        width / 2,
        height / 2,
        maxDim * 0.75
      );
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(1, "rgba(0,0,0,0.7)");
    };
    resize();
    window.addEventListener("resize", resize);

    const logoImg = new Image();
    logoImg.src = "/logo.png";
    let logoLoaded = false;
    logoImg.onload = () => {
      logoLoaded = true;
    };

    // Sprites: 0-4 arms, 5 core, 6 dust, 7 white star, 8 gold glow
    const sprites = [
      ...ARMS.map((a) => makeSprite(a.rgb)),
      makeSprite(CORE_RGB),
      makeSprite(DUST_RGB),
      makeSprite([255, 255, 255]),
      makeSprite([245, 158, 11], 128),
    ];
    const nebulae = [
      { rgb: [99, 102, 241], x: -2200, y: -600, z: -1800, size: 3200 },
      { rgb: [236, 72, 153], x: 2400, y: 400, z: -1200, size: 2600 },
      { rgb: [20, 184, 166], x: -1400, y: 900, z: 2000, size: 2800 },
      { rgb: [245, 158, 11], x: 1800, y: -900, z: 1900, size: 2400 },
    ].map((n) => ({ ...n, sprite: makeSprite(n.rgb, 128, false) }));

    // Camera state + projection (writes into P to avoid per-point allocations)
    let yaw = 0;
    let pitch = 1;
    let camDist = 1150;
    let cyaw = 1,
      syaw = 0,
      cpit = 1,
      spit = 0;
    const P = { x: 0, y: 0, s: 0, z: 0 };
    const project = (x: number, y: number, z: number) => {
      const x1 = x * cyaw - z * syaw;
      const z1 = x * syaw + z * cyaw;
      const y2 = y * cpit - z1 * spit;
      const z2 = y * spit + z1 * cpit;
      const zc = z2 + camDist;
      if (zc < 20) return false;
      const s = focal / zc;
      P.x = width / 2 + x1 * s;
      P.y = height / 2 + y2 * s;
      P.s = s;
      P.z = z2;
      return true;
    };

    // Spiral galaxy
    const N = reduced ? 1400 : 2600;
    const gR = new Float32Array(N);
    const gA = new Float32Array(N);
    const gY = new Float32Array(N);
    const gW = new Float32Array(N);
    const gS = new Float32Array(N);
    const gC = new Uint8Array(N);
    for (let i = 0; i < N; i++) {
      const arm = i % ARMS.length;
      const t = Math.pow(Math.random(), 1.5);
      const r = 18 + t * 620;
      gR[i] = r;
      gY[i] = gauss() * (44 * (1 - t) + 8);
      gW[i] = 0.00011 * Math.sqrt(260 / (r + 60));
      gS[i] = (Math.random() * 1.5 + 0.6) * (t < 0.15 ? 1.3 : 1);
      if (Math.random() < 0.16) {
        gA[i] = Math.random() * TAU;
        gC[i] = 6;
        gS[i] *= 0.7;
      } else {
        gA[i] = (arm * TAU) / ARMS.length + r * 0.0068 + gauss() * (0.5 - t * 0.28);
        gC[i] = r < 110 && Math.random() < 0.7 ? 5 : arm;
      }
    }
    const pX = new Float32Array(N);
    const pY = new Float32Array(N);
    const pS = new Float32Array(N);
    const pZ = new Float32Array(N);
    const pOk = new Uint8Array(N);

    // Distant star sphere
    const STARS = reduced ? 400 : 700;
    const stars = Array.from({ length: STARS }, () => {
      const u = Math.random() * 2 - 1;
      const th = Math.random() * TAU;
      const rr = 2600 + Math.random() * 1600;
      const k = Math.sqrt(1 - u * u);
      return {
        x: Math.cos(th) * k * rr,
        y: u * rr,
        z: Math.sin(th) * k * rr,
        a: Math.random() * 0.6 + 0.25,
        tw: Math.random() * 0.003 + 0.0006,
        ph: Math.random() * TAU,
        big: Math.random() < 0.08,
      };
    });

    // Warp-speed intro tunnel (camera space)
    const warp = Array.from({ length: reduced ? 0 : 360 }, () => ({
      x: (Math.random() - 0.5) * 2,
      y: (Math.random() - 0.5) * 2,
      z: Math.random(),
    }));

    // Aurora ribbons orbiting the galaxy
    const RIBBONS = [
      {
        r: 760,
        amp: 110,
        freq: 2,
        phase: 0,
        speed: 0.00035,
        c1: [250, 204, 21],
        c2: [56, 189, 248],
      },
      {
        r: 860,
        amp: 80,
        freq: 3,
        phase: 1.7,
        speed: -0.00025,
        c1: [192, 132, 252],
        c2: [52, 211, 153],
      },
    ];
    const RIB_SEGS = 140;
    const ribTop = new Float32Array((RIB_SEGS + 1) * 2);
    const ribBot = new Float32Array((RIB_SEGS + 1) * 2);
    const ribOk = new Uint8Array(RIB_SEGS + 1);
    const ribZ = new Float32Array(RIB_SEGS + 1);

    // Rising ₹ coins
    const spawnCoin = (y: number) => ({
      x: (Math.random() - 0.5) * 1500,
      z: (Math.random() - 0.5) * 1500,
      y,
      v: 0.03 + Math.random() * 0.04,
      spin: Math.random() * TAU,
      spinV: 0.0015 + Math.random() * 0.002,
      size: 10 + Math.random() * 9,
    });
    const coins = Array.from({ length: reduced ? 8 : 16 }, () =>
      spawnCoin(Math.random() * 1200 - 600)
    );

    const shooting: { x: number; y: number; vx: number; vy: number; life: number }[] = [];

    const drawMiniCoin = (x: number, y: number, R: number, phi: number, alpha: number) => {
      const c = Math.cos(phi);
      const rx = Math.max(0.6, Math.abs(c) * R);
      const edge = Math.sin(phi) * R * 0.2;
      ctx.globalAlpha = alpha * 0.5;
      const glow = R * 5;
      ctx.globalCompositeOperation = "lighter";
      ctx.drawImage(sprites[8], x - glow / 2, y - glow / 2, glow, glow);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "#92400E";
      ctx.beginPath();
      ctx.ellipse(x + edge, y, rx, R, 0, 0, TAU);
      ctx.fill();
      const g = ctx.createLinearGradient(x - rx, y - R, x + rx, y + R);
      g.addColorStop(0, "#FEF3C7");
      g.addColorStop(0.45, "#F59E0B");
      g.addColorStop(1, "#B45309");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, R, 0, 0, TAU);
      ctx.fill();
      if (Math.abs(c) > 0.3) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(c, 1);
        ctx.fillStyle = "rgba(120, 53, 15, 0.85)";
        ctx.font = `700 ${Math.round(R * 1.25)}px system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("₹", 0, R * 0.06);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    };

    const drawCoreCoin = (cx: number, cy: number, R: number, t: number) => {
      const phi = t * 0.0007 * motion;
      const c = Math.cos(phi);
      const s = Math.sin(phi);
      const front = c >= 0;
      const T = R * 0.18;
      const faceOff = (front ? 1 : -1) * s * (T / 2);
      const rx = Math.max(1, Math.abs(c) * R);

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(Math.sin(t * 0.0004) * 0.12);

      // Milled rim: stack slices from the hidden face to the visible face
      const SLICES = 10;
      for (let k = 0; k <= SLICES; k++) {
        const f = k / SLICES;
        const off = -faceOff + f * 2 * faceOff;
        const shade = 0.45 + f * 0.4;
        ctx.fillStyle = `rgb(${Math.round(217 * shade)}, ${Math.round(119 * shade)}, ${Math.round(6 * shade)})`;
        ctx.beginPath();
        ctx.ellipse(off, 0, rx, R, 0, 0, TAU);
        ctx.fill();
      }

      // Face
      ctx.translate(faceOff, 0);
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, R, 0, 0, TAU);
      const face = ctx.createRadialGradient(-rx * 0.3, -R * 0.3, 2, 0, 0, R);
      if (front) {
        face.addColorStop(0, "#FFFFFF");
        face.addColorStop(0.7, "#FFFDF5");
        face.addColorStop(0.86, "#FDE68A");
        face.addColorStop(0.95, "#F59E0B");
        face.addColorStop(1, "#B45309");
      } else {
        face.addColorStop(0, "#FEF3C7");
        face.addColorStop(0.6, "#FBBF24");
        face.addColorStop(1, "#B45309");
      }
      ctx.fillStyle = face;
      ctx.fill();

      ctx.save();
      ctx.clip();
      ctx.scale(Math.max(0.02, Math.abs(c)), 1);
      if (front && logoLoaded) {
        const d = R * 1.7;
        ctx.drawImage(logoImg, -d / 2, -d / 2, d, d);
      } else if (!front) {
        ctx.fillStyle = "#78350F";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `700 ${Math.round(R * 0.26)}px system-ui, sans-serif`;
        ctx.fillText("अर्थदृष्टि", 0, -R * 0.1);
        ctx.font = `800 ${Math.round(R * 0.11)}px system-ui, sans-serif`;
        ctx.fillStyle = "#92400E";
        ctx.fillText("WEALTH · SEEN · WHOLE", 0, R * 0.22);
      }
      // Sheen sweep
      const sx = Math.sin(t * 0.0013) * R * 2;
      const sheen = ctx.createLinearGradient(sx - R * 0.5, -R, sx + R * 0.5, R);
      sheen.addColorStop(0, "rgba(255,255,255,0)");
      sheen.addColorStop(0.5, "rgba(255,255,255,0.5)");
      sheen.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = sheen;
      ctx.fillRect(-R, -R, R * 2, R * 2);
      ctx.restore();

      ctx.strokeStyle = "rgba(255, 236, 179, 0.9)";
      ctx.lineWidth = Math.max(1, R * 0.03);
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, R, 0, 0, TAU);
      ctx.stroke();
      ctx.restore();
    };

    let animFrame = 0;
    let start = -1;
    let last = 0;

    const render = (ts: number) => {
      animFrame = requestAnimationFrame(render);
      if (start < 0) {
        start = ts;
        last = ts;
      }
      const t = ts - start;
      const dt = Math.min(50, ts - last) * motion;
      last = ts;

      const introP = reduced ? 1 : Math.min(1, t / INTRO_MS);
      const intro = easeOutCubic(introP);
      const galScale = 0.12 + 0.88 * intro;

      yaw = t * 0.00006 * motion + (1 - intro) * 1.4;
      pitch = 1.0 + Math.sin(t * 0.00009 * motion) * 0.22 + (1 - intro) * 0.35;
      camDist = 1150 + Math.sin(t * 0.00007 * motion) * 120;
      cyaw = Math.cos(yaw);
      syaw = Math.sin(yaw);
      cpit = Math.cos(pitch);
      spit = Math.sin(pitch);

      // Background
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.fillStyle = bgGrad as CanvasGradient;
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = "lighter";

      // Nebulae
      for (const n of nebulae) {
        if (!project(n.x, n.y, n.z)) continue;
        const sz = n.size * P.s;
        ctx.globalAlpha = 0.55 * intro;
        ctx.drawImage(n.sprite, P.x - sz / 2, P.y - sz / 2, sz, sz);
      }

      // Star sphere
      for (const st of stars) {
        if (!project(st.x, st.y, st.z)) continue;
        if (P.x < -4 || P.x > width + 4 || P.y < -4 || P.y > height + 4) continue;
        ctx.globalAlpha = st.a * (0.55 + 0.45 * Math.sin(t * st.tw + st.ph));
        if (st.big) {
          ctx.drawImage(sprites[7], P.x - 5, P.y - 5, 10, 10);
        } else {
          ctx.fillStyle = "#E2E8F0";
          ctx.fillRect(P.x, P.y, 1.2, 1.2);
        }
      }

      // Warp tunnel during intro
      if (introP < 1 && warp.length) {
        const speed = 0.0016 * (1 - intro) + 0.0001;
        ctx.strokeStyle = "#E0F2FE";
        ctx.lineWidth = 1.3;
        ctx.globalAlpha = 0.85 * (1 - intro);
        ctx.beginPath();
        const k = Math.max(width, height) * 0.5;
        for (const w of warp) {
          const z0 = w.z;
          w.z -= speed * dt * 4;
          if (w.z <= 0.02) {
            w.z = 1;
            w.x = (Math.random() - 0.5) * 2;
            w.y = (Math.random() - 0.5) * 2;
            continue;
          }
          ctx.moveTo(width / 2 + (w.x / z0) * k * 0.3, height / 2 + (w.y / z0) * k * 0.3);
          ctx.lineTo(width / 2 + (w.x / w.z) * k * 0.3, height / 2 + (w.y / w.z) * k * 0.3);
        }
        ctx.stroke();
      }

      // Aurora ribbons
      for (const rb of RIBBONS) {
        for (let i = 0; i <= RIB_SEGS; i++) {
          const th = (i / RIB_SEGS) * TAU;
          const R = (rb.r + 40 * Math.sin(th * 3 + t * 0.0003 * motion)) * galScale;
          const y = rb.amp * Math.sin(rb.freq * th + rb.phase + t * rb.speed * motion) * galScale;
          const w = (24 + 20 * Math.sin(th * 5 - t * 0.0006 * motion)) * galScale;
          const x = Math.cos(th) * R;
          const z = Math.sin(th) * R;
          let ok = project(x, y - w, z);
          ribTop[i * 2] = P.x;
          ribTop[i * 2 + 1] = P.y;
          ribZ[i] = P.z;
          ok = project(x, y + w, z) && ok;
          ribBot[i * 2] = P.x;
          ribBot[i * 2 + 1] = P.y;
          ribOk[i] = ok ? 1 : 0;
        }
        for (let i = 0; i < RIB_SEGS; i++) {
          if (!ribOk[i] || !ribOk[i + 1]) continue;
          const th = (i / RIB_SEGS) * TAU;
          const m = (Math.sin(th * 2 + t * 0.0002) + 1) / 2;
          const r = Math.round(rb.c1[0] + (rb.c2[0] - rb.c1[0]) * m);
          const g = Math.round(rb.c1[1] + (rb.c2[1] - rb.c1[1]) * m);
          const b = Math.round(rb.c1[2] + (rb.c2[2] - rb.c1[2]) * m);
          const depth = Math.max(0, Math.min(1, 0.5 - ribZ[i] / 1600));
          ctx.globalAlpha = (0.05 + 0.16 * depth) * intro;
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.beginPath();
          ctx.moveTo(ribTop[i * 2], ribTop[i * 2 + 1]);
          ctx.lineTo(ribTop[i * 2 + 2], ribTop[i * 2 + 3]);
          ctx.lineTo(ribBot[i * 2 + 2], ribBot[i * 2 + 3]);
          ctx.lineTo(ribBot[i * 2], ribBot[i * 2 + 1]);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Galaxy — project once, draw behind-core half first
      for (let i = 0; i < N; i++) {
        const a = gA[i] + gW[i] * t * motion;
        const r = gR[i] * galScale;
        if (project(Math.cos(a) * r, gY[i] * galScale, Math.sin(a) * r)) {
          pOk[i] = 1;
          pX[i] = P.x;
          pY[i] = P.y;
          pS[i] = P.s;
          pZ[i] = P.z;
        } else pOk[i] = 0;
      }
      const drawGalaxy = (frontHalf: boolean) => {
        for (let i = 0; i < N; i++) {
          if (!pOk[i] || pZ[i] < 0 !== frontHalf) continue;
          const sz = gS[i] * pS[i] * 7;
          ctx.globalAlpha = gC[i] === 6 ? 0.45 : 0.8;
          ctx.drawImage(sprites[gC[i]], pX[i] - sz / 2, pY[i] - sz / 2, sz, sz);
        }
      };
      drawGalaxy(false);

      // Galactic core: halo, god rays, anamorphic flare, coin
      project(0, 0, 0);
      const ccx = P.x;
      const ccy = P.y;
      const coinR = Math.max(36, 82 * P.s * galScale);
      const pulse = 0.85 + Math.sin(t * 0.0018) * 0.15;
      const halo = coinR * 7 * pulse;
      ctx.globalAlpha = 0.75;
      ctx.drawImage(sprites[8], ccx - halo / 2, ccy - halo / 2, halo, halo);
      ctx.drawImage(sprites[5], ccx - halo / 4, ccy - halo / 4, halo / 2, halo / 2);

      for (let i = 0; i < 12; i++) {
        const ang = (i / 12) * TAU + t * 0.00025 * motion;
        const len = coinR * (2.6 + Math.sin(t * 0.0016 + i * 1.7) * 0.6);
        const rg = ctx.createLinearGradient(
          ccx,
          ccy,
          ccx + Math.cos(ang) * len,
          ccy + Math.sin(ang) * len
        );
        rg.addColorStop(0, "rgba(253, 230, 138, 0.28)");
        rg.addColorStop(1, "rgba(253, 230, 138, 0)");
        ctx.globalAlpha = intro;
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.moveTo(ccx, ccy);
        ctx.arc(ccx, ccy, len, ang - 0.06, ang + 0.06);
        ctx.closePath();
        ctx.fill();
      }

      const flareW = width * 0.85;
      const flare = ctx.createLinearGradient(ccx - flareW / 2, 0, ccx + flareW / 2, 0);
      flare.addColorStop(0, "rgba(125, 211, 252, 0)");
      flare.addColorStop(0.5, "rgba(186, 230, 253, 0.55)");
      flare.addColorStop(1, "rgba(125, 211, 252, 0)");
      ctx.globalAlpha = 0.6 * pulse * intro;
      ctx.fillStyle = flare;
      ctx.fillRect(ccx - flareW / 2, ccy - 1.2, flareW, 2.4);

      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      drawCoreCoin(ccx, ccy, coinR, t);

      ctx.globalCompositeOperation = "lighter";
      drawGalaxy(true);

      // Rising coins (depth-sorted)
      ctx.globalCompositeOperation = "source-over";
      const visible: { x: number; y: number; s: number; z: number; c: (typeof coins)[number] }[] =
        [];
      for (let i = 0; i < coins.length; i++) {
        const c = coins[i];
        c.y -= c.v * dt;
        c.spin += c.spinV * dt;
        if (c.y < -650) coins[i] = spawnCoin(650);
        if (project(c.x * galScale, c.y, c.z * galScale)) {
          visible.push({ x: P.x, y: P.y, s: P.s, z: P.z, c });
        }
      }
      visible.sort((a, b) => b.z - a.z);
      for (const v of visible) {
        const fade = Math.max(0, 1 - Math.pow(Math.abs(v.c.y) / 650, 2));
        drawMiniCoin(v.x, v.y, v.c.size * v.s, v.c.spin, fade * 0.9 * intro);
      }

      // Shooting stars
      if (!reduced && intro >= 1 && Math.random() < dt / 3500) {
        const fromLeft = Math.random() < 0.5;
        shooting.push({
          x: fromLeft ? Math.random() * width * 0.5 : width * (0.5 + Math.random() * 0.5),
          y: Math.random() * height * 0.4,
          vx: (fromLeft ? 1 : -1) * (0.9 + Math.random() * 0.6),
          vy: 0.35 + Math.random() * 0.3,
          life: 1,
        });
      }
      ctx.globalCompositeOperation = "lighter";
      for (let i = shooting.length - 1; i >= 0; i--) {
        const sh = shooting[i];
        sh.x += sh.vx * dt;
        sh.y += sh.vy * dt;
        sh.life -= dt / 1100;
        if (sh.life <= 0) {
          shooting.splice(i, 1);
          continue;
        }
        const tail = 140;
        const tx = sh.x - sh.vx * tail;
        const ty = sh.y - sh.vy * tail;
        const sg = ctx.createLinearGradient(sh.x, sh.y, tx, ty);
        sg.addColorStop(0, "rgba(255,255,255,0.95)");
        sg.addColorStop(1, "rgba(255,255,255,0)");
        ctx.globalAlpha = sh.life;
        ctx.strokeStyle = sg;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(sh.x, sh.y);
        ctx.lineTo(tx, ty);
        ctx.stroke();
      }

      // Vignette
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.fillStyle = vignette as CanvasGradient;
      ctx.fillRect(0, 0, width, height);
    };

    animFrame = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const hh = now.toLocaleTimeString("en-US", { hour: "numeric", hour12: true }).split(" ")[0];
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  const ampm = now.getHours() < 12 ? "AM" : "PM";
  const dateLabel = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      ref={containerRef}
      className="cs-root"
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={`ArthaDrishti screensaver. ${wakeAction} to return.`}
      style={{
        opacity: isClosing ? 0 : 1,
        transform: isClosing ? "scale(1.04)" : "scale(1)",
        filter: isClosing ? "blur(6px)" : "none",
      }}
    >
      <style>{SCREENSAVER_CSS}</style>
      <canvas ref={canvasRef} className="cs-canvas" />

      <div className="cs-brand cs-reveal" style={{ animationDelay: "1.2s" }}>
        <div className="cs-brand-mark">
          <img src="/logo.png" alt="" />
        </div>
        <div>
          <div className="cs-brand-name">ArthaDrishti</div>
          <div className="cs-brand-tag">अर्थदृष्टि · Wealth, seen whole</div>
        </div>
      </div>

      <button
        type="button"
        className="cs-exit cs-reveal"
        style={{ animationDelay: "1.4s" }}
        onClick={handleWakeUp}
        aria-label="Exit screensaver"
      >
        <X size={13} />
        <span>Esc</span>
      </button>

      <div className="cs-clock cs-reveal" style={{ animationDelay: "1.5s" }}>
        <div className="cs-time-row">
          <div className="cs-time">
            {hh}
            <span className="cs-colon">:</span>
            {mm}
          </div>
          <div className="cs-time-side">
            <span className="cs-ampm">{ampm}</span>
            <span className="cs-sec">{ss}</span>
          </div>
        </div>
        <div className="cs-date">{dateLabel}</div>
      </div>

      <div className="cs-side cs-reveal" style={{ animationDelay: "1.7s" }}>
        <div className="cs-legend">
          {ARMS.map((a) => (
            <span key={a.name} className="cs-legend-item">
              <i
                style={{
                  background: `rgb(${a.rgb.join(",")})`,
                  boxShadow: `0 0 10px rgb(${a.rgb.join(",")})`,
                }}
              />
              {a.name}
            </span>
          ))}
        </div>
        <div className="cs-hint">
          <span className="cs-hint-dot" />
          {wakeHint}
        </div>
      </div>
    </div>
  );
};

const SCREENSAVER_CSS = `
.cs-root {
  position: fixed; inset: 0; z-index: 99999; overflow: hidden;
  background: #010107; color: #F8FAFC; cursor: none; outline: none;
  font-family: var(--font-sans, system-ui, sans-serif);
  transition: opacity ${FADE_OUT_MS}ms cubic-bezier(0.16,1,0.3,1), transform ${FADE_OUT_MS}ms cubic-bezier(0.16,1,0.3,1), filter ${FADE_OUT_MS}ms ease;
}
.cs-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
.cs-reveal { opacity: 0; animation: cs-reveal 1.1s cubic-bezier(0.16,1,0.3,1) forwards; }
@keyframes cs-reveal { from { opacity: 0; transform: translateY(14px); filter: blur(6px); } to { opacity: 1; transform: none; filter: none; } }
.cs-brand { position: absolute; top: 40px; left: 48px; display: flex; align-items: center; gap: 14px; }
.cs-brand-mark { width: 42px; height: 42px; border-radius: 50%; background: #fff; display: grid; place-items: center; overflow: hidden;
  box-shadow: 0 0 0 1.5px rgba(245,158,11,0.8), 0 0 28px rgba(245,158,11,0.45); }
.cs-brand-mark img { width: 88%; height: 88%; object-fit: contain; }
.cs-brand-name { font-size: 17px; font-weight: 700; letter-spacing: -0.01em; }
.cs-brand-tag { font-size: 11px; color: rgba(226,232,240,0.6); letter-spacing: 0.06em; margin-top: 2px; }
.cs-exit { position: absolute; top: 44px; right: 48px; display: flex; align-items: center; gap: 6px; cursor: pointer;
  background: rgba(255,255,255,0.06); color: rgba(226,232,240,0.75); border: 1px solid rgba(255,255,255,0.14);
  border-radius: 999px; padding: 6px 14px; font-size: 11px; font-weight: 600; letter-spacing: 0.08em; backdrop-filter: blur(12px); }
.cs-clock { position: absolute; left: 48px; bottom: 44px; }
.cs-time-row { display: flex; align-items: flex-start; }
.cs-time { font-size: clamp(64px, 9vw, 132px); font-weight: 200; line-height: 0.9;
  letter-spacing: -0.04em; font-variant-numeric: tabular-nums;
  background: linear-gradient(180deg, #FFFFFF 0%, #FDE68A 70%, #F59E0B 100%); -webkit-background-clip: text; background-clip: text; color: transparent;
  text-shadow: 0 0 60px rgba(245,158,11,0.18); }
.cs-colon { animation: cs-blink 2s steps(1) infinite; padding: 0 0.02em; }
@keyframes cs-blink { 50% { opacity: 0.25; } }
.cs-time-side { display: flex; flex-direction: column; gap: 6px; margin-left: 14px; margin-top: 0.9vw; letter-spacing: 0.1em; line-height: 1; }
.cs-ampm { font-size: 15px; font-weight: 700; color: #FBBF24; }
.cs-sec { font-size: 15px; font-weight: 500; color: rgba(226,232,240,0.55); font-family: var(--font-mono, monospace); }
.cs-date { margin-top: 14px; font-size: 13px; font-weight: 600; letter-spacing: 0.32em; text-transform: uppercase; color: rgba(226,232,240,0.7); }
.cs-side { position: absolute; right: 48px; bottom: 48px; display: flex; flex-direction: column; align-items: flex-end; gap: 18px; }
.cs-legend { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
.cs-legend-item { display: flex; align-items: center; gap: 10px; font-size: 11px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: rgba(226,232,240,0.7); }
.cs-legend-item i { width: 7px; height: 7px; border-radius: 50%; display: inline-block; order: 2; }
.cs-hint { display: flex; align-items: center; gap: 10px; font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase;
  color: #FDE68A; padding: 8px 16px; border-radius: 999px; border: 1px solid rgba(245,158,11,0.35); background: rgba(245,158,11,0.08); backdrop-filter: blur(12px); }
.cs-hint-dot { width: 7px; height: 7px; border-radius: 50%; background: #F59E0B; box-shadow: 0 0 10px #F59E0B; animation: cs-pulse 1.8s ease-in-out infinite; }
@keyframes cs-pulse { 50% { opacity: 0.3; transform: scale(0.7); } }
@media (max-width: 720px) {
  .cs-brand { top: 24px; left: 24px; } .cs-exit { top: 28px; right: 24px; }
  .cs-clock { left: 24px; bottom: 120px; } .cs-side { right: 24px; bottom: 28px; } .cs-legend { display: none; }
}
@media (prefers-reduced-motion: reduce) { .cs-colon, .cs-hint-dot { animation: none; } }
`;
