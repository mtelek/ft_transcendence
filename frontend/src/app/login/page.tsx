"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import GoogleLogin from "@/components/GoogleLogin";

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
    <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4 py-6">
      <div className="w-full max-w-md rounded-xl bg-black shadow-sm">
        <div className="flex min-h-[26rem] items-start justify-center pt-12">
          <form onSubmit={handleSubmit} className="flex w-80 max-w-full flex-col gap-4 px-4">
            <h1 className="text-2xl font-bold text-center">Login</h1>
            <input
              type="text"
              placeholder="Email or Username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="px-4 py-2 text-base border rounded"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-4 py-2 text-base border rounded"
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
              className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
            >
              Login
            </button>
            <div className="mt-2">
              <GoogleLogin />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
