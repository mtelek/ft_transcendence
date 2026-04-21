"use client";

// This component uses client-side auth hooks and actions.
import { signIn } from "next-auth/react";

export default function LoginButton() {
  const handleGoogleSignIn = async () => {
    // Start Google OAuth flow and return user to home page after auth
    await signIn("google", {
      callbackUrl: "/dashboard",
    });
  };

  return (
    <button
      type="button"
      // Trigger Google sign-in when no active session exists
      onClick={handleGoogleSignIn}
      className="w-full px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
    >
      Login with Google
    </button>
  );
}
