"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { validateRequiredInput } from "@/lib/input-validation";

export interface Message {
  username: string;
  text: string;
  type?: "chat" | "game";
}

type ChatSize = "full" | "small";

export default function Chat({
  username,
  gameId,
  messages: externalMessages,
  onNewMessage,
}: {
  username: string;
  gameId?: string;
  messages?: Message[];
  onNewMessage?: (msg: Message) => void;
}) {
  const [internalMessages, setInternalMessages] = useState<Message[]>([]);
  const messages = externalMessages ?? internalMessages;
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [size, setSize] = useState<ChatSize>("small");
  const [closed, setClosed] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socket = io(); // Uses current origin (host/protocol)
    socketRef.current = socket;

    const onMessage = (data: Message) => {
      if (onNewMessage) onNewMessage(data);
      else if (externalMessages === undefined) setInternalMessages((prev: Message[]) => [...prev, data]);
      // display-only mode (externalMessages provided, no onNewMessage): skip — parent handles it
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
    if (!closed && size === "full") {
      const frame = requestAnimationFrame(() =>
        bottomRef.current?.scrollIntoView({ behavior: "instant" })
      );
      return () => cancelAnimationFrame(frame);
    }
  }, [messages, size, closed]);

  function sendMessage(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const messageError = validateRequiredInput(input, "Message");
    if (messageError) {
      setError(messageError);
      return;
    }

    if (input.length > 250) {
      setError("Message must be 100 characters or less");
      return;
    }

    setError("");
    socketRef.current?.emit("message", { username, text: input, gameId });
    setInput("");
  }

  const visibleMessages = size === "small" ? messages.slice(-2) : messages;

  function handleSizeToggle() {
    if (closed) {
      setClosed(false);
      setSize("full");
      return;
    }
    setSize((prev) => (prev === "full" ? "small" : "full"));
  }

  return (
    <div className="flex flex-col w-full max-w-lg border rounded-lg overflow-hidden bg-black/70 backdrop-blur-sm">
      {/* Header controls are always visible */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-black/50 border-b border-white/10">
        <span className="text-slate-400 text-xs font-medium">Chat</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleSizeToggle}
            className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded transition-colors"
            title={closed || size === "small" ? "Full size" : "Minimize"}
          >
            {closed || size === "small" ? "▲" : "▼"}
          </button>
          <button
            type="button"
            onClick={() => setClosed(true)}
            className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded transition-colors"
            title="Close chat"
          >
            x
          </button>
        </div>
      </div>

      {/* Messages */}
      {!closed && (
        <div
          className="chat-scrollbar overflow-y-auto p-3 flex flex-col gap-1 bg-transparent transition-all"
          style={{ height: size === "full" ? "16rem" : "auto" }}
        >
          {visibleMessages.map((msg, i) => (
            <div key={i} className="leading-tight text-sm">
              {msg.type === "game" ? (
                <span className="text-amber-400 italic text-xs">{msg.text}</span>
              ) : (
                <>
                  <span className="font-bold text-slate-200">{msg.username}: </span>
                  <span className="text-slate-300">{msg.text}</span>
                </>
              )}
            </div>
          ))}
          {size === "full" && <div ref={bottomRef} />}
        </div>
      )}

      {/* Input — hidden when chat is closed */}
      {!closed && (
        <form onSubmit={sendMessage} className="flex border-t border-white/10 transition-all focus-within:ring-2 focus-within:ring-white/50">
          <input
            id="chat"
            aria-label="Chat message"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (error) setError("");
            }}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 rounded-l text-white bg-white/10 placeholder-slate-400 text-sm transition-all focus:bg-white/20 outline-none"
            autoComplete="off"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-r bg-black text-white hover:bg-gray-800 text-sm"
          >
            Send
          </button>
        </form>
      )}
      {!closed && error && <p className="border-t border-white/10 px-3 py-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
