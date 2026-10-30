import React, { useEffect, useRef, useState } from "react";

interface WealthOrbCanvasProps {
  className?: string;
  size?: number;
  interactive?: boolean;
}

interface AssetNode {
  name: string;
  amount: string;
  share: string;
  color: string;
  glowColor: string;
  ringIndex: number;
  speed: number;
  offset: number;
}

const ASSET_NODES: AssetNode[] = [
  {
    name: "Equities",
    amount: "₹62.3L",
    share: "42%",
    color: "#0284C7",
    glowColor: "rgba(2, 132, 199, 0.45)",
    ringIndex: 0,
    speed: 0.0009,
    offset: 0,
  },
  {
    name: "Real Estate",
    amount: "₹50.5L",
    share: "34%",
    color: "#D97706",
    glowColor: "rgba(217, 119, 6, 0.45)",
    ringIndex: 1,
    speed: -0.00065,
    offset: 2.1,
  },
  {
    name: "EPF & PPF",
    amount: "₹23.7L",
    share: "16%",
    color: "#059669",
    glowColor: "rgba(5, 150, 105, 0.45)",
    ringIndex: 2,
    speed: 0.0005,
    offset: 4.2,
  },
  {
    name: "Gold & SGB",
    amount: "₹14.2L",
    share: "10%",
    color: "#B45309",
    glowColor: "rgba(180, 83, 9, 0.45)",
    ringIndex: 1,
    speed: -0.00065,
    offset: 5.3,
  },
  {
    name: "Liquid Cash",
    amount: "₹12.0L",
    share: "8%",
    color: "#7C3AED",
    glowColor: "rgba(124, 58, 237, 0.45)",
    ringIndex: 0,
    speed: 0.0009,
    offset: 3.14,
  },
];

// Ring definitions in radians
const RINGS = [
  { pitch: 0.38, yaw: 0.48, roll: 0.12, radius: 105, stroke: "rgba(2, 132, 199, 0.3)" },
  { pitch: -0.46, yaw: -0.36, roll: 0.2, radius: 138, stroke: "rgba(217, 119, 6, 0.35)" },
  { pitch: 0.62, yaw: -0.58, roll: -0.18, radius: 168, stroke: "rgba(5, 150, 105, 0.28)" },
];

