"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="w-28 px-4 py-2 bg-pokerred text-white rounded-lg transition text-center"
    >
      Logout
    </button>
  );
}
