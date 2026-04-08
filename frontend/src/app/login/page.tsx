"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import GoogleLogin from "@/components/GoogleLogin";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();

    await signIn("credentials", {
      identifier,
      password,
      callbackUrl: "/",
    });
  }

  //! comment missing
  return (
    <div className="flex items-center justify-center min-h-screen">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-80">
        <h1 className="text-2xl font-bold text-center">Login</h1>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <input
          type="text"
          placeholder="Email or Username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          className="px-4 py-2 border rounded"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="px-4 py-2 border rounded"
        />
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
  );
}
