"use client";

// This component uses client-side auth hooks and actions.
import { signIn } from "next-auth/react";
import Image from "next/image";

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
      onClick={handleGoogleSignIn}
      className="w-full p-3 bg-gray-800 rounded text-white flex items-center justify-center gap-2 hover:bg-gray-900"
    >
      <Image
      src="/logos/google-g-logo-only.svg"
      alt="Google logo"
      width={20}
      height={20}
      className="mr-2"
      />
      <span>Sign in with Google</span>
    </button>
  );
}
