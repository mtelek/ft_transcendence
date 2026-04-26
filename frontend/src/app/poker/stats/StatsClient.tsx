"use client";

import { Barlow_Condensed } from "next/font/google";
import Link from "next/link";
import { motion } from "framer-motion";

import StatCard from "@/components/poker/stats/StatCard";
import MatchHistoryTable from "@/components/poker/stats/MatchHistoryTable";
import AchievementItem from "@/components/poker/stats/AchievementItem";
import ProgressionPanel from "@/components/poker/stats/ProgressionPanel";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import PokerBackground from "@/components/PokerBackground";

import {
  playerStats,
  matchHistory,
  achievements,
  progression,
} from "@/lib/poker-stats/mockData";

const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-barlow",
  display: "swap",
});

interface Props {
  username: string;
  image: string;
}

export default function StatsClient({ username, image }: Props) {
  return (
    <div className={`${barlow.variable} relative min-h-screen bg-slate-900 text-white`}>
      <PokerBackground />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {/* ── Header ── */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex items-center justify-between"
        >
          <span
            className="text-4xl font-bold tracking-tight text-yellow-400"
            style={{ fontFamily: "var(--font-barlow)" }}
          >
            STATISTICS
          </span>

          <div className="flex items-center gap-3">
            {/* User info */}
            <div className="hidden sm:flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-700 ring-2 ring-white/10">
                <PlayerAvatar src={image} fallback={username} className="w-8 h-8 rounded-full" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold text-slate-200">{username}</span>
                <span className="text-[10px] text-yellow-500 font-medium">{playerStats.rank} · {playerStats.elo} ELO</span>
              </div>
            </div>

            {/* Start game */}
            <Link
              href="/poker/lobby"
              style={{
                fontFamily: "var(--font-barlow)",
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 28px",
                borderRadius: 10,
                background: "#eab308",
                color: "#000",
                fontWeight: 700,
                fontSize: 17,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                textDecoration: "none",
                boxShadow: "0 0 24px rgba(202,138,4,0.35), 0 2px 8px rgba(0,0,0,0.4)",
                transition: "box-shadow 0.2s, transform 0.15s",
              }}
              onMouseOver={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = "0 0 40px rgba(202,138,4,0.6), 0 4px 16px rgba(0,0,0,0.5)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
              }}
              onMouseOut={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = "0 0 24px rgba(202,138,4,0.35), 0 2px 8px rgba(0,0,0,0.4)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              }}
            >
              ▶ Start Game
            </Link>
          </div>
        </motion.header>

        {/* ── Stat Cards Row ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px", alignItems: "stretch" }}>
          <StatCard
            label="Wins"
            value={playerStats.wins}
            sub={`${playerStats.winRate}% Win Rate`}
            icon="🏆"
            color="green"
            delay={0.05}
          />
          <StatCard
            label="Losses"
            value={playerStats.losses}
            sub={`${100 - playerStats.winRate}% Lose Rate`}
            icon="💀"
            color="red"
            delay={0.1}
          />
          <StatCard
            label="Rank"
            value={playerStats.rank}
            sub={`${playerStats.elo} ELO · Top ${playerStats.percentile}%`}
            icon="👑"
            color="gold"
            delay={0.15}
          />
          <StatCard
            label="1v1 Record"
            value={`${playerStats.record1v1.wins} – ${playerStats.record1v1.losses}`}
            sub={`${playerStats.record1v1.winRate}% Win Rate`}
            icon="⚔️"
            color="purple"
            delay={0.2}
          />
          {/* Progression card — replaces Total Games */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25, ease: "easeOut" }}
            style={{ background: "#1c1c22", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", gap: 12, height: "100%", boxSizing: "border-box" }}
          >
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#64748b" }}>
              Progression
            </span>
            <ProgressionPanel progression={progression} />
          </motion.div>
        </div>

        {/* ── Body: Match History + Achievements ── */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "stretch" }}>
          {/* Match History */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            style={{ background: "#1c1c22", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 20, flex: "1 1 480px", minWidth: 0 }}
          >
            <MatchHistoryTable matches={matchHistory} />
          </motion.div>

          {/* Achievements */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            style={{ background: "#1c1c22", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 20, flex: "0 0 auto", minWidth: 280 }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94a3b8" }}>
                Achievements
              </span>
              <button
                style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#475569", background: "none", border: "none", cursor: "pointer" }}
                onMouseOver={e => (e.currentTarget.style.color = "#facc15")}
                onMouseOut={e => (e.currentTarget.style.color = "#475569")}
              >
                View All
              </button>
            </div>
            <div>
              {achievements.map((a, i) => (
                <AchievementItem key={a.id} achievement={a} index={i} />
              ))}
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
