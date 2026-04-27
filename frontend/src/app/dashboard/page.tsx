"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { io, Socket } from "socket.io-client";

type Panel = "none" | "host" | "join";
type Status = "idle" | "waiting" | "matched";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const socketRef = useRef<Socket | null>(null);
  const [panel, setPanel] = useState<Panel>("none");
  const [status, setStatus] = useState<Status>("idle");
  const [gameName, setGameName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const username = session?.user?.name ?? "Player";
  const image = session?.user?.image ?? "";

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/login");
    }
  }, [sessionStatus, router]);

  function getSocket(): Socket {
    if (socketRef.current) return socketRef.current;
    const socket = io("http://localhost:3000");
    socketRef.current = socket;

    socket.on("waitingForOpponent", () => setStatus("waiting"));

    socket.on("gameStarted", ({ gameId }: { gameId: string }) => {
      setStatus("matched");
      socket.disconnect();
      router.push(`/poker/game/${gameId}`);
    });

    socket.on("lobbyError", ({ message }: { message: string }) => {
      setError(message);
      setStatus("idle");
    });

    return socket;
  }

  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  function openPanel(p: Panel) {
    setPanel(p);
    setError("");
    setGameName("");
    setPassword("");
  }

  function handleHost() {
    if (!gameName.trim()) {
      setError("Game name is required");
      return;
    }
    setError("");
    const socket = getSocket();
    socket.emit("hostGame", { username, image, gameName: gameName.trim(), password });
  }

  function handleJoin() {
    if (!gameName.trim()) {
      setError("Game name is required");
      return;
    }
    setError("");
    const socket = getSocket();
    socket.emit("joinNamedGame", { username, image, gameName: gameName.trim(), password });
  }

  if (sessionStatus === "loading") {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-slate-900 flex items-center justify-center overflow-hidden">
        <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "waiting" || status === "matched") {
    return (
      <div className="relative min-h-[calc(100vh-64px)] bg-slate-900 flex flex-col items-center justify-center overflow-hidden">
        <Image src="/dark-poker-background-of-spades-and-clubs.jpg" alt="" aria-hidden="true" fill className="absolute inset-0 object-cover opacity-30" />
        <div className="relative z-10 flex flex-col items-center gap-6 text-center px-4">
          <h1 className="text-4xl font-bold text-white tracking-wide">Play Poker</h1>
          <div className="bg-black/60 backdrop-blur-sm border border-white/10 rounded-2xl px-12 py-10 flex flex-col items-center gap-4">
            {status === "waiting" ? (
              <>
                <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                <p className="text-white text-xl font-medium">Waiting for opponent...</p>
                <p className="text-slate-400 text-sm">Game: <span className="text-white font-semibold">{gameName}</span></p>
                <p className="text-slate-500 text-xs">Share the game name &amp; password with your opponent</p>
              </>
            ) : (
              <>
                <div className="text-4xl">🃏</div>
                <p className="text-green-400 text-xl font-bold">Opponent found!</p>
                <p className="text-slate-300">Redirecting to game...</p>
              </>
            )}
          </div>
          <button
            onClick={() => {
              socketRef.current?.disconnect();
              socketRef.current = null;
              setStatus("idle");
              setPanel("none");
            }}
            className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-64px)] bg-slate-900 flex flex-col items-center justify-center overflow-hidden">
      <Image src="/dark-poker-background-of-spades-and-clubs.jpg" alt="" aria-hidden="true" fill className="absolute inset-0 object-cover opacity-30" />

      <div className="relative z-10 flex flex-col items-center gap-8 text-center px-4 w-full max-w-3xl">
        <h1 className="text-4xl font-bold text-white tracking-wide">Play Poker</h1>

        <div className="flex items-stretch gap-6 w-full">
          <div className="bg-black/60 backdrop-blur-sm border border-white/10 rounded-2xl px-8 py-10 flex flex-col items-center justify-center gap-4 min-w-[200px]">
            <p className="text-slate-400 text-sm mb-2">Logged in as <span className="text-white font-semibold">{username}</span></p>
            <button
              onClick={() => openPanel("host")}
              className={`w-full py-3 rounded-full font-bold text-lg transition-colors ${panel === "host" ? "bg-lime-500 text-slate-900" : "bg-slate-700 hover:bg-slate-600 text-white"}`}
            >
              Host Game
            </button>
            <button
              onClick={() => openPanel("join")}
              className={`w-full py-3 rounded-full font-bold text-lg transition-colors ${panel === "join" ? "bg-blue-500 text-white" : "bg-slate-700 hover:bg-slate-600 text-white"}`}
            >
              Join Game
            </button>
          </div>

          {panel !== "none" && (
            <div className="flex-1 bg-black/60 backdrop-blur-sm border border-white/10 rounded-2xl px-8 py-10 flex flex-col gap-5 text-left">
              <h2 className="text-white text-xl font-bold">
                {panel === "host" ? "Create a Game" : "Join a Game"}
              </h2>

              <label className="flex flex-col gap-1">
                <span className="text-slate-400 text-sm">Game Name</span>
                <input
                  type="text"
                  value={gameName}
                  onChange={(e) => setGameName(e.target.value)}
                  placeholder="e.g. my-poker-room"
                  className="bg-slate-800 border border-slate-600 text-white rounded-lg px-4 py-2 outline-none focus:border-white/50 placeholder-slate-500"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-slate-400 text-sm">Password <span className="text-slate-600">(optional)</span></span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave blank for no password"
                  className="bg-slate-800 border border-slate-600 text-white rounded-lg px-4 py-2 outline-none focus:border-white/50 placeholder-slate-500"
                />
              </label>

              <p className="text-red-400 text-sm min-h-[20px]">
                {error || "\u00A0"}
              </p>

              <button
                onClick={panel === "host" ? handleHost : handleJoin}
                className={`mt-auto w-full py-3 rounded-full font-bold text-lg transition-colors ${panel === "host" ? "bg-lime-500 hover:bg-lime-400 text-slate-900" : "bg-blue-600 hover:bg-blue-500 text-white"}`}
              >
                {panel === "host" ? "Create & Wait" : "Join Game"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
