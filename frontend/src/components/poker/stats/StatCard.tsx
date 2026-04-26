"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

type Color = "green" | "red" | "gold" | "purple" | "blue";

interface StatCardProps {
  label: string;
  value: ReactNode;
  sub?: string;
  icon: ReactNode;
  color: Color;
  delay?: number;
}

const colorMap: Record<Color, { iconBg: string; iconText: string; valueColor: string }> = {
  green:  { iconBg: "rgba(34,197,94,0.12)",   iconText: "#4ade80", valueColor: "#4ade80" },
  red:    { iconBg: "rgba(239,68,68,0.12)",   iconText: "#f87171", valueColor: "#f87171" },
  gold:   { iconBg: "rgba(234,179,8,0.12)",   iconText: "#facc15", valueColor: "#facc15" },
  purple: { iconBg: "rgba(129,140,248,0.12)", iconText: "#a78bfa", valueColor: "#e2e8f0" },
  blue:   { iconBg: "rgba(59,130,246,0.12)",  iconText: "#60a5fa", valueColor: "#e2e8f0" },
};

export default function StatCard({ label, value, sub, icon, color, delay = 0 }: StatCardProps) {
  const c = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      style={{
        background: "#1c1c22",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "12px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        cursor: "default",
        transition: "transform 0.2s, box-shadow 0.2s",
        minWidth: 0,
        height: "100%",
        boxSizing: "border-box",
      }}
      whileHover={{ y: -2 }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#64748b" }}>
          {label}
        </span>
        <span style={{
          width: 32, height: 32, borderRadius: 8,
          background: c.iconBg, color: c.iconText,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16,
        }}>
          {icon}
        </span>
      </div>

      <div style={{ fontSize: "28px", fontWeight: 700, lineHeight: 1, color: c.valueColor, fontFamily: "var(--font-barlow, sans-serif)" }}>
        {value}
      </div>

      {sub && (
        <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>{sub}</p>
      )}
    </motion.div>
  );
}
