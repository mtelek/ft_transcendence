"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import PokerBackground from "@/components/PokerBackground";
import { VARIANT_BG, DEFAULT_VARIANT } from "@/constants/BackgroundVariants";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export default function Register() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    // Show persistent inline errors instead of short native validation bubbles.
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !EMAIL_RE.test(trimmedEmail)) {
      setErrorMessage("Invalid email format");
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setErrorMessage(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      return;
    }

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: trimmedEmail, username, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setErrorMessage(data.error);
      return;
    }

    const signInResult = await signIn("credentials", {
      identifier: trimmedEmail,
      password,
      redirect: false,
    });

    if (signInResult?.error) {
      setErrorMessage("Account created, but automatic sign in failed. Please log in manually.");
      router.push("/login");
      return;
    }

    router.push("/dashboard");
  };

  return (
     <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4 py-6 relative overflow-hidden"
      style={{ backgroundColor: VARIANT_BG[DEFAULT_VARIANT] }}>
      <PokerBackground />
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md relative z-10">
        {/* Use native form validation before the request is sent */}
        <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4 text-black">
          <h1 className="text-2xl font-bold mb-6 text-center text-black">Register</h1>
          <input
            id="email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-3 border rounded"
            autoComplete="email"
          />
          <input
            id="username"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="p-3 border rounded"
            autoComplete="username"
          />
          <input
            id="password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-3 border rounded"
            autoComplete="new-password"
          />
          <p
              className={`-mt-2 min-h-5 text-sm text-red-600 ${errorMessage ? "visible" : "invisible"}`}
              role={errorMessage ? "alert" : undefined}
              aria-live="polite"
            >
              {errorMessage || "\u00A0"}
          </p>
          <button
            type="submit"
            className="p-3 bg-black text-white rounded hover:bg-gray-800"
          >
            Sign up
          </button>
        </form>
        <p className="text-center mt-4 text-black">
          Already have an account?{" "}
          <Link href="/login" className="underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}