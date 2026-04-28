"use client";

import { useEffect, useRef } from "react";
import { Particle, Variant, VARIANT_COLORS, VARIANT_SYMBOLS, VARIANT_BG, DEFAULT_VARIANT } from "@/constants/BackgroundVariants";

const COUNT = 40;
const MOUSE_RADIUS = 120;
const REPULSION_FORCE = 2;

export default function PokerBackground({
  variant = DEFAULT_VARIANT,
}: {
  variant?: Variant;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const symbols = VARIANT_SYMBOLS[variant];
    const colors = VARIANT_COLORS[variant];
    const bg = VARIANT_BG[variant];

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    };
    const onMouseLeave = () => {
      mouseRef.current.x = -9999;
      mouseRef.current.y = -9999;
    };
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);

    function makeParticle(): Particle {
      const suit = symbols[Math.floor(Math.random() * symbols.length)];
      const baseOpacity = 0.04 + Math.random() * 0.1;
      return {
        x: Math.random() * canvas!.width,
        y: Math.random() * canvas!.height,
        size: 40 + Math.random() * 28,
        suit,
        color: colors[suit],
        speed: 0.15 + Math.random() * 0.35,
        baseOpacity,
        opacity: baseOpacity,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.005,
        drift: (Math.random() - 0.5) * 0.3,
        vx: 0,
        vy: 0,
      };
    }

    const particles: Particle[] = Array.from({ length: COUNT }, makeParticle);

    let animId: number;
    const draw = () => {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (const p of particles) {
        const dx = p.x - mx;
        const dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < MOUSE_RADIUS && dist > 0) {
          const force = (1 - dist / MOUSE_RADIUS) * REPULSION_FORCE;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
          p.opacity = Math.min(p.baseOpacity + 0.15 * (1 - dist / MOUSE_RADIUS), 0.35);
        } else {
          p.opacity += (p.baseOpacity - p.opacity) * 0.05;
        }

        p.x += p.drift + p.vx;
        p.y -= p.speed + p.vy * -1;
        p.vx *= 0.92;
        p.vy *= 0.92;
        p.rotation += p.rotSpeed;

        if (p.y < -p.size) {
          p.y = canvas.height + p.size;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < -p.size) p.x = canvas.width + p.size;
        if (p.x > canvas.width + p.size) p.x = -p.size;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.font = `${p.size}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(p.suit, 0, 0);
        ctx.restore();
      }

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [variant]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full z-0"
    />
  );
}
