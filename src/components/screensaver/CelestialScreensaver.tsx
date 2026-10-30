import React, { useEffect, useRef, useState, useCallback } from "react";
import { X, Clock } from "lucide-react";

interface CelestialScreensaverProps {
  onClose: () => void;
  autoCloseOnActivity?: boolean;
}

// 3D Point & Vector Math Helpers
type Point3D = [number, number, number];
type ProjectedPoint = [number, number, number, number]; // [x, y, z, scale]

const rotate3D = (
  [x, y, z]: Point3D,
  rx: number,
  ry: number,
  rz: number
): Point3D => {
  // Pitch (X)
  const y1 = y * Math.cos(rx) - z * Math.sin(rx);
  const z1 = y * Math.sin(rx) + z * Math.cos(rx);
  // Yaw (Y)
  const x2 = x * Math.cos(ry) + z1 * Math.sin(ry);
  const z2 = -x * Math.sin(ry) + z1 * Math.cos(ry);
  // Roll (Z)
  const x3 = x2 * Math.cos(rz) - y1 * Math.sin(rz);
  const y3 = x2 * Math.sin(rz) + y1 * Math.cos(rz);
  return [x3, y3, z2];
};

// Icosahedron Vertices for Central Sacred Geometry Crystal
const PHI = (1 + Math.sqrt(5)) / 2;
const ICO_VERTICES_RAW: Point3D[] = [
  [-1, PHI, 0],
  [1, PHI, 0],
  [-1, -PHI, 0],
  [1, -PHI, 0],
  [0, -1, PHI],
  [0, 1, PHI],
  [0, -1, -PHI],
  [0, 1, -PHI],
  [PHI, 0, -1],
  [PHI, 0, 1],
  [-PHI, 0, -1],
  [-PHI, 0, 1],
];

// Normalize and scale icosahedron
const ICO_EDGES: [number, number][] = [
  [0, 1], [0, 5], [0, 7], [0, 10], [0, 11],
  [1, 5], [1, 7], [1, 8], [1, 9],
  [2, 3], [2, 4], [2, 6], [2, 10], [2, 11],
  [3, 4], [3, 6], [3, 8], [3, 9],
  [4, 5], [4, 9], [4, 11],
  [5, 9], [5, 11],
  [6, 7], [6, 8], [6, 10],
  [7, 8], [7, 10],
  [8, 9],
  [10, 11],
];

