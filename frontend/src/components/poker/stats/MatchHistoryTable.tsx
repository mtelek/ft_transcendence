"use client";

import { motion } from "framer-motion";
import type { MatchEntry } from "@/lib/poker-stats/mockData";

interface Props {
  matches: MatchEntry[];
}

const thStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "#475569",
  padding: "0 12px 10px 0",
  textAlign: "left",
  whiteSpace: "nowrap",
};

export default function MatchHistoryTable({ matches }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Section header */}
      <div style={{ marginBottom: 16 }}>
        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94a3b8" }}>
          Match History
        </span>
      </div>

      {/* Table */}
      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
        <colgroup>
          <col style={{ width: "55px" }} />
          <col style={{ width: "160px" }} />
          <col />
          <col style={{ width: "72px" }} />
          <col style={{ width: "60px" }} />
        </colgroup>

        <thead>
          <tr>
            <th style={thStyle}>Mode</th>
            <th style={thStyle}>Opponent</th>
            <th style={thStyle}>Date</th>
            <th style={thStyle}>Result</th>
            <th style={{ ...thStyle, textAlign: "right" }}>Score</th>
          </tr>
        </thead>

        <tbody>
          {matches.map((m, i) => (
            <motion.tr
              key={m.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + i * 0.06 }}
              style={{ borderRadius: 8, cursor: "default" }}
              onMouseOver={e => {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
              }}
              onMouseOut={e => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <td style={{ padding: "9px 12px 9px 0", fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>
                {m.mode}
              </td>

              <td style={{ padding: "9px 12px 9px 0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%",
                    background: "#334155", overflow: "hidden", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700, color: "#94a3b8",
                  }}>
                    {m.opponent.name[0].toUpperCase()}
                  </div>
                  <span style={{ fontSize: 12, color: "#cbd5e1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {m.opponent.name}
                  </span>
                </div>
              </td>

              <td style={{ padding: "9px 12px 9px 0", fontSize: 11, color: "#475569", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {m.date}
              </td>

              <td style={{ padding: "9px 12px 9px 0" }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: "0.05em",
                  padding: "2px 8px", borderRadius: 6,
                  background: m.result === "WIN" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                  color: m.result === "WIN" ? "#4ade80" : "#f87171",
                  display: "inline-block",
                }}>
                  {m.result}
                </span>
              </td>

              <td style={{ padding: "9px 0", textAlign: "right", fontSize: 12, fontWeight: 700, color: m.score > 0 ? "#4ade80" : "#f87171", fontFamily: "var(--font-barlow, sans-serif)" }}>
                {m.score > 0 ? `+${m.score}` : m.score}
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
