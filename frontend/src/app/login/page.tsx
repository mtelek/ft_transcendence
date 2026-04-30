"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import GoogleLogin from "@/components/GoogleLogin";
import PokerBackground from "@/components/PokerBackground";
import { VARIANT_BG, DEFAULT_VARIANT } from "@/constants/BackgroundVariants";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();

    setErrorMessage("");

    const result = await signIn("credentials", {
      identifier,
      password,
      callbackUrl: "/dashboard",
      redirect: false,
    });

    if (result?.error) {
      setErrorMessage("Incorrect email or password.");
      return;
    }

    if (result?.url) {
      window.location.href = result.url;
      return;
    }

    setErrorMessage("Login failed. Please try again.");
  }

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4 py-6 relative overflow-hidden"
        style={{ backgroundColor: VARIANT_BG[DEFAULT_VARIANT] }}>
        <PokerBackground />
      <div className="w-full max-w-md p-8 bg-black rounded-lg shadow-md relative z-10">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-white">
            <h1 className="text-2xl font-bold mb-6 text-center text-white">Login</h1>
            <input
              id="identifier"
              type="text"
              placeholder="Email or Username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
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
              autoComplete="current-password"
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
              className="p-3 bg-teal-500 text-white rounded hover:bg-teal-600"
            >
              Sign in
            </button>
            <div className="mt-2">
              <GoogleLogin />
            </div>
          </form>
        </div>
      </div>
  );
}
