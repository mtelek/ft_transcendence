"use client";

import { useEffect, useState } from "react";

const FRIENDS_CHANGED_EVENT = "friends:changed";
const LEADERBOARD_REFRESH_MS = 5000;

type LeaderboardEntry = {
  id: string;
  name: string;
  image: string | null;
  wins: number;
};

type LeaderboardResponse = {
  friends: LeaderboardEntry[];
  global: LeaderboardEntry[];
};

type FriendsResponse = {
  friends?: Array<{ id: string }>;
};

function buildFriendSignature(friendIds: string[]) {
  return [...friendIds].sort().join("|");
}

function sortByWinsThenName(a: LeaderboardEntry, b: LeaderboardEntry) {
  if (b.wins !== a.wins) return b.wins - a.wins;
  return a.name.localeCompare(b.name);
}

function LeaderboardTable({
  title,
  rows,
  emptyText,
}: {
  title: string;
  rows: LeaderboardEntry[];
  emptyText: string;
}) {
  return (
    <div className="flex flex-col min-h-[240px] md:min-h-0 md:h-full">
      <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">{title}</p>
      <div className="flex-1 overflow-auto border border-white/10 rounded-xl">
        {rows.length === 0 ? (
          <div className="h-full min-h-[180px] flex items-center justify-center text-slate-500 text-sm px-3 text-center">
            {emptyText}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-black/70 backdrop-blur-sm">
              <tr className="text-slate-400 text-[11px] uppercase tracking-wide">
                <th className="text-left px-3 py-2 font-medium">#</th>
                <th className="text-left px-3 py-2 font-medium">Player</th>
                <th className="text-right px-3 py-2 font-medium">Wins</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((player, index) => (
                <tr key={player.id} className="border-t border-white/5 text-slate-200">
                  <td className="px-3 py-2 text-slate-400">{index + 1}</td>
                  <td className="px-3 py-2 truncate max-w-[140px]">{player.name}</td>
                  <td className="px-3 py-2 text-right font-medium text-emerald-300">{player.wins}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default function Leaderboard() {
  const [friends, setFriends] = useState<LeaderboardEntry[]>([]);
  const [global, setGlobal] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const friendsRanked = [...friends].sort(sortByWinsThenName);
  const registeredWinners = [...global].filter((p) => p.wins > 0).sort(sortByWinsThenName);

  useEffect(() => {
    let cancelled = false;
    let lastFriendSignature = "";

    async function loadLeaderboard() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/poker/leaderboard", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load leaderboard");
        const data = (await res.json()) as LeaderboardResponse;
        if (cancelled) return;
        setFriends(Array.isArray(data.friends) ? data.friends : []);
        setGlobal(Array.isArray(data.global) ? data.global : []);
      } catch {
        if (cancelled) return;
        setError("Could not load leaderboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    async function loadFriendSignature() {
      const res = await fetch("/api/auth/friends", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load friends");

      const data = (await res.json()) as FriendsResponse;
      const friendIds = Array.isArray(data.friends) ? data.friends.map((friend) => friend.id) : [];
      return buildFriendSignature(friendIds);
    }

    async function refreshIfFriendListChanged() {
      try {
        const nextSignature = await loadFriendSignature();
        if (cancelled) return;

        if (!lastFriendSignature) {
          lastFriendSignature = nextSignature;
          return;
        }

        if (nextSignature !== lastFriendSignature) {
          lastFriendSignature = nextSignature;
          await loadLeaderboard();
        }
      } catch {
        // Ignore friend-signature polling errors; leaderboard has its own error handling.
      }
    }

    async function loadLeaderboardAndSyncSignature() {
      await loadLeaderboard();
      try {
        const signature = await loadFriendSignature();
        if (!cancelled) {
          lastFriendSignature = signature;
        }
      } catch {
        // Ignore signature sync errors.
      }
    }

    void loadLeaderboardAndSyncSignature();

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") void loadLeaderboardAndSyncSignature();
    }
    function handleFriendsChanged() {
      void loadLeaderboardAndSyncSignature();
    }

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refreshIfFriendListChanged();
      }
    }, LEADERBOARD_REFRESH_MS);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener(FRIENDS_CHANGED_EVENT, handleFriendsChanged);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener(FRIENDS_CHANGED_EVENT, handleFriendsChanged);
    };
  }, []);

  return (
    <section className="bg-black/45 backdrop-blur-sm border border-white/10 rounded-2xl p-5 text-left flex flex-col gap-4 max-h-[calc(100vh-220px)]">
      <h3 className="text-sm text-slate-300 font-medium">Leaderboard</h3>

      {loading ? (
        <div className="h-[260px] flex items-center justify-center text-slate-400 text-sm">Loading...</div>
      ) : error ? (
        <div className="h-[260px] flex items-center justify-center text-red-300 text-sm px-4 text-center">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
          <LeaderboardTable
            title="Friends Ranking"
            rows={friendsRanked}
            emptyText="No friends ranked yet"
          />
          <LeaderboardTable
            title="Registered Winners"
            rows={registeredWinners}
            emptyText="No registered winners yet"
          />
        </div>
      )}
    </section>
  );
}
