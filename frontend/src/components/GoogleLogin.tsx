"use client";

//! comment missing
import { signIn, signOut, useSession } from "next-auth/react";

export default function LoginButton() {
  const { data: session } = useSession();

  const handleGoogleSignIn = async () => {
    await signIn("google", {
      callbackUrl: "/",
    });
  };

  if (session) {
    return (
      <>
        <button type="button" onClick={() => signOut()}>Logout</button>
      </>
    );
  }

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      className="w-full px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
    >
      Login with Google
    </button>
  );
}