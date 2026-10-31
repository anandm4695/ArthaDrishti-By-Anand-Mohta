import React, { useEffect, useRef } from "react";

interface WealthSkylineCanvasProps {
  /** Stop rendering (e.g. while the fullscreen screensaver covers the page). */
  paused?: boolean;
  /** Element whose pointer movement steers the camera; defaults to the canvas parent. */
  trackRef?: React.RefObject<HTMLElement | null>;
}

// A circular "allocation city": each slice of towers is an asset class, the gold spire is
// the core, and a gold growth trajectory spirals up around it. Pure 2D-canvas 3D.
const SECTORS = [
  { rgb: [56, 189, 248], share: 0.42 }, // Equities
  { rgb: [251, 146, 60], share: 0.24 }, // Real Estate
  { rgb: [250, 204, 21], share: 0.1 }, // Gold
  { rgb: [52, 211, 153], share: 0.16 }, // EPF & PPF
  { rgb: [192, 132, 252], share: 0.08 }, // Liquid Cash
];
const CORE_RGB = [253, 224, 71];
const NAVY = [12, 16, 40];

const TAU = Math.PI * 2;
const CELL = 46;
const FOOT = 15; // half footprint
const RINGS = 5.4; // city radius, in cells
const LIGHT = (() => {
  const v = [-0.55, 0.7, -0.45];
  const m = Math.hypot(v[0], v[1], v[2]);
  return v.map((c) => c / m);
})();

