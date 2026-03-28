"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

interface Message {
  username: string;
  text: string;
}

export default function Chat({ username }: { username: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socketRef.current = io("http://localhost:3000");

    socketRef.current.on("message", (data: Message) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function sendMessage(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!input.trim()) return;
    socketRef.current?.emit("message", { username, text: input });
    setInput("");
  }

  return (
    <div className="flex flex-col h-96 w-full max-w-lg border rounded-lg overflow-hidden bg-black/70 backdrop-blur-sm">
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 bg-transparent">
        {messages.map((msg, i) => (
          <div key={i}>
            <span className="font-bold text-slate-200">{msg.username}: </span>
            <span className="text-slate-300">{msg.text}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={sendMessage} className="flex border-t">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 outline-none text-white bg-white/10 placeholder-slate-400"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-black text-white hover:bg-gray-800"
        >
          Send
        </button>
      </form>
    </div>
  );
}
