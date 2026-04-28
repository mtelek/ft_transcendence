"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PokerBackground from "@/components/PokerBackground";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export default function Register() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Show persistent inline errors instead of short native validation bubbles.
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !EMAIL_RE.test(trimmedEmail)) {
      setError("Invalid email format");
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      return;
    }

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: trimmedEmail, username, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
      return;
    }

    router.push("/login");
  };

  return (
     <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4 py-6 relative overflow-hidden">
      <PokerBackground />
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md relative z-10">
        <h1 className="text-2xl font-bold mb-6 text-center text-black">Register</h1>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        {/* Use native form validation before the request is sent */}
        <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4 text-black">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-3 border rounded"
          />
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="p-3 border rounded"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-3 border rounded"
          />
          <button
            type="submit"
            className="p-3 bg-black text-white rounded hover:bg-gray-800"
          >
            Register
          </button>
        </form>
        <p className="text-center mt-4 text-black">
          Already have an account?{" "}
          <Link href="/login" className="underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}