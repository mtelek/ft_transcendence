"use client";

import { motion } from "framer-motion";
import type { Progression } from "@/lib/poker-stats/mockData";

interface Props {
  progression: Progression;
}

export default function ProgressionPanel({ progression }: Props) {
  const { level, currentXP, maxXP, nextReward, nextRewardXP } = progression;
  const xpPercent = Math.round((currentXP / maxXP) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      style={{ display: "flex", alignItems: "center", gap: 20 }}
    >
      {/* Level badge */}
      <div style={{ position: "relative", width: 64, height: 64, flexShrink: 0 }}>
        <svg viewBox="0 0 64 64" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
          <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
          <circle
            cx="32" cy="32" r="28"
            fill="none"
            stroke="#c9a227"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 28}`}
            strokeDashoffset={`${2 * Math.PI * 28 * (1 - xpPercent / 100)}`}
            style={{ transition: "stroke-dashoffset 0.7s ease" }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 10, color: "#64748b", lineHeight: 1 }}>LVL</span>
          <span style={{ fontSize: 22, fontWeight: 700, color: "#facc15", lineHeight: 1.1, fontFamily: "var(--font-barlow, sans-serif)" }}>
            {level}
          </span>
        </div>
      </div>

      {/* XP info */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div>
          <p style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>
            {currentXP.toLocaleString()} / {maxXP.toLocaleString()} XP
          </p>
          <div style={{ width: 160, height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 999, overflow: "hidden" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpPercent}%` }}
              transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
              style={{ height: "100%", borderRadius: 999, background: "linear-gradient(90deg, #eab308, #fde68a)" }}
            />
          </div>
        </div>
        <div>
          <p style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em" }}>Next Reward</p>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#cbd5e1" }}>{nextReward}</p>
          <p style={{ fontSize: 10, color: "#eab308" }}>{nextRewardXP.toLocaleString()} XP</p>
        </div>
      </div>
    </motion.div>
  );
}
