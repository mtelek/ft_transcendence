"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  size: number;
  suit: string;
  color: string;
  speed: number;
  baseOpacity: number;
  opacity: number;
  rotation: number;
  rotSpeed: number;
  drift: number;
  // repulsion velocity
  vx: number;
  vy: number;
}

const SUITS = ["♠", "♥", "♦", "♣"] as const;
const SUIT_COLORS: Record<string, string> = {
  "♠": "#c8d6e5",
  "♥": "#e74c3c",
  "♦": "#e74c3c",
  "♣": "#c8d6e5",
};
const COUNT = 40;
const MOUSE_RADIUS = 120;
const REPULSION_FORCE = 2;

export default function PokerBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

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
      const suit = SUITS[Math.floor(Math.random() * 4)];
      const baseOpacity = 0.04 + Math.random() * 0.1;
      return {
        x: Math.random() * canvas!.width,
        y: Math.random() * canvas!.height,
        size: 40 + Math.random() * 28,
        suit,
        color: SUIT_COLORS[suit],
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
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (const p of particles) {
        // Mouse repulsion
        const dx = p.x - mx;
        const dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < MOUSE_RADIUS && dist > 0) {
          const force = (1 - dist / MOUSE_RADIUS) * REPULSION_FORCE;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
          // Brighten on proximity
          p.opacity = Math.min(p.baseOpacity + 0.15 * (1 - dist / MOUSE_RADIUS), 0.35);
        } else {
          // Decay back to base opacity
          p.opacity += (p.baseOpacity - p.opacity) * 0.05;
        }

        // Apply velocity with friction
        p.x += p.drift + p.vx;
        p.y -= p.speed + p.vy * -1;
        p.vx *= 0.92;
        p.vy *= 0.92;
        p.rotation += p.rotSpeed;

        // Wrap edges
        if (p.y < -p.size) {
          p.y = canvas.height + p.size;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < -p.size) p.x = canvas.width + p.size;
        if (p.x > canvas.width + p.size) p.x = -p.size;

        // Draw
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
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
    />
  );
}
