"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

interface Message {
  username: string;
  text: string;
}

type ChatSize = "full" | "small" | "minimized";

const SIZE_ICONS: Record<ChatSize, string> = {
  full: "▼",
  small: "×",
  minimized: "▲",
};

const NEXT_SIZE: Record<ChatSize, ChatSize> = {
  full: "small",
  small: "minimized",
  minimized: "full",
};

export default function Chat({ username, gameId }: { username: string; gameId?: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [size, setSize] = useState<ChatSize>("full");
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socket = io("http://localhost:3000");
    socketRef.current = socket;

    const onMessage = (data: Message) => {
      setMessages((prev) => [...prev, data]);
    };

    const onConnect = () => {
      console.log("[Socket.io][Client] Connected:", socket.id);
      if (gameId) socket.emit("joinGameRoom", { gameId });
    };

    const onDisconnect = (reason: Socket.DisconnectReason) => {
      console.log("[Socket.io][Client] Disconnected. Reason:", reason);
    };

    socket.on("message", onMessage);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("message", onMessage);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.disconnect();
    };
  }, [gameId]);

  useEffect(() => {
    if (size === "full") bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, size]);

  function sendMessage(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!input.trim()) return;
    socketRef.current?.emit("message", { username, text: input, gameId });
    setInput("");
  }

  const visibleMessages = size === "small" ? messages.slice(-2) : messages;

  return (
    <div className="flex flex-col w-full max-w-lg border rounded-lg overflow-hidden bg-black/70 backdrop-blur-sm">
      {/* Header with minimize button */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-black/50 border-b border-white/10">
        <span className="text-slate-400 text-xs font-medium">Chat</span>
        <button
          type="button"
          onClick={() => setSize((s) => NEXT_SIZE[s])}
          className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded transition-colors"
          title={`Switch to ${NEXT_SIZE[size]} view`}
        >
          {SIZE_ICONS[size]}
        </button>
      </div>

      {/* Messages */}
      {size !== "minimized" && (
        <div
          className="overflow-y-auto p-3 flex flex-col gap-2 bg-transparent transition-all"
          style={{ height: size === "full" ? "16rem" : "auto" }}
        >
          {visibleMessages.map((msg, i) => (
            <div key={i}>
              <span className="font-bold text-slate-200">{msg.username}: </span>
              <span className="text-slate-300">{msg.text}</span>
            </div>
          ))}
          {size === "full" && <div ref={bottomRef} />}
        </div>
      )}

      {/* Input — hidden when minimized */}
      {size !== "minimized" && (
        <form onSubmit={sendMessage} className="flex border-t border-white/10">
          <input
            id="chat"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 outline-none text-white bg-white/10 placeholder-slate-400 text-sm"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-black text-white hover:bg-gray-800 text-sm"
          >
            Send
          </button>
        </form>
      )}
    </div>
  );
}
