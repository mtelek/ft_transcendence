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
      <span>Login with </span>
      <span className="font-semibold" aria-label="Google">
        <span className="text-[#4285F4]">G</span>
        <span className="text-[#DB4437]">o</span>
        <span className="text-[#F4B400]">o</span>
        <span className="text-[#4285F4]">g</span>
        <span className="text-[#0F9D58]">l</span>
        <span className="text-[#DB4437]">e</span>
      </span>
    </button>
  );
}
