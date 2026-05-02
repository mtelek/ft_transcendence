"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { io, Socket } from "socket.io-client";

type HistoryResponse = {
  wins: number;
  losses: number;
};

export default function Statistics() {
  const { data: session, status } = useSession();
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;

    async function loadStats() {
      try {
        const res = await fetch("/api/poker/history", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load stats");
        const data = (await res.json()) as HistoryResponse;
        if (cancelled) return;
        setWins(data.wins ?? 0);
        setLosses(data.losses ?? 0);
      } catch {
        if (cancelled) return;
        setWins(0);
        setLosses(0);
      }
    }

    void loadStats();

    const username = session?.user?.name;
    const socket: Socket | null = username ? io() : null;
    if (socket && username) {
      socket.emit("subscribeMatchHistory", { username });
      socket.on("matchHistoryUpdated", () => {
        if (!cancelled) void loadStats();
      });
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") void loadStats();
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (socket && username) {
        socket.emit("unsubscribeMatchHistory", { username });
        socket.disconnect();
      }
    };
  }, [status, session?.user?.name]);

  return (
    <div className="grid grid-cols-2 gap-3 mb-4">
      <div className="border border-white/10 rounded-xl p-3">
        <p className="text-[11px] uppercase tracking-widest text-slate-400">Wins</p>
        <p className="text-2xl font-semibold text-white leading-tight">{wins}</p>
      </div>
      <div className="border border-white/10 rounded-xl p-3">
        <p className="text-[11px] uppercase tracking-widest text-slate-400">Losses</p>
        <p className="text-2xl font-semibold text-white leading-tight">{losses}</p>
      </div>
    </div>
  );
}
