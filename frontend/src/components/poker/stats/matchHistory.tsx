"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { io, Socket } from "socket.io-client";

type HistoryEntry = {
  id: string;
  playedAt: string;
  mode: string;
  result: "WIN" | "LOSS" | "PENDING";
  opponent: { name: string; image: string | null } | null;
  score: number | null;
};

type HistoryResponse = {
  matches: HistoryEntry[];
};

export default function MatchHistory() {
  const { data: session, status } = useSession();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;

    async function loadHistory() {
      setHistoryLoading(true);
      setHistoryError("");
      try {
        const res = await fetch("/api/poker/history", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load history");
        const data = (await res.json()) as HistoryResponse;
        if (cancelled) return;
        setHistory(Array.isArray(data.matches) ? data.matches : []);
      } catch {
        if (cancelled) return;
        setHistoryError("Could not load match history");
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    }

    void loadHistory();

    const username = session?.user?.name;
    const socket: Socket | null = username ? io() : null;
    if (socket && username) {
      socket.emit("subscribeMatchHistory", { username });
      socket.on("matchHistoryUpdated", () => {
        if (!cancelled) void loadHistory();
      });
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") void loadHistory();
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
    <>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-slate-300 font-medium">Match History</p>
      </div>

      <div
        className="overflow-y-auto border border-white/10 rounded-xl [scrollbar-width:thin] [scrollbar-color:rgb(71_85_105)_rgba(255,255,255,0.06)] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-white/5 [&::-webkit-scrollbar-track]:rounded-r-xl [&::-webkit-scrollbar-thumb]:bg-slate-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-clip-padding [&::-webkit-scrollbar-thumb:hover]:bg-slate-500"
        style={{ maxHeight: "calc(5 * 41px + 37px)" }}
      >
        {historyLoading ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm">Loading...</div>
        ) : historyError ? (
          <div className="h-full flex items-center justify-center text-red-300 text-sm px-4 text-center">{historyError}</div>
        ) : history.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-sm">No matches yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-black/70 backdrop-blur-sm">
              <tr className="text-slate-400 text-[11px] uppercase tracking-wide">
                <th className="text-left px-3 py-2 font-medium">Opponent</th>
                <th className="text-left px-3 py-2 font-medium">Date</th>
                <th className="text-right px-3 py-2 font-medium">Result</th>
              </tr>
            </thead>
            <tbody>
              {history.map((m) => (
                <tr key={m.id} className="border-t border-white/5 text-slate-200">
                  <td className="px-3 py-2 truncate max-w-[120px]">{m.opponent?.name ?? "-"}</td>
                  <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{new Date(m.playedAt).toLocaleDateString()}</td>
                  <td className={`px-3 py-2 text-right font-medium ${m.result === "WIN" ? "text-emerald-300" : m.result === "LOSS" ? "text-rose-300" : "text-slate-400"}`}>
                    {m.result}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