export const WealthOrbCanvas: React.FC<WealthOrbCanvasProps> = ({
  className = "",
  size = 380,
  interactive = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hasError, setHasError] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<{ node: AssetNode; x: number; y: number } | null>(
    null
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = canvas.getContext("2d");
    } catch {
      setHasError(true);
      return;
    }
    if (!ctx) {
      setHasError(true);
      return;
    }

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Load ArthaDrishti official emblem image
    const logoImg = new Image();
    logoImg.src = "/logo.png";
    let logoLoaded = false;
    logoImg.onload = () => {
      logoLoaded = true;
    };

    let animFrameId: number;
    let isVisible = true;
    let isIntersecting = true;

    let width = size;
    let height = size;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      if (!canvas || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const currentWidth = Math.max(220, Math.min(size, rect.width || size));
      width = currentWidth;
      height = currentWidth;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    resize();

    // 3D Rotations & Parallax State
    // Floating oscillation limits: medallion ALWAYS faces forward upright (never flips edge-on or into a bar)
    let rotX = 0.16;
    let rotY = 0;
    const rotZ = 0.04;
    let targetRotX = 0;
    let targetRotY = 0;
    let mouseX = -9999;
    let mouseY = -9999;
    let time = 0;

    // Ambient floating stardust particles (warm gold & indigo tones)
    const particleCount = 28;
    const particles = Array.from({ length: particleCount }, () => ({
      x: (Math.random() - 0.5) * 360,
      y: (Math.random() - 0.5) * 360,
      z: (Math.random() - 0.5) * 360,
      size: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.4 + 0.15,
    }));

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!interactive || prefersReducedMotion) return;
      const rect = canvas.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      mouseX = clientX - rect.left;
      mouseY = clientY - rect.top;

      const normX = (mouseX - width / 2) / (width / 2);
      const normY = (mouseY - height / 2) / (height / 2);

      // Max responsive tilt constrained to +/- 14 degrees for elegant stability
      targetRotY = Math.max(-0.25, Math.min(0.25, normX * 0.28));
      targetRotX = Math.max(-0.18, Math.min(0.18, -normY * 0.2));
    };

    const handlePointerLeave = () => {
      targetRotX = 0;
      targetRotY = 0;
      mouseX = -9999;
      mouseY = -9999;
      setHoveredNode(null);
    };

    window.addEventListener("mousemove", handlePointerMove, { passive: true });
    window.addEventListener("mouseleave", handlePointerLeave);
    const containerEl = containerRef.current;
    if (containerEl) {
      containerEl.addEventListener("touchmove", handlePointerMove, { passive: true });
    }

    // 3D Math Helper Functions
    const rotate3D = (
      p: [number, number, number],
      rx: number,
      ry: number,
      rz: number
    ): [number, number, number] => {
      const [x, y, z] = p;
      const y1 = y * Math.cos(rx) - z * Math.sin(rx);
      const z1 = y * Math.sin(rx) + z * Math.cos(rx);
      const x2 = x * Math.cos(ry) + z1 * Math.sin(ry);
      const z2 = -x * Math.sin(ry) + z1 * Math.cos(ry);
      const x3 = x2 * Math.cos(rz) - y1 * Math.sin(rz);
      const y3 = x2 * Math.sin(rz) + y1 * Math.cos(rz);
      return [x3, y3, z2];
    };

    const project = (p: [number, number, number], fov = 460): [number, number, number, number] => {
      const scale = fov / (fov + p[2]);
      return [width / 2 + p[0] * scale, height / 2 + p[1] * scale, p[2], scale];
    };

    const render = (timestamp: number) => {
      time = timestamp || 0;

      // Gentle, majestic breathing tilt (max +/- 12° harmonic oscillation).
      // The ArthaDrishti logo is ALWAYS facing towards the user and never flips edge-on or into a stick.
      const floatAngleY = prefersReducedMotion ? 0 : Math.sin(time * 0.001) * 0.18;
      const floatAngleX = prefersReducedMotion ? 0 : Math.cos(time * 0.0008) * 0.08;

      rotX += (targetRotX + 0.16 + floatAngleX - rotX) * 0.08;
      rotY += (targetRotY + floatAngleY - rotY) * 0.08;

      ctx.clearRect(0, 0, width, height);

      // 1. Subtle warm ambient center radial wash
      const ambientGlow = ctx.createRadialGradient(
        width / 2,
        height / 2,
        5,
        width / 2,
        height / 2,
        170
      );
      ambientGlow.addColorStop(0, "rgba(79, 70, 229, 0.05)");
      ambientGlow.addColorStop(0.5, "rgba(217, 119, 6, 0.035)");
      ambientGlow.addColorStop(1, "transparent");
      ctx.fillStyle = ambientGlow;
      ctx.fillRect(0, 0, width, height);

      // 2. Render Floating Stardust
      particles.forEach((pt) => {
        const rot = rotate3D([pt.x, pt.y, pt.z], rotX * 0.5, rotY * 0.5, rotZ);
        const [px, py, , scale] = project(rot);
        ctx.fillStyle = `rgba(180, 83, 9, ${pt.alpha * scale})`;
        ctx.beginPath();
        ctx.arc(px, py, pt.size * scale, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Render 3 Gyroscopic Orbit Rings with Horology Ticks
      RINGS.forEach((ring) => {
        ctx.beginPath();
        const steps = 72;
        let first = true;
        for (let i = 0; i <= steps; i++) {
          const theta = (i / steps) * Math.PI * 2;
          const rx = Math.cos(theta) * ring.radius;
          const rz = Math.sin(theta) * ring.radius;
          const pLocal = rotate3D([rx, 0, rz], ring.pitch, ring.yaw, ring.roll);
          const pWorld = rotate3D(pLocal, rotX, rotY, rotZ);
          const [px, py] = project(pWorld);
          if (first) {
            ctx.moveTo(px, py);
            first = false;
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.strokeStyle = ring.stroke;
        ctx.lineWidth = 1.3;
        ctx.stroke();

        // Swiss Horology Tick Marks along rings
        for (let j = 0; j < 12; j++) {
          const theta = (j / 12) * Math.PI * 2;
          const rInner = ring.radius - 2.5;
          const rOuter = ring.radius + 2.5;
          const p1 = rotate3D(
            rotate3D([Math.cos(theta) * rInner, 0, Math.sin(theta) * rInner], ring.pitch, ring.yaw, ring.roll),
            rotX,
            rotY,
            rotZ
          );
          const p2 = rotate3D(
            rotate3D([Math.cos(theta) * rOuter, 0, Math.sin(theta) * rOuter], ring.pitch, ring.yaw, ring.roll),
            rotX,
            rotY,
            rotZ
          );
          const [x1, y1] = project(p1);
          const [x2, y2] = project(p2);
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = "rgba(100, 116, 139, 0.35)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });

      // 4. Render 3D Volumetric ArthaDrishti Logo Medallion (100% Upright)
      const logoRadius = 54;
      const logoThickness = 14;
      const segments = 42;

      const frontVerts: [number, number, number, number][] = [];
      const backVerts: [number, number, number, number][] = [];

      for (let i = 0; i < segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const lx = Math.cos(theta) * logoRadius;
        const ly = Math.sin(theta) * logoRadius;

        const pF = rotate3D([lx, ly, logoThickness / 2], rotX, rotY, rotZ);
        const pB = rotate3D([lx, ly, -logoThickness / 2], rotX, rotY, rotZ);

        frontVerts.push(project(pF));
        backVerts.push(project(pB));
      }

      const centerFront = project(rotate3D([0, 0, logoThickness / 2], rotX, rotY, rotZ));

      // Golden Beveled Coin Rim Quads
      for (let i = 0; i < segments; i++) {
        const next = (i + 1) % segments;
        const f1 = frontVerts[i],
          f2 = frontVerts[next];
        const b1 = backVerts[i],
          b2 = backVerts[next];

        const ux = f2[0] - f1[0],
          uy = f2[1] - f1[1];
        const vx = b1[0] - f1[0],
          vy = b1[1] - f1[1];
        const rimNormalZ = ux * vy - uy * vx;

        if (rimNormalZ > 0) {
          ctx.beginPath();
          ctx.moveTo(f1[0], f1[1]);
          ctx.lineTo(f2[0], f2[1]);
          ctx.lineTo(b2[0], b2[1]);
          ctx.lineTo(b1[0], b1[1]);
          ctx.closePath();

          const shade = Math.max(0.35, Math.min(0.95, rimNormalZ / 600 + 0.42));
          ctx.fillStyle = `rgb(${Math.round(217 * shade)}, ${Math.round(119 * shade)}, ${Math.round(6 * shade)})`;
          ctx.fill();
          ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }

      // Front Face Disc Base & Emblem Texture (Correct Upright Mapping)
      const pRight = project(rotate3D([logoRadius, 0, logoThickness / 2], rotX, rotY, rotZ));
      const pBottom = project(rotate3D([0, logoRadius, logoThickness / 2], rotX, rotY, rotZ));

      const dxX = (pRight[0] - centerFront[0]) / logoRadius;
      const dxY = (pRight[1] - centerFront[1]) / logoRadius;
      const dyX = (pBottom[0] - centerFront[0]) / logoRadius;
      const dyY = (pBottom[1] - centerFront[1]) / logoRadius;

      ctx.beginPath();
      frontVerts.forEach((v, i) => {
        if (i === 0) ctx.moveTo(v[0], v[1]);
        else ctx.lineTo(v[0], v[1]);
      });
      ctx.closePath();

      const discGrad = ctx.createRadialGradient(
        centerFront[0],
        centerFront[1],
        2,
        centerFront[0],
        centerFront[1],
        logoRadius * centerFront[3]
      );
      discGrad.addColorStop(0, "#FFFFFF");
      discGrad.addColorStop(0.72, "#F8FAFC");
      discGrad.addColorStop(0.95, "#D4AF37");
      discGrad.addColorStop(1, "#B45309");
      ctx.fillStyle = discGrad;
      ctx.fill();
      ctx.strokeStyle = "#D4AF37";
      ctx.lineWidth = 2 * centerFront[3];
      ctx.stroke();

      if (logoLoaded) {
        ctx.save();
        ctx.beginPath();
        frontVerts.forEach((v, i) => {
          if (i === 0) ctx.moveTo(v[0], v[1]);
          else ctx.lineTo(v[0], v[1]);
        });
        ctx.closePath();
        ctx.clip();

        // 3D Perspective affine transform (Upright)
        ctx.transform(dxX, dxY, dyX, dyY, centerFront[0], centerFront[1]);
        const drawSize = logoRadius * 1.9;
        ctx.drawImage(logoImg, -drawSize / 2, -drawSize / 2, drawSize, drawSize);

        // Specular light sheen sweep across emblem
        const sheenX = Math.sin(time * 0.0016) * logoRadius * 2.2;
        const sheenGrad = ctx.createLinearGradient(
          sheenX - 30,
          -logoRadius,
          sheenX + 30,
          logoRadius
        );
        sheenGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
        sheenGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.45)");
        sheenGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = sheenGrad;
        ctx.fillRect(-logoRadius, -logoRadius, logoRadius * 2, logoRadius * 2);

        ctx.restore();
      }

      // 5. Render Orbiting Asset Satellites with Hover Telemetry
      let closestNode: { node: AssetNode; px: number; py: number } | null = null;
      let minDistance = 9999;

      ASSET_NODES.forEach((node) => {
        const ring = RINGS[node.ringIndex];
        const angle = time * node.speed + node.offset;
        const rx = Math.cos(angle) * ring.radius;
        const rz = Math.sin(angle) * ring.radius;
        const pLocal = rotate3D([rx, 0, rz], ring.pitch, ring.yaw, ring.roll);
        const pWorld = rotate3D(pLocal, rotX, rotY, rotZ);
        const [px, py, , scale] = project(pWorld);

        const d = Math.hypot(px - mouseX, py - mouseY);
        if (d < 26 && d < minDistance) {
          minDistance = d;
          closestNode = { node, px, py };
        }

        const glow = ctx.createRadialGradient(px, py, 1, px, py, 16 * scale);
        glow.addColorStop(0, node.glowColor);
        glow.addColorStop(1, "transparent");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(px, py, 16 * scale, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(px, py, 6 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1.5 * scale;
        ctx.stroke();

        const isRightSide = px >= width / 2;
        const labelX = isRightSide ? px + 10 : px - 10;
        ctx.textAlign = isRightSide ? "left" : "right";
        ctx.fillStyle = "#0F172A";
        ctx.font = `700 ${Math.round(11 * scale)}px 'Plus Jakarta Sans', sans-serif`;
        ctx.fillText(node.name, labelX, py - 3);
      });

      if (closestNode) {
        setHoveredNode({
          node: closestNode.node,
          x: closestNode.px,
          y: closestNode.py,
        });
      } else if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) {
        setHoveredNode(null);
      }

      if (!prefersReducedMotion && isVisible && isIntersecting) {
        animFrameId = requestAnimationFrame(render);
      }
    };

    // Visibility & Intersection Observers
    const handleVisibility = () => {
      isVisible = !document.hidden;
      if (isVisible && isIntersecting && !prefersReducedMotion) {
        animFrameId = requestAnimationFrame(render);
      } else {
        cancelAnimationFrame(animFrameId);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    let observer: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          isIntersecting = entries[0].isIntersecting;
          if (isIntersecting && isVisible && !prefersReducedMotion) {
            animFrameId = requestAnimationFrame(render);
          } else {
            cancelAnimationFrame(animFrameId);
          }
        },
        { threshold: 0.05 }
      );
      observer.observe(canvas);
    }

    window.addEventListener("resize", resize);
    animFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseleave", handlePointerLeave);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (observer) observer.disconnect();
    };
  }, [interactive, size]);

  if (hasError) {
    return (
      <div
        className={`af-orb-container ${className}`}
        style={{
          width: "100%",
          maxWidth: size,
          aspectRatio: "1/1",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src="/logo.png"
          alt="ArthaDrishti Emblem"
          style={{ width: "60%", height: "60%", objectFit: "contain" }}
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`af-orb-container ${className}`}
      style={{
        width: "100%",
        maxWidth: size,
        aspectRatio: "1/1",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      role="img"
      aria-label="Interactive 3D Sovereign ArthaDrishti Emblem and Equilibrium Matrix"
    >
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          touchAction: "none",
          width: "100%",
          height: "100%",
        }}
      />

      {hoveredNode && (
        <div
          style={{
            position: "absolute",
            left: hoveredNode.x,
            top: hoveredNode.y,
            transform: "translate(-50%, -125%)",
            pointerEvents: "none",
            backgroundColor: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: "14px",
            padding: "8px 12px",
            boxShadow: "0 12px 30px rgba(15, 23, 42, 0.12)",
            zIndex: 30,
            whiteSpace: "nowrap",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "2px",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: hoveredNode.node.color,
                display: "inline-block",
              }}
            />
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#0F172A",
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              {hoveredNode.node.name}
            </span>
            <span
              style={{
                fontSize: "10px",
                padding: "1px 5px",
                borderRadius: "4px",
                backgroundColor: "#F1F5F9",
                color: "#334155",
                fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {hoveredNode.node.share}
            </span>
          </div>
          <div
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "#0F172A",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {hoveredNode.node.amount}
          </div>
        </div>
      )}
    </div>
  );
};
