"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";

type Status = "connecting" | "waiting" | "matched";

// Rendering when a user clicks on Poker (navigates to /poker/lobby) 

export default function LobbyClient({ username }: { username: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("connecting");

  useEffect(() => {
    // connecting to our server via websocket
    const socket: Socket = io("http://localhost:3000");

    // when connected, tell server who connected and tell client "Waiting ..."
    socket.on("connect", () => {
      socket.emit("joinLobby", { username });
      setStatus("waiting");
    });

    // while waiting server can repeatedly confirm that user is waiting
    socket.on("waitingForOpponent", () => {
      setStatus("waiting");
    });

    // server pairs client with another client, tell client "opponent found"a, socket disconnects and user gets redirected to new tab (game page)
    socket.on("gameStarted", ({ gameId }: { gameId: string }) => {
      setStatus("matched");
      socket.disconnect();
      router.push(`/poker/game/${gameId}`);
    });

    // if user leaves page, tells server he left and closes the socket
    return () => {
      socket.emit("leaveLobby");
      socket.disconnect();
    };
  }, [username, router]);

  return (
    <div className="relative min-h-screen bg-slate-900 flex flex-col items-center justify-center overflow-hidden">
      {/* Background */}
      <img
        src="/dark-poker-background-of-spades-and-clubs.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover opacity-30"
      />

      <div className="relative z-10 flex flex-col items-center gap-8 text-center px-4">
        <h1 className="text-4xl font-bold text-white tracking-wide">Heads-Up Poker</h1>

        <div className="bg-black/60 backdrop-blur-sm border border-white/10 rounded-2xl px-12 py-10 flex flex-col items-center gap-6">
          {status === "connecting" && (
            <>
              <Spinner />
              <p className="text-slate-300 text-lg">Connecting...</p>
            </>
          )}

          {status === "waiting" && (
            <>
              <Spinner />
              <p className="text-white text-xl font-medium">Waiting for opponent</p>
              <p className="text-slate-400 text-sm">Logged in as <span className="text-white font-semibold">{username}</span></p>
              <p className="text-slate-500 text-xs mt-2">Share this page with a friend to start!</p>
            </>
          )}

          {status === "matched" && (
            <>
              <div className="text-4xl">🃏</div>
              <p className="text-green-400 text-xl font-bold">Opponent found!</p>
              <p className="text-slate-300">Redirecting to game...</p>
            </>
          )}
        </div>

        <a
          href="/dashboard"
          className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
        >
          ← Back to dashboard
        </a>
      </div>
    </div>
  );
}

// Some animation while waiting for opponent

function Spinner() {
  return (
    <div style={{ fontSize: "20px", fontWeight: "bold", color: "white" }}>
      loading...
    </div>
  );
}