const easeOutBack = (p: number) => {
  const c1 = 1.4;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
};
const hash = (i: number, j: number) => {
  const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

type Tower = {
  x: number;
  z: number;
  r: number;
  h: number;
  delay: number;
  rgb: number[];
  isCore: boolean;
};

export const WealthSkylineCanvas: React.FC<WealthSkylineCanvasProps> = ({
  paused = false,
  trackRef,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const host = trackRef?.current ?? canvas.parentElement ?? canvas;

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // Pointer-steered camera (eased toward target)
    const mouse = { tx: 0, ty: 0, x: 0, y: 0 };
    const onMove = (e: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      mouse.tx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.ty = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    };
    const onLeave = () => {
      mouse.tx = 0;
      mouse.ty = 0;
    };
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);

    // Build the city
    const towers: Tower[] = [];
    const n = Math.ceil(RINGS);
    const sectorEdges: number[] = [];
    SECTORS.reduce((acc, s) => {
      sectorEdges.push(acc + s.share);
      return acc + s.share;
    }, 0);
    for (let i = -n; i <= n; i++) {
      for (let j = -n; j <= n; j++) {
        const r = Math.hypot(i, j);
        if (r > RINGS) continue;
        const isCore = r < 0.5;
        const ang = (Math.atan2(j, i) + Math.PI) / TAU; // 0..1
        const sector = sectorEdges.findIndex((edge) => ang <= edge + 1e-6);
        const falloff = Math.pow(1 - r / (RINGS + 0.6), 1.5);
        const hv = hash(i, j);
        towers.push({
          x: i * CELL,
          z: j * CELL,
          r,
          h: isCore ? 250 : (26 + 210 * falloff) * (0.6 + 0.55 * hv),
          delay: r * 95 + hv * 220,
          rgb: isCore ? CORE_RGB : SECTORS[Math.max(0, sector)].rgb,
          isCore,
        });
      }
    }

    const sparks = Array.from({ length: reduced ? 0 : 46 }, () => ({
      t: towers[Math.floor(Math.random() * towers.length)],
      y: Math.random(),
      v: 0.00025 + Math.random() * 0.0004,
      ox: (Math.random() - 0.5) * FOOT * 2,
      oz: (Math.random() - 0.5) * FOOT * 2,
    }));

    // Camera
    const target = [0, 95, 0];
    let yaw = 0;
    let pitch = 0.5;
    let dist = 900;
    let focal = 800;
    let cxs = 0;
    let cys = 0;
    let cy = 1,
      sy = 0,
      cp = 1,
      sp = 0;
    const cam = [0, 0, 0];
    const P = { x: 0, y: 0, s: 0, d: 0 };
    const project = (x: number, y: number, z: number) => {
      x -= target[0];
      y -= target[1];
      z -= target[2];
      const x1 = x * cy + z * sy;
      const z1 = -x * sy + z * cy;
      const y2 = y * cp + z1 * sp;
      const z2 = -y * sp + z1 * cp;
      const zc = z2 + dist;
      const s = focal / Math.max(20, zc);
      P.x = cxs + x1 * s;
      P.y = cys - y2 * s;
      P.s = s;
      P.d = zc;
    };
    const shade = (rgb: number[], k: number, mixNavy = 0.25) =>
      `rgb(${Math.round((rgb[0] * (1 - mixNavy) + NAVY[0] * mixNavy) * k)},${Math.round(
        (rgb[1] * (1 - mixNavy) + NAVY[1] * mixNavy) * k
      )},${Math.round((rgb[2] * (1 - mixNavy) + NAVY[2] * mixNavy) * k)})`;

    const glow = (() => {
      const c = document.createElement("canvas");
      c.width = c.height = 64;
      const g = c.getContext("2d") as CanvasRenderingContext2D;
      const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, "rgba(255,255,255,1)");
      grad.addColorStop(0.2, "rgba(253,224,71,0.8)");
      grad.addColorStop(1, "rgba(253,224,71,0)");
      g.fillStyle = grad;
      g.fillRect(0, 0, 64, 64);
      return c;
    })();

    // Side faces: [normal, corner offsets]
    const SIDES: { n: [number, number]; a: [number, number]; b: [number, number] }[] = [
      { n: [1, 0], a: [FOOT, -FOOT], b: [FOOT, FOOT] },
      { n: [-1, 0], a: [-FOOT, FOOT], b: [-FOOT, -FOOT] },
      { n: [0, 1], a: [FOOT, FOOT], b: [-FOOT, FOOT] },
      { n: [0, -1], a: [-FOOT, -FOOT], b: [FOOT, -FOOT] },
    ];

    const quad = (pts: number[]) => {
      ctx.beginPath();
      ctx.moveTo(pts[0], pts[1]);
      ctx.lineTo(pts[2], pts[3]);
      ctx.lineTo(pts[4], pts[5]);
      ctx.lineTo(pts[6], pts[7]);
      ctx.closePath();
    };
    const pts = new Array(8).fill(0);

    let raf = 0;
    let start = -1;
    const order = towers.map((_, i) => i);
    const heights = new Float32Array(towers.length);

    const render = (ts: number) => {
      raf = requestAnimationFrame(render);
      if (pausedRef.current || width < 2 || height < 2) return;
      if (start < 0) start = ts;
      const t = reduced ? 4000 + (ts - start) * 0.3 : ts - start;

      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;
      yaw = -0.6 + t * 0.00007 + mouse.x * 0.45;
      pitch = 0.52 + mouse.y * 0.12 + Math.sin(t * 0.0003) * 0.03;
      dist = 980 - Math.min(1, t / 2600) * 120;
      // Short, wide hosts (the phone/tablet banner) frame tighter and lower so the city
      // fills the strip instead of floating small in the middle of it.
      const banner = height < 460 && width > height;
      focal = banner ? Math.min(width * 0.9, height * 1.75) : Math.min(width * 0.95, height * 1.05);
      cxs = width * (banner ? 0.5 : 0.52);
      cys = height * (banner ? 0.74 : 0.68);
      cy = Math.cos(yaw);
      sy = Math.sin(yaw);
      cp = Math.cos(pitch);
      sp = Math.sin(pitch);
      // Camera position in world space (inverse of the view rotation applied to (0,0,-dist))
      {
        const vy = dist * Math.sin(pitch);
        const vz = -dist * Math.cos(pitch);
        cam[0] = target[0] - vz * Math.sin(yaw);
        cam[1] = target[1] + vy;
        cam[2] = target[2] + vz * Math.cos(yaw);
      }

      ctx.clearRect(0, 0, width, height);

      // Ground: lit disc, allocation rings and sector spokes
      project(0, 0, 0);
      const gx = P.x;
      const gy = P.y;
      const groundR = (RINGS + 1.2) * CELL;
      ctx.save();
      ctx.translate(gx, gy);
      ctx.scale(1, Math.max(0.15, sp));
      const disc = ctx.createRadialGradient(0, 0, 0, 0, 0, groundR * P.s * 1.25);
      disc.addColorStop(0, "rgba(99,102,241,0.35)");
      disc.addColorStop(0.55, "rgba(56,72,180,0.12)");
      disc.addColorStop(1, "rgba(56,72,180,0)");
      ctx.fillStyle = disc;
      ctx.beginPath();
      ctx.arc(0, 0, groundR * P.s * 1.25, 0, TAU);
      ctx.fill();
      ctx.restore();

      ctx.lineWidth = 1;
      for (let k = 1; k <= 4; k++) {
        const rr = (groundR * k) / 4;
        ctx.strokeStyle = `rgba(165,180,252,${0.07 + k * 0.02})`;
        ctx.beginPath();
        for (let s = 0; s <= 72; s++) {
          const a = (s / 72) * TAU;
          project(Math.cos(a) * rr, 0, Math.sin(a) * rr);
          if (s === 0) ctx.moveTo(P.x, P.y);
          else ctx.lineTo(P.x, P.y);
        }
        ctx.stroke();
      }
      let acc = 0;
      for (const s of SECTORS) {
        acc += s.share;
        const a = acc * TAU - Math.PI;
        project(Math.cos(a) * groundR * 1.12, 0, Math.sin(a) * groundR * 1.12);
        const ex = P.x;
        const ey = P.y;
        project(0, 0, 0);
        ctx.strokeStyle = "rgba(165,180,252,0.18)";
        ctx.beginPath();
        ctx.moveTo(P.x, P.y);
        ctx.lineTo(ex, ey);
        ctx.stroke();
      }

      // Towers — painter's order (far to near)
      for (let i = 0; i < towers.length; i++) {
        const tw = towers[i];
        const grow = Math.min(1, Math.max(0, (t - 250 - tw.delay) / 950));
        const breathe = 1 + 0.05 * Math.sin(t * 0.0011 - tw.r * 0.9);
        heights[i] = tw.h * (grow > 0 ? easeOutBack(grow) : 0) * breathe;
      }
      order.sort((a, b) => {
        const A = towers[a];
        const B = towers[b];
        return (
          (B.x - cam[0]) ** 2 + (B.z - cam[2]) ** 2 - ((A.x - cam[0]) ** 2 + (A.z - cam[2]) ** 2)
        );
      });

      for (const idx of order) {
        const tw = towers[idx];
        const h = heights[idx];
        if (h < 0.5) continue;
        for (const side of SIDES) {
          const fx = tw.x + side.n[0] * FOOT;
          const fz = tw.z + side.n[1] * FOOT;
          if (side.n[0] * (cam[0] - fx) + side.n[1] * (cam[2] - fz) <= 0) continue;
          project(tw.x + side.a[0], 0, tw.z + side.a[1]);
          pts[0] = P.x;
          pts[1] = P.y;
          project(tw.x + side.b[0], 0, tw.z + side.b[1]);
          pts[2] = P.x;
          pts[3] = P.y;
          project(tw.x + side.b[0], h, tw.z + side.b[1]);
          pts[4] = P.x;
          pts[5] = P.y;
          project(tw.x + side.a[0], h, tw.z + side.a[1]);
          pts[6] = P.x;
          pts[7] = P.y;
          const lambert = Math.max(0, side.n[0] * LIGHT[0] + side.n[1] * LIGHT[2]);
          const k = 0.38 + 0.5 * lambert;
          const g = ctx.createLinearGradient(
            0,
            Math.max(pts[5], pts[7]),
            0,
            Math.min(pts[1], pts[3])
          );
          g.addColorStop(0, shade(tw.rgb, Math.min(1, k + 0.25), 0.15));
          g.addColorStop(1, shade(tw.rgb, k * 0.45, 0.55));
          ctx.fillStyle = g;
          quad(pts);
          ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,0.06)";
          ctx.stroke();
        }
        // Roof
        project(tw.x - FOOT, h, tw.z - FOOT);
        pts[0] = P.x;
        pts[1] = P.y;
        project(tw.x + FOOT, h, tw.z - FOOT);
        pts[2] = P.x;
        pts[3] = P.y;
        project(tw.x + FOOT, h, tw.z + FOOT);
        pts[4] = P.x;
        pts[5] = P.y;
        project(tw.x - FOOT, h, tw.z + FOOT);
        pts[6] = P.x;
        pts[7] = P.y;
        ctx.fillStyle = shade(tw.rgb, 1, 0);
        quad(pts);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.75)";
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.lineWidth = 1;

        if (tw.isCore || h > 150) {
          project(tw.x, h + 2, tw.z);
          const gs = (tw.isCore ? 150 : 46) * P.s;
          ctx.globalCompositeOperation = "lighter";
          ctx.globalAlpha = tw.isCore ? 0.9 : 0.35;
          ctx.drawImage(glow, P.x - gs / 2, P.y - gs / 2, gs, gs);
          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = "source-over";
        }
      }

      // Core beacon
      const coreH = heights[towers.findIndex((tw) => tw.isCore)] || 0;
      if (coreH > 1) {
        project(0, coreH, 0);
        const bx = P.x;
        const by = P.y;
        const beamTop = by - 170 * P.s;
        const beam = ctx.createLinearGradient(bx, by, bx, beamTop);
        beam.addColorStop(0, "rgba(253,224,71,0.35)");
        beam.addColorStop(1, "rgba(253,224,71,0)");
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = beam;
        ctx.beginPath();
        ctx.moveTo(bx - 3, by);
        ctx.lineTo(bx + 3, by);
        ctx.lineTo(bx + 16, beamTop);
        ctx.lineTo(bx - 16, beamTop);
        ctx.closePath();
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";
      }

      // Growth trajectory: a gold spiral climbing around the city
      const intro = Math.min(1, Math.max(0, (t - 900) / 1600));
      if (intro > 0) {
        const SEG = 140;
        const head = (t * 0.00012) % 1;
        ctx.lineCap = "round";
        let px = 0,
          py = 0;
        for (let s = 0; s <= SEG * intro; s++) {
          const u = s / SEG;
          const a = u * TAU * 1.35 + 0.8;
          const rr = 330 - 120 * u;
          const y = 30 + u * u * 300;
          project(Math.cos(a) * rr, y, Math.sin(a) * rr);
          if (s > 0) {
            const near = Math.max(0, 1 - Math.abs(u - head) * 9);
            ctx.strokeStyle = `rgba(253, 230, 138, ${0.25 + 0.6 * near})`;
            ctx.lineWidth = (1.4 + 2.6 * near) * Math.min(1.6, P.s * 1.1);
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(P.x, P.y);
            ctx.stroke();
          }
          px = P.x;
          py = P.y;
        }
        {
          const u = head;
          if (u <= intro) {
            const a = u * TAU * 1.35 + 0.8;
            project(Math.cos(a) * (330 - 120 * u), 30 + u * u * 300, Math.sin(a) * (330 - 120 * u));
            const gs = 60 * P.s;
            ctx.globalCompositeOperation = "lighter";
            ctx.drawImage(glow, P.x - gs / 2, P.y - gs / 2, gs, gs);
            ctx.globalCompositeOperation = "source-over";
          }
        }
      }

      // Rising sparks
      ctx.globalCompositeOperation = "lighter";
      for (const sp2 of sparks) {
        const idx = towers.indexOf(sp2.t);
        const base = heights[idx] || 0;
        sp2.y += sp2.v * 16;
        if (sp2.y > 1) {
          sp2.y = 0;
          sp2.t = towers[Math.floor(Math.random() * towers.length)];
        }
        if (base < 5) continue;
        project(sp2.t.x + sp2.ox, base + sp2.y * 140, sp2.t.z + sp2.oz);
        const sz = 9 * P.s;
        ctx.globalAlpha = (1 - sp2.y) * 0.8;
        ctx.drawImage(glow, P.x - sz / 2, P.y - sz / 2, sz, sz);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    };

    raf = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, [trackRef]);

  return <canvas ref={canvasRef} className="af-skyline-canvas" aria-hidden="true" />;
};