export const CelestialScreensaver: React.FC<CelestialScreensaverProps> = ({
  onClose,
  autoCloseOnActivity = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isClosingRef = useRef(false);
  const [isClosing, setIsClosing] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  // Dismiss immediately with smooth, fluid fade
  const handleWakeUp = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 180);
  }, [onClose]);

  // Live Clock Updater
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
      setCurrentDate(
        now.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        }).toUpperCase()
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Event Listeners for Instant Dismissal: Any key press or mouse move
  useEffect(() => {
    if (!autoCloseOnActivity) return;

    const mountTime = Date.now();
    let initialPos = { x: -1, y: -1 };

    const handleKeyDown = (e: KeyboardEvent) => {
      e.stopPropagation();
      handleWakeUp();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (initialPos.x === -1 && initialPos.y === -1) {
        initialPos = { x: e.clientX, y: e.clientY };
        return;
      }
      const dx = e.clientX - initialPos.x;
      const dy = e.clientY - initialPos.y;
      // Wake up when mouse moved > 12px and not on the first 200ms
      if (Math.hypot(dx, dy) > 12 && Date.now() - mountTime > 200) {
        handleWakeUp();
      }
    };

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (Date.now() - mountTime > 150) {
        handleWakeUp();
      }
    };

    const handleWheel = () => {
      if (Date.now() - mountTime > 150) {
        handleWakeUp();
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true, capture: true });
    window.addEventListener("mousedown", handlePointerDown, { capture: true });
    window.addEventListener("touchstart", handlePointerDown, { passive: true, capture: true });
    window.addEventListener("wheel", handleWheel, { passive: true, capture: true });

    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
      window.removeEventListener("mousemove", handleMouseMove, { capture: true });
      window.removeEventListener("mousedown", handlePointerDown, { capture: true });
      window.removeEventListener("touchstart", handlePointerDown, { capture: true });
      window.removeEventListener("wheel", handleWheel, { capture: true });
    };
  }, [autoCloseOnActivity, handleWakeUp]);

  // 3D Canvas Rendering Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    // Official Logo Texture
    const logoImg = new Image();
    logoImg.src = "/logo.png";
    let logoLoaded = false;
    logoImg.onload = () => {
      logoLoaded = true;
    };

    let animFrame: number;
    let rotX = 0.32;
    let rotY = 0.0;
    let rotZ = 0.05;

    // Sovereign 5 Asset Moon Nodes
    const ASSETS = [
      {
        name: "Equities",
        val: "₹62.3L",
        share: "42%",
        color: "#0284C7",
        glow: "rgba(56, 189, 248, 0.75)",
        rgb: [2, 132, 199],
        factor: 0.50,
        speed: 0.00075,
        tilt: 0.28,
        radius: 12,
        ringTilt: 0.45,
      },
      {
        name: "Real Estate",
        val: "₹50.5L",
        share: "34%",
        color: "#D97706",
        glow: "rgba(245, 158, 11, 0.75)",
        rgb: [217, 119, 6],
        factor: 0.72,
        speed: -0.00055,
        tilt: -0.32,
        radius: 13,
        ringTilt: -0.38,
      },
      {
        name: "Gold Bullion",
        val: "₹14.2L",
        share: "10%",
        color: "#F59E0B",
        glow: "rgba(253, 230, 138, 0.85)",
        rgb: [245, 158, 11],
        factor: 0.90,
        speed: 0.00045,
        tilt: 0.38,
        radius: 11,
        ringTilt: 0.20,
      },
      {
        name: "EPF & PPF",
        val: "₹23.7L",
        share: "16%",
        color: "#059669",
        glow: "rgba(52, 211, 153, 0.75)",
        rgb: [5, 150, 105],
        factor: 1.08,
        speed: -0.00035,
        tilt: -0.22,
        radius: 11,
        ringTilt: -0.5,
      },
      {
        name: "Liquid Cash",
        val: "₹12.0L",
        share: "8%",
        color: "#7C3AED",
        glow: "rgba(192, 132, 252, 0.75)",
        rgb: [124, 58, 237],
        factor: 1.25,
        speed: 0.0003,
        tilt: 0.18,
        radius: 10,
        ringTilt: 0.35,
      },
    ];

    // Moon Orbit Particle Trails
    const assetTrails: { x: number; y: number; z: number; age: number; color: string }[][] =
      ASSETS.map(() => []);

    // 3D Deep Space Starfield & Currency Glyphs
    const CURRENCY_GLYPHS = ["₹", "$", "€", "£", "₿", "✦", "▲", "◆"];
    const particles = Array.from({ length: 320 }, () => ({
      x: (Math.random() - 0.5) * 1600,
      y: (Math.random() - 0.5) * 1200,
      z: (Math.random() - 0.5) * 1200,
      baseSize: Math.random() * 2.2 + 0.6,
      alpha: Math.random() * 0.75 + 0.25,
      speedZ: Math.random() * 0.3 + 0.1,
      color: ["#F59E0B", "#38BDF8", "#10B981", "#A78BFA", "#F8FAFC", "#FCD34D"][
        Math.floor(Math.random() * 6)
      ],
      glyph: Math.random() > 0.88 ? CURRENCY_GLYPHS[Math.floor(Math.random() * CURRENCY_GLYPHS.length)] : null,
    }));

    // Projection calculation: 3D to 2D
    const project = (p: Point3D, fov = 850): ProjectedPoint => {
      const scale = fov / (fov + p[2]);
      return [width / 2 + p[0] * scale, height / 2 + p[1] * scale, p[2], scale];
    };

    // Vector lighting calculation: Directional Sunlight Vector
    const LIGHT_DIR: Point3D = [0.577, -0.677, 0.46];

    // Draw Shaded 3D Sphere with Diffuse & Specular Highlights
    const draw3DSphere = (
      cx: number,
      cy: number,
      radius: number,
      colorRgb: number[],
      glowColor: string,
      scale: number
    ) => {
      const r = Math.max(3, radius * scale);

      // Atmospheric outer glow
      const glowGrad = ctx.createRadialGradient(cx, cy, r * 0.4, cx, cy, r * 2.6);
      glowGrad.addColorStop(0, glowColor);
      glowGrad.addColorStop(1, "transparent");
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 2.6, 0, Math.PI * 2);
      ctx.fill();

      // Core 3D Volume Gradient (Off-center light source)
      const lightOffsetX = cx - r * 0.35;
      const lightOffsetY = cy - r * 0.35;
      const sphereGrad = ctx.createRadialGradient(
        lightOffsetX,
        lightOffsetY,
        r * 0.1,
        cx,
        cy,
        r
      );
      sphereGrad.addColorStop(0, "#FFFFFF"); // Specular peak
      sphereGrad.addColorStop(
        0.3,
        `rgb(${Math.min(255, colorRgb[0] + 60)}, ${Math.min(255, colorRgb[1] + 60)}, ${Math.min(255, colorRgb[2] + 60)})`
      );
      sphereGrad.addColorStop(0.75, `rgb(${colorRgb[0]}, ${colorRgb[1]}, ${colorRgb[2]})`);
      sphereGrad.addColorStop(
        1.0,
        `rgb(${Math.max(0, Math.round(colorRgb[0] * 0.35))}, ${Math.max(0, Math.round(colorRgb[1] * 0.35))}, ${Math.max(0, Math.round(colorRgb[2] * 0.35))})`
      );

      ctx.fillStyle = sphereGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // Rim light edge
      ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
      ctx.lineWidth = Math.max(0.75, 1.2 * scale);
      ctx.stroke();
    };

    // Main 3D Animation Render Loop
    const render = (timestamp: number) => {
      animFrame = requestAnimationFrame(render);
      const time = timestamp || 0;

      // Continuous, majestic orbital drift
      rotY += 0.0018;
      rotX = 0.30 + Math.sin(time * 0.0005) * 0.08;
      rotZ = Math.cos(time * 0.0004) * 0.04;

      ctx.clearRect(0, 0, width, height);

      // Deep Cosmic Background Mesh
      const bgGrad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        40,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.75
      );
      bgGrad.addColorStop(0, "#080e22");
      bgGrad.addColorStop(0.5, "#030612");
      bgGrad.addColorStop(1, "#010206");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 1. Starfield Particles & Currency Glyphs
      particles.forEach((p) => {
        p.z -= p.speedZ;
        if (p.z < -600) p.z = 600;

        const rotated = rotate3D([p.x, p.y, p.z], rotX * 0.3, rotY * 0.3, rotZ * 0.3);
        const [px, py, , scale] = project(rotated);

        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          ctx.globalAlpha = p.alpha * Math.min(1.2, scale);
          if (p.glyph && scale > 0.8) {
            ctx.fillStyle = p.color;
            ctx.font = `600 ${Math.round(11 * scale)}px 'Outfit', sans-serif`;
            ctx.fillText(p.glyph, px, py);
          } else {
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(px, py, p.baseSize * scale, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = 1.0;
        }
      });

      const maxOrbRadius = Math.min(width, height) * 0.36;

      // 2. Undulating 3D Topographic Horizon Grid
      const gridW = 680;
      const gridH = 680;
      const cols = 22;
      const rows = 22;
      const stepX = gridW / cols;
      const stepZ = gridH / rows;
      const baseY = 140;

      ctx.save();
      ctx.strokeStyle = "rgba(56, 189, 248, 0.12)";
      ctx.lineWidth = 1;
      for (let r = 0; r <= rows; r += 2) {
        ctx.beginPath();
        for (let c = 0; c <= cols; c++) {
          const x = (c - cols / 2) * stepX;
          const z = (r - rows / 2) * stepZ;
          const wave =
            Math.sin(x * 0.012 + time * 0.0014) * Math.cos(z * 0.012 + time * 0.0009) * 20;
          const p = rotate3D([x, baseY + wave, z], rotX, rotY, rotZ);
          const [px, py] = project(p);
          if (c === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      ctx.restore();

      // 3. 3D Armillary Gyroscope Rings (Nested Gimbal System)
      const GIMBAL_RINGS = [
        {
          radius: maxOrbRadius * 0.95,
          color: "rgba(245, 158, 11, 0.35)",
          specular: "#FDE68A",
          tiltX: 0,
          tiltY: time * 0.0005,
          tiltZ: 0.15,
          ticks: 24,
        },
        {
          radius: maxOrbRadius * 0.78,
          color: "rgba(56, 189, 248, 0.38)",
          specular: "#BAE6FD",
          tiltX: 0.42,
          tiltY: -time * 0.0007,
          tiltZ: -0.25,
          ticks: 18,
        },
        {
          radius: maxOrbRadius * 0.62,
          color: "rgba(16, 185, 129, 0.42)",
          specular: "#A7F3D0",
          tiltX: -0.35,
          tiltY: time * 0.0008,
          tiltZ: 0.4,
          ticks: 12,
        },
      ];

      GIMBAL_RINGS.forEach((ring) => {
        const segs = 72;
        const pts: ProjectedPoint[] = [];
        for (let i = 0; i <= segs; i++) {
          const theta = (i / segs) * Math.PI * 2;
          const lx = Math.cos(theta) * ring.radius;
          const lz = Math.sin(theta) * ring.radius;
          const pGimbal = rotate3D([lx, 0, lz], ring.tiltX, ring.tiltY, ring.tiltZ);
          const pWorld = rotate3D(pGimbal, rotX, rotY, rotZ);
          pts.push(project(pWorld));
        }

        // Draw back half of ring (z > 0)
        ctx.beginPath();
        pts.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p[0], p[1]);
          else ctx.lineTo(p[0], p[1]);
        });
        ctx.strokeStyle = ring.color;
        ctx.lineWidth = 1.6;
        ctx.stroke();

        // Tick marks on gimbal ring
        for (let t = 0; t < ring.ticks; t++) {
          const theta = (t / ring.ticks) * Math.PI * 2;
          const r1 = ring.radius - 6;
          const r2 = ring.radius + 6;
          const p1 = project(
            rotate3D(
              rotate3D([Math.cos(theta) * r1, 0, Math.sin(theta) * r1], ring.tiltX, ring.tiltY, ring.tiltZ),
              rotX,
              rotY,
              rotZ
            )
          );
          const p2 = project(
            rotate3D(
              rotate3D([Math.cos(theta) * r2, 0, Math.sin(theta) * r2], ring.tiltX, ring.tiltY, ring.tiltZ),
              rotX,
              rotY,
              rotZ
            )
          );
          ctx.beginPath();
          ctx.moveTo(p1[0], p1[1]);
          ctx.lineTo(p2[0], p2[1]);
          ctx.strokeStyle = ring.specular;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      });

      // 4. Central Sacred Geometric Crystalline Core (Icosahedron)
      const icoScale = maxOrbRadius * 0.22;
      const icoRotTime = time * 0.0008;
      const projectedIcoVerts = ICO_VERTICES_RAW.map((v) => {
        const mag = Math.hypot(v[0], v[1], v[2]);
        const norm: Point3D = [
          (v[0] / mag) * icoScale,
          (v[1] / mag) * icoScale,
          (v[2] / mag) * icoScale,
        ];
        const rotatedIco = rotate3D(norm, icoRotTime, icoRotTime * 1.3, icoRotTime * 0.7);
        return project(rotate3D(rotatedIco, rotX, rotY, rotZ));
      });

      // Draw Icosahedron Edges with Glowing Crystal Sheen
      ctx.save();
      ctx.strokeStyle = "rgba(245, 158, 11, 0.45)";
      ctx.lineWidth = 1.2;
      ICO_EDGES.forEach(([i1, i2]) => {
        const p1 = projectedIcoVerts[i1];
        const p2 = projectedIcoVerts[i2];
        ctx.beginPath();
        ctx.moveTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
        ctx.stroke();
      });
      ctx.restore();

      // 5. Central 3D Sovereign Coin / Medallion
      const logoR = Math.max(52, maxOrbRadius * 0.26);
      const thickness = Math.max(16, logoR * 0.28);
      const frontZ = thickness / 2;
      const backZ = -thickness / 2;
      const segments = 48;

      const normFront = rotate3D([0, 0, 1], rotX, rotY, rotZ);
      const isFrontFacing = normFront[2] < 0;

      const frontVerts: ProjectedPoint[] = [];
      const backVerts: ProjectedPoint[] = [];

      for (let i = 0; i < segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const lx = Math.cos(theta) * logoR;
        const ly = Math.sin(theta) * logoR;
        frontVerts.push(project(rotate3D([lx, ly, frontZ], rotX, rotY, rotZ)));
        backVerts.push(project(rotate3D([lx, ly, backZ], rotX, rotY, rotZ)));
      }

      const centerFront = project(rotate3D([0, 0, frontZ], rotX, rotY, rotZ));
      const centerBack = project(rotate3D([0, 0, backZ], rotX, rotY, rotZ));

      // Radiant Volumetric God Rays
      ctx.save();
      const numRays = 14;
      for (let i = 0; i < numRays; i++) {
        const rayAngle = (i / numRays) * Math.PI * 2 + time * 0.0006;
        const rayLen = logoR * (1.8 + Math.sin(time * 0.002 + i) * 0.4) * centerFront[3];
        const rx = centerFront[0] + Math.cos(rayAngle) * rayLen;
        const ry = centerFront[1] + Math.sin(rayAngle) * rayLen;

        const rayGrad = ctx.createLinearGradient(centerFront[0], centerFront[1], rx, ry);
        rayGrad.addColorStop(0, "rgba(245, 158, 11, 0.35)");
        rayGrad.addColorStop(1, "transparent");
        ctx.fillStyle = rayGrad;
        ctx.beginPath();
        ctx.moveTo(centerFront[0], centerFront[1]);
        ctx.arc(centerFront[0], centerFront[1], rayLen, rayAngle - 0.08, rayAngle + 0.08);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // Milled 3D Coin Edge Facets
      for (let i = 0; i < segments; i++) {
        const next = (i + 1) % segments;
        const f1 = frontVerts[i],
          f2 = frontVerts[next];
        const b1 = backVerts[i],
          b2 = backVerts[next];
        const normalZ = (f2[0] - f1[0]) * (b1[1] - f1[1]) - (f2[1] - f1[1]) * (b1[0] - f1[0]);

        if (normalZ > 0) {
          ctx.beginPath();
          ctx.moveTo(f1[0], f1[1]);
          ctx.lineTo(f2[0], f2[1]);
          ctx.lineTo(b2[0], b2[1]);
          ctx.lineTo(b1[0], b1[1]);
          ctx.closePath();

          const lightFactor = Math.max(0.35, Math.min(0.98, normalZ / 600 + 0.45));
          ctx.fillStyle = `rgb(${Math.round(217 * lightFactor)}, ${Math.round(119 * lightFactor)}, ${Math.round(6 * lightFactor)})`;
          ctx.fill();
          ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }

      // Disc Base Surface
      const activeVerts = isFrontFacing ? frontVerts : backVerts;
      const activeCenter = isFrontFacing ? centerFront : centerBack;

      ctx.beginPath();
      activeVerts.forEach((v, i) => {
        if (i === 0) ctx.moveTo(v[0], v[1]);
        else ctx.lineTo(v[0], v[1]);
      });
      ctx.closePath();

      const discGrad = ctx.createRadialGradient(
        activeCenter[0],
        activeCenter[1],
        2,
        activeCenter[0],
        activeCenter[1],
        logoR * activeCenter[3]
      );
      discGrad.addColorStop(0, "#FFFFFF");
      discGrad.addColorStop(0.68, "#FFFFFF");
      discGrad.addColorStop(0.86, "#FDE68A");
      discGrad.addColorStop(0.95, "#F59E0B");
      discGrad.addColorStop(1, "#B45309");
      ctx.fillStyle = discGrad;
      ctx.fill();
      ctx.strokeStyle = "#D97706";
      ctx.lineWidth = 3 * activeCenter[3];
      ctx.stroke();

      // Official Logo Texture Mapping into 3D
      if (isFrontFacing && logoLoaded) {
        const pRight = project(rotate3D([logoR, 0, frontZ], rotX, rotY, rotZ));
        const pBottom = project(rotate3D([0, logoR, frontZ], rotX, rotY, rotZ));

        const dxX = (pRight[0] - centerFront[0]) / logoR;
        const dxY = (pRight[1] - centerFront[1]) / logoR;
        const dyX = (pBottom[0] - centerFront[0]) / logoR;
        const dyY = (pBottom[1] - centerFront[1]) / logoR;

        ctx.save();
        ctx.beginPath();
        frontVerts.forEach((v, i) => {
          if (i === 0) ctx.moveTo(v[0], v[1]);
          else ctx.lineTo(v[0], v[1]);
        });
        ctx.closePath();
        ctx.clip();

        ctx.transform(dxX, dxY, dyX, dyY, centerFront[0], centerFront[1]);
        const drawSize = logoR * 1.85;
        ctx.shadowColor = "rgba(15, 23, 42, 0.35)";
        ctx.shadowBlur = 12;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 3;
        ctx.drawImage(logoImg, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
        ctx.shadowColor = "transparent";

        // Anisotropic Golden Sheen Sweep
        const sheenX = Math.sin(time * 0.0016) * logoR * 2.5;
        const sheenGrad = ctx.createLinearGradient(sheenX - 40, -logoR, sheenX + 40, logoR);
        sheenGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
        sheenGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.55)");
        sheenGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = sheenGrad;
        ctx.fillRect(-logoR, -logoR, logoR * 2, logoR * 2);

        ctx.restore();
      } else if (!isFrontFacing) {
        ctx.save();
        ctx.fillStyle = "#78350F";
        ctx.font = `bold ${Math.round(15 * activeCenter[3])}px 'Outfit', sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("॥ अर्थदृष्टि ॥", activeCenter[0], activeCenter[1] - 8);
        ctx.font = `700 ${Math.round(9 * activeCenter[3])}px 'Outfit', sans-serif`;
        ctx.fillStyle = "#B45309";
        ctx.fillText("SOVEREIGN WEALTH OS", activeCenter[0], activeCenter[1] + 14);
        ctx.restore();
      }

      // 6. Sovereign Asset Moons in 3D Orbits
      // Depth sorting so back moons render before front moons
      const renderedMoons = ASSETS.map((asset, idx) => {
        const orbitR = asset.factor * maxOrbRadius;
        const angle = time * asset.speed + (idx * (Math.PI * 2 / ASSETS.length));

        const ax = Math.cos(angle) * orbitR;
        const az = Math.sin(angle) * orbitR;
        const ay = Math.sin(angle) * (orbitR * asset.tilt * 0.5);

        const pWorld = rotate3D([ax, ay, az], rotX, rotY, rotZ);
        const [px, py, pz, scale] = project(pWorld);

        // Record Trail Point
        const trails = assetTrails[idx];
        trails.push({ x: px, y: py, z: pz, age: 1.0, color: asset.color });
        if (trails.length > 28) trails.shift();

        return {
          asset,
          idx,
          px,
          py,
          pz,
          scale,
        };
      });

      // Sort by depth (pz descending: deepest first)
      renderedMoons.sort((a, b) => b.pz - a.pz);

      renderedMoons.forEach(({ asset, idx, px, py, scale }) => {
        // Orbit Filament to Core
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(centerFront[0], centerFront[1]);
        ctx.lineTo(px, py);
        ctx.strokeStyle = `rgba(${asset.rgb[0]}, ${asset.rgb[1]}, ${asset.rgb[2]}, 0.28)`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Pulsing Filament Particle
        const particleT = (time * 0.0012 + idx * 0.3) % 1;
        const fx = centerFront[0] + (px - centerFront[0]) * particleT;
        const fy = centerFront[1] + (py - centerFront[1]) * particleT;
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(fx, fy, 2 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Draw Motion Trail Ribbons
        const trails = assetTrails[idx];
        if (trails.length > 2) {
          ctx.save();
          ctx.beginPath();
          for (let i = 0; i < trails.length; i++) {
            const pt = trails[i];
            if (i === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          }
          ctx.strokeStyle = `rgba(${asset.rgb[0]}, ${asset.rgb[1]}, ${asset.rgb[2]}, 0.35)`;
          ctx.lineWidth = 2 * scale;
          ctx.stroke();
          ctx.restore();
        }

        // Draw 3D Shaded Sphere
        draw3DSphere(px, py, asset.radius, asset.rgb, asset.glow, scale);

        // Planetary Saturnian Ring around the moon
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(
          px,
          py,
          asset.radius * 2.2 * scale,
          asset.radius * 0.8 * scale,
          asset.ringTilt,
          0,
          Math.PI * 2
        );
        ctx.strokeStyle = `rgba(${asset.rgb[0]}, ${asset.rgb[1]}, ${asset.rgb[2]}, 0.6)`;
        ctx.lineWidth = 1.4 * scale;
        ctx.stroke();
        ctx.restore();

        // Floating 3D HUD Data Card
        const cardW = 126 * scale;
        const cardH = 38 * scale;
        const cardX = px >= width / 2 ? px + 16 * scale : px - 16 * scale - cardW;
        const cardY = py - cardH / 2;

        ctx.save();
        ctx.fillStyle = "rgba(8, 14, 28, 0.88)";
        ctx.strokeStyle = `rgba(${asset.rgb[0]}, ${asset.rgb[1]}, ${asset.rgb[2]}, 0.75)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        if ("roundRect" in ctx) {
          (ctx as any).roundRect(cardX, cardY, cardW, cardH, 8 * scale);
        } else {
          ctx.rect(cardX, cardY, cardW, cardH);
        }
        ctx.fill();
        ctx.stroke();

        // Asset Name & Share
        ctx.fillStyle = "#F8FAFC";
        ctx.font = `700 ${Math.round(11 * scale)}px 'Outfit', sans-serif`;
        ctx.textAlign = "left";
        ctx.fillText(asset.name, cardX + 10 * scale, cardY + 14 * scale);

        ctx.fillStyle = asset.color;
        ctx.font = `bold ${Math.round(9.5 * scale)}px 'Outfit', sans-serif`;
        ctx.fillText(asset.share, cardX + cardW - 28 * scale, cardY + 14 * scale);

        // Asset Value
        ctx.fillStyle = "#CBD5E1";
        ctx.font = `600 ${Math.round(12 * scale)}px 'Outfit', monospace`;
        ctx.fillText(asset.val, cardX + 10 * scale, cardY + 28 * scale);

        ctx.restore();
      });
    };

    animFrame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "#010206",
        color: "#F8FAFC",
        overflow: "hidden",
        cursor: "none", // Screensaver hides cursor for immersive cinema feel
        opacity: isClosing ? 0 : 1,
        transform: isClosing ? "scale(1.03)" : "scale(1)",
        transition: "opacity 180ms cubic-bezier(0.16, 1, 0.3, 1), transform 180ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      role="dialog"
      aria-modal="true"
      aria-label="3D Sovereign Screensaver"
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
        }}
      />

      {/* Senior Graphic Designer HUD: TOP BAR */}
      <div
        style={{
          position: "absolute",
          top: 28,
          left: 36,
          right: 36,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pointerEvents: "auto",
        }}
      >
        {/* Brand Crest */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            background: "rgba(6, 11, 24, 0.82)",
            border: "1px solid rgba(245, 158, 11, 0.38)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            padding: "8px 20px 8px 10px",
            borderRadius: 999,
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: "#FFFFFF",
              border: "1.5px solid #F59E0B",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              boxShadow: "0 0 16px rgba(245, 158, 11, 0.4)",
            }}
          >
            <img
              src="/logo.png"
              alt="ArthaDrishti"
              style={{ width: "90%", height: "90%", objectFit: "contain" }}
            />
          </div>
          <div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                gap: 8,
                letterSpacing: "-0.01em",
              }}
            >
              ArthaDrishti
              <span
                style={{
                  fontSize: 9.5,
                  fontWeight: 800,
                  fontFamily: "monospace",
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: "linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.35))",
                  color: "#FBBF24",
                  border: "1px solid rgba(245, 158, 11, 0.55)",
                  letterSpacing: "0.06em",
                }}
              >
                SOVEREIGN 3D
              </span>
            </div>
            <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 500 }}>
              Sovereign Wealth Operating System
            </div>
          </div>
        </div>

        {/* Live Luxury Swiss Chronometer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            background: "rgba(6, 11, 24, 0.82)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            padding: "8px 20px",
            borderRadius: 999,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Clock size={15} style={{ color: "#F59E0B" }} />
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 15,
                fontWeight: 700,
                color: "#FFFFFF",
                letterSpacing: "0.05em",
              }}
            >
              {currentTime}
            </span>
          </div>
          <span style={{ color: "rgba(255, 255, 255, 0.2)" }}>|</span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#94A3B8",
              letterSpacing: "0.08em",
            }}
          >
            {currentDate}
          </span>
        </div>
      </div>

      {/* Senior Graphic Designer HUD: BOTTOM TELEMETRY BAR */}
      <div
        style={{
          position: "absolute",
          bottom: 28,
          left: 36,
          right: 36,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(6, 11, 24, 0.82)",
          border: "1px solid rgba(255, 255, 255, 0.14)",
          boxShadow: "0 12px 40px rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          padding: "12px 24px",
          borderRadius: 20,
          pointerEvents: "auto",
        }}
      >
        {/* Real-time Portfolio Indicators */}
        <div style={{ display: "flex", alignItems: "center", gap: 24, fontSize: 12 }}>
          <div>
            <span style={{ color: "#94A3B8", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", display: "block" }}>
              Total Net Worth
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 17, fontWeight: 800, color: "#F59E0B", fontFamily: "monospace" }}>
                ₹1,48,50,000
              </span>
              <span style={{ fontSize: 11, color: "#10B981", fontWeight: 700 }}>
                ▲ +2.4% MoM
              </span>
            </div>
          </div>

          <div style={{ width: 1, height: 30, background: "rgba(255, 255, 255, 0.15)" }} />

          <div>
            <span style={{ color: "#94A3B8", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", display: "block" }}>
              Asset Distribution
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 2 }}>
              <span style={{ color: "#38BDF8", fontSize: 11.5, fontWeight: 600 }}>● 42% Equities</span>
              <span style={{ color: "#F59E0B", fontSize: 11.5, fontWeight: 600 }}>● 34% Real Estate</span>
              <span style={{ color: "#10B981", fontSize: 11.5, fontWeight: 600 }}>● 16% EPF/PPF</span>
              <span style={{ color: "#FDE68A", fontSize: 11.5, fontWeight: 600 }}>● 10% Gold</span>
            </div>
          </div>
        </div>

        {/* Wake Status Indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(245, 158, 11, 0.12)",
              border: "1px solid rgba(245, 158, 11, 0.35)",
              padding: "6px 14px",
              borderRadius: 999,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#F59E0B",
                boxShadow: "0 0 10px #F59E0B",
                animation: "pulse 2s infinite",
              }}
            />
            <span
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                color: "#FDE68A",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              Move mouse or press any key to wake
            </span>
          </div>

          <button
            type="button"
            onClick={handleWakeUp}
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              color: "#E2E8F0",
              border: "1px solid rgba(255, 255, 255, 0.18)",
              borderRadius: 10,
              padding: "6px 14px",
              fontSize: 11.5,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "background 150ms ease",
            }}
            aria-label="Wake up and return to app"
          >
            <X size={13} />
            <span>Exit (Esc)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
