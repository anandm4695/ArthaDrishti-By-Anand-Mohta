import React, { useEffect, useRef, useState } from "react";
import { X, Sparkles, Volume2, VolumeX, Maximize2 } from "lucide-react";

interface CelestialScreensaverProps {
  onClose: () => void;
  autoCloseOnActivity?: boolean;
}

export const CelestialScreensaver: React.FC<CelestialScreensaverProps> = ({
  onClose,
  autoCloseOnActivity = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isExploded, setIsExploded] = useState(false);
  const [activeAsset, setActiveAsset] = useState<number | null>(null);

  useEffect(() => {
    // Dismiss on keydown (Escape or any key)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.code === "Space") {
        e.preventDefault();
        setIsExploded((prev) => !prev);
      } else if (autoCloseOnActivity) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, autoCloseOnActivity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = canvas.getContext("2d");
    } catch {
      return;
    }
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
      if (ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
      }
    };
    resize();
    window.addEventListener("resize", resize);

    // Load official logo
    const logoImg = new Image();
    logoImg.src = "/logo.png";
    let logoLoaded = false;
    logoImg.onload = () => {
      logoLoaded = true;
    };

    let animFrame: number;
    let rotX = 0.28,
      rotY = 0.0,
      rotZ = 0.04;
    let targetRotX = 0.28,
      targetRotY = 0.0;
    let isDragging = false,
      lastX = 0,
      lastY = 0;
    let explodedProgress = 0;
    let vortexActive = false;
    let shockwaves: { x: number; y: number; r: number; maxR: number; op: number }[] = [];

    const ASSETS = [
      { name: "Equities", val: "₹62.3L", color: "#0284C7", rgb: [2, 132, 199], factor: 0.52, speed: 0.00065, tilt: 0.22, geom: "diamond" },
      { name: "Real Estate", val: "₹50.5L", color: "#D97706", rgb: [217, 119, 6], factor: 0.70, speed: -0.0005, tilt: -0.26, geom: "monolith" },
      { name: "Gold Bullion", val: "₹14.2L", color: "#F59E0B", rgb: [245, 158, 11], factor: 0.86, speed: 0.0004, tilt: 0.30, geom: "ingot" },
      { name: "EPF & PPF", val: "₹23.7L", color: "#059669", rgb: [5, 150, 105], factor: 1.02, speed: -0.0003, tilt: -0.16, geom: "dodecahedron" },
      { name: "Liquid Cash", val: "₹12.0L", color: "#7C3AED", rgb: [124, 58, 237], factor: 1.18, speed: 0.00025, tilt: 0.18, geom: "torus" },
    ];

    const particles = Array.from({ length: 240 }, () => ({
      rad: Math.random() * 540 + 40,
      baseRad: Math.random() * 540 + 40,
      theta: Math.random() * Math.PI * 2,
      speed: (Math.random() * 0.0006 + 0.0002) * (Math.random() > 0.5 ? 1 : -1),
      y: (Math.random() - 0.5) * 150,
      size: Math.random() * 1.8 + 0.6,
      alpha: Math.random() * 0.7 + 0.2,
      color: ["#F59E0B", "#38BDF8", "#10B981", "#A78BFA", "#FFFFFF"][Math.floor(Math.random() * 5)],
    }));

    const rotate3D = (p: [number, number, number], rx: number, ry: number, rz: number): [number, number, number] => {
      const [x, y, z] = p;
      const y1 = y * Math.cos(rx) - z * Math.sin(rx);
      const z1 = y * Math.sin(rx) + z * Math.cos(rx);
      const x2 = x * Math.cos(ry) + z1 * Math.sin(ry);
      const z2 = -x * Math.sin(ry) + z1 * Math.cos(ry);
      const x3 = x2 * Math.cos(rz) - y1 * Math.sin(rz);
      const y3 = x2 * Math.sin(rz) + y1 * Math.cos(rz);
      return [x3, y3, z2];
    };

    const project = (p: [number, number, number], fov = 750): [number, number, number, number] => {
      const scale = fov / (fov + p[2]);
      return [width / 2 + p[0] * scale, height / 2 + p[1] * scale, p[2], scale];
    };

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      isDragging = true;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      lastX = clientX;
      lastY = clientY;
      shockwaves.push({ x: clientX, y: clientY, r: 8, maxR: 350, op: 0.85 });
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      const dx = clientX - lastX;
      const dy = clientY - lastY;
      targetRotY += dx * 0.005;
      targetRotX += dy * 0.005;
      lastX = clientX;
      lastY = clientY;
    };

    const handlePointerUp = () => {
      isDragging = false;
      vortexActive = false;
    };

    const cEl = canvas;
    cEl.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", handlePointerUp);
    cEl.addEventListener("touchstart", handlePointerDown, { passive: true });
    window.addEventListener("touchmove", handlePointerMove, { passive: true });
    window.addEventListener("touchend", handlePointerUp);

    const render = (timestamp: number) => {
      animFrame = requestAnimationFrame(render);
      const time = timestamp || 0;

      if (!isDragging) {
        targetRotY += 0.0016;
        targetRotX = 0.28 + Math.sin(time * 0.0006) * 0.06;
      }

      rotX += (targetRotX - rotX) * 0.06;
      rotY += (targetRotY - rotY) * 0.06;
      explodedProgress += ((isExploded ? 1 : 0) - explodedProgress) * 0.08;

      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      // Shockwaves
      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const sw = shockwaves[i];
        sw.r += 9;
        sw.op *= 0.95;
        ctx.strokeStyle = `rgba(245, 158, 11, ${sw.op})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2);
        ctx.stroke();
        if (sw.op < 0.02 || sw.r > sw.maxR) shockwaves.splice(i, 1);
      }

      // Stardust
      particles.forEach((p) => {
        p.theta += p.speed;
        const px = Math.cos(p.theta) * p.rad;
        const pz = Math.sin(p.theta) * p.rad;
        const pRot = rotate3D([px, p.y, pz], rotX * 0.4, rotY * 0.4, rotZ);
        const [projX, projY, , scale] = project(pRot);

        if (projX >= 0 && projX <= width && projY >= 0 && projY <= height) {
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha * scale;
          ctx.beginPath();
          ctx.arc(projX, projY, p.size * scale, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }
      });

      const maxOrbRadius = Math.min(width, height) * 0.38;

      // Topographic Floor
      const gridW = 500,
        gridH = 500;
      const cols = 20,
        rows = 20;
      const stepX = gridW / cols,
        stepZ = gridH / rows;
      const baseY = 115 + explodedProgress * 45;

      ctx.save();
      ctx.strokeStyle = "rgba(148, 163, 184, 0.12)";
      ctx.lineWidth = 1;
      for (let r = 0; r <= rows; r += 2) {
        ctx.beginPath();
        for (let c = 0; c <= cols; c++) {
          const x = (c - cols / 2) * stepX;
          const z = (r - rows / 2) * stepZ;
          const wave = Math.sin(x * 0.015 + time * 0.0012) * Math.cos(z * 0.015 + time * 0.0008) * 16;
          const p = rotate3D([x, baseY + wave, z], rotX, rotY, rotZ);
          const [px, py] = project(p);
          if (c === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      ctx.restore();

      // Central 3D Medallion
      const logoR = Math.max(50, maxOrbRadius * 0.25);
      const thickness = Math.max(16, logoR * 0.28);
      const explodeY = explodedProgress * 65;
      const frontZ = thickness / 2 + explodeY;
      const backZ = -thickness / 2;
      const segments = 48;

      const normFront = rotate3D([0, 0, 1], rotX, rotY, rotZ);
      const isFrontFacing = normFront[2] < 0;

      const frontVerts: [number, number, number, number][] = [];
      const backVerts: [number, number, number, number][] = [];

      for (let i = 0; i < segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const lx = Math.cos(theta) * logoR;
        const ly = Math.sin(theta) * logoR;
        frontVerts.push(project(rotate3D([lx, ly, frontZ], rotX, rotY, rotZ)));
        backVerts.push(project(rotate3D([lx, ly, backZ], rotX, rotY, rotZ)));
      }

      const centerFront = project(rotate3D([0, 0, frontZ], rotX, rotY, rotZ));
      const centerBack = project(rotate3D([0, 0, backZ], rotX, rotY, rotZ));

      // Milled Coin Edges
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
          ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }

      // Disc Base
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
      discGrad.addColorStop(0.72, "#FFFFFF");
      discGrad.addColorStop(0.88, "#FDE68A");
      discGrad.addColorStop(0.96, "#F59E0B");
      discGrad.addColorStop(1, "#B45309");
      ctx.fillStyle = discGrad;
      ctx.fill();
      ctx.strokeStyle = "#D97706";
      ctx.lineWidth = 2.8 * activeCenter[3];
      ctx.stroke();

      // Official Logo Texture Mapping
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
        ctx.shadowColor = "rgba(15, 23, 42, 0.28)";
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 3;
        ctx.drawImage(logoImg, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
        ctx.shadowColor = "transparent";

        const sheenX = Math.sin(time * 0.0016) * logoR * 2.5;
        const sheenGrad = ctx.createLinearGradient(sheenX - 35, -logoR, sheenX + 35, logoR);
        sheenGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
        sheenGrad.addColorStop(0.48, "rgba(255, 255, 255, 0.45)");
        sheenGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = sheenGrad;
        ctx.fillRect(-logoR, -logoR, logoR * 2, logoR * 2);

        ctx.restore();
      } else if (!isFrontFacing) {
        ctx.save();
        ctx.fillStyle = "#78350F";
        ctx.font = `bold ${Math.round(14 * activeCenter[3])}px 'Outfit', sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("॥ अर्थदृष्टि ॥", activeCenter[0], activeCenter[1] - 8);
        ctx.font = `700 ${Math.round(8.5 * activeCenter[3])}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = "#B45309";
        ctx.fillText("SOVEREIGN WEALTH OS", activeCenter[0], activeCenter[1] + 12);
        ctx.restore();
      }

      // Halo Rings
      for (let k = 0; k < 3; k++) {
        const haloR = logoR * (1.24 + k * 0.22);
        ctx.beginPath();
        for (let i = 0; i <= 64; i++) {
          const theta = (i / 64) * Math.PI * 2 + k * 0.4;
          const p = rotate3D([Math.cos(theta) * haloR, 0, Math.sin(theta) * haloR], rotX, rotY, rotZ);
          const [px, py] = project(p);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = `rgba(245, 158, 11, ${0.35 - k * 0.09})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Orbiting Assets
      ASSETS.forEach((asset, idx) => {
        const orbitR = asset.factor * maxOrbRadius;
        const explodeYAsset = (idx - 2) * 35 * explodedProgress;
        const angle = time * asset.speed + (idx * (Math.PI * 2 / ASSETS.length));

        const ax = Math.cos(angle) * orbitR;
        const az = Math.sin(angle) * orbitR;
        const ay = Math.sin(angle) * (orbitR * asset.tilt * 0.5) + explodeYAsset;

        const pWorld = rotate3D([ax, ay, az], rotX, rotY, rotZ);
        const [px, py, , scale] = project(pWorld);

        // Filament
        ctx.beginPath();
        ctx.moveTo(centerFront[0], centerFront[1]);
        ctx.lineTo(px, py);
        ctx.strokeStyle = `rgba(${asset.rgb[0]}, ${asset.rgb[1]}, ${asset.rgb[2]}, 0.22)`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Node Glow
        const glow = ctx.createRadialGradient(px, py, 1, px, py, 20 * scale);
        glow.addColorStop(0, `rgba(${asset.rgb[0]}, ${asset.rgb[1]}, ${asset.rgb[2]}, 0.65)`);
        glow.addColorStop(1, "transparent");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(px, py, 20 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Node Core
        ctx.fillStyle = asset.color;
        ctx.beginPath();
        ctx.arc(px, py, 7 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1.6;
        ctx.stroke();

        // Label
        const text = asset.name;
        ctx.font = `bold ${Math.round(10.5 * scale)}px 'Outfit', sans-serif`;
        const tw = ctx.measureText(text).width;
        const pillW = tw + 14,
          pillH = 18 * scale;
        const pillX = px >= width / 2 ? px + 10 : px - 10 - pillW;
        const pillY = py - pillH / 2;

        ctx.fillStyle = "rgba(10, 15, 30, 0.88)";
        ctx.strokeStyle = `rgba(${asset.rgb[0]}, ${asset.rgb[1]}, ${asset.rgb[2]}, 0.8)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        if ("roundRect" in ctx) {
          (ctx as any).roundRect(pillX, pillY, pillW, pillH, 5);
        } else {
          ctx.rect(pillX, pillY, pillW, pillH);
        }
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(text, pillX + 7, py);
      });
    };

    animFrame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener("resize", resize);
      cEl.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
      cEl.removeEventListener("touchstart", handlePointerDown);
      window.removeEventListener("touchmove", handlePointerMove);
      window.removeEventListener("touchend", handlePointerUp);
    };
  }, [isExploded]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "#030610",
        color: "#F8FAFC",
        overflow: "hidden",
      }}
      role="dialog"
      aria-modal="true"
      aria-label="3D Celestial Screensaver"
    >
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />

      {/* Top HUD */}
      <div
        style={{
          position: "absolute",
          top: 24,
          left: 32,
          right: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pointerEvents: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "rgba(10, 16, 32, 0.78)",
            border: "1px solid rgba(245, 158, 11, 0.35)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            padding: "8px 18px 8px 10px",
            borderRadius: 999,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "#FFFFFF",
              border: "1.5px solid #F59E0B",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <img src="/logo.png" alt="ArthaDrishti" style={{ width: "90%", height: "90%", objectFit: "contain" }} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#FFFFFF", display: "flex", alignItems: "center", gap: 6 }}>
              ArthaDrishti
              <span
                style={{
                  fontSize: 9,
                  fontFamily: "monospace",
                  padding: "2px 6px",
                  borderRadius: 999,
                  background: "rgba(245, 158, 11, 0.2)",
                  color: "#FBBF24",
                  border: "1px solid rgba(245, 158, 11, 0.5)",
                }}
              >
                SOVEREIGN 3D
              </span>
            </div>
            <div style={{ fontSize: 10.5, color: "#94A3B8" }}>Private Wealth Operating System</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            onClick={() => setIsExploded((p) => !p)}
            style={{
              background: isExploded ? "#F59E0B" : "rgba(10, 16, 32, 0.78)",
              color: isExploded ? "#04060E" : "#E2E8F0",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              backdropFilter: "blur(20px)",
              padding: "8px 14px",
              borderRadius: 12,
              fontSize: 11.5,
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Maximize2 size={13} />
            <span>Exploded CAD (Space)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "rgba(10, 16, 32, 0.78)",
              color: "#E2E8F0",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              backdropFilter: "blur(20px)",
              padding: "8px 16px",
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
            aria-label="Exit Screensaver"
          >
            <X size={14} />
            <span>Exit (Esc)</span>
          </button>
        </div>
      </div>

      {/* Bottom Hint */}
      <div
        style={{
          position: "absolute",
          bottom: 24,
          left: 32,
          right: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(10, 16, 32, 0.75)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          backdropFilter: "blur(24px)",
          padding: "10px 20px",
          borderRadius: 14,
          fontSize: 11.5,
          pointerEvents: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontFamily: "monospace" }}>
          <div><span style={{ color: "#94A3B8" }}>NIFTY 50</span> <strong>24,480.25</strong> <span style={{ color: "#10B981" }}>▲ +0.64%</span></div>
          <div><span style={{ color: "#94A3B8" }}>GOLD 24K</span> <strong>₹78,640/10g</strong> <span style={{ color: "#10B981" }}>▲ +1.12%</span></div>
          <div><span style={{ color: "#94A3B8" }}>NET WORTH</span> <strong style={{ color: "#F59E0B" }}>₹1,48,50,000</strong></div>
        </div>

        <div style={{ color: "#94A3B8", display: "flex", alignItems: "center", gap: 12, fontSize: 11 }}>
          <span>Drag to Orbit</span>
          <span>•</span>
          <span>Click to Pulse</span>
          <span>•</span>
          <span style={{ color: "#FBBF24" }}>Any key or click to wake</span>
        </div>
      </div>
    </div>
  );
};

