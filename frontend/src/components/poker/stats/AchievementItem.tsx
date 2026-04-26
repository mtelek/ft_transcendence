"use client";

import { motion } from "framer-motion";
import type { Achievement } from "@/lib/poker-stats/mockData";

interface Props {
  achievement: Achievement;
  index: number;
}

export default function AchievementItem({ achievement, index }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: 0.15 + index * 0.07 }}
      className="flex items-center gap-3 py-3 border-b border-white/[0.05] last:border-0 group"
    >
      {/* Icon badge */}
      <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-lg shrink-0 group-hover:bg-yellow-500/15 transition-colors">
        {achievement.icon}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-200 truncate">{achievement.title}</p>
        <p className="text-[11px] text-slate-500 truncate">{achievement.description}</p>
      </div>

      {/* Status + date */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        {achievement.completed && (
          <span className="text-[10px] font-bold tracking-wider uppercase text-green-400 bg-green-500/10 px-2 py-0.5 rounded-md">
            Completed
          </span>
        )}
        <span className="text-[10px] text-slate-600">{achievement.date}</span>
      </div>
    </motion.div>
  );
}
