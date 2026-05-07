"use client";

//This header uses client-side hooks and interactive UI state
import { useState } from "react";
import Link from "next/link";
import ProfileOverlay from "@/components/profileOverlay/ProfileOverlay";
import { AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useSession } from "next-auth/react";
import type { Session } from "next-auth";
import { DEFAULT_AVATAR } from "@/constants/avatar";

export default function HeaderClient({ session }: { session: Session | null }) {
  //Controls whether the profile side overlay is visible
  const [open, setOpen] = useState(false);

  //Prefer live session updates from next-auth on the client,
  // then fall back to server-provided session props
  const { data: liveSession } = useSession();
  const activeSession = liveSession ?? session;

  return (
    //Top navigation container used across authenticated and guest states
    <header className="h-16 flex items-center justify-between px-6 py-4 bg-white border-b">
      <Link href="/" className="shrink-0">
        {/* Use the project logo as the home link in the top-left corner. */}
        <Image
          src="/logos/logo4_ft_transcendence.png"
          alt="ft_transcendence"
          width={108}
          height={48}
          className="h-10 w-auto"
          priority
        />
      </Link>

      <nav className="flex gap-4 items-center">
        {activeSession ? (
          <>
            {/* Quick greeting tied to the currently active session */}
            <span className="px-4 py-2 text-gray-600">
              Hey, {activeSession.user?.name}
            </span>

            <Link href="/dashboard" className="px-4 py-2 rounded-lg bg-black text-white rounded hover:bg-gray-800">
              Play Poker
            </Link>

            {/* Avatar button opens/closes the profile overlay */}
            <button onClick={() => setOpen(!open)}>
              <div className="w-10 h-10 bg-gray-500 rounded-full overflow-hidden flex items-center justify-center">
                <Image
                  // Keep a safe default image when no user avatar is available
                  src={activeSession?.user?.image ?? DEFAULT_AVATAR}
                  alt="User Avatar"
                  width={40}
                  height={40}
                  className="object-cover w-full h-full"
                />
              </div>
            </button>

            {/* AnimatePresence lets the overlay run exit animation on close */}
            <AnimatePresence>
              {open && <ProfileOverlay onClose={() => setOpen(false)} />}
            </AnimatePresence>
          </>
        ) : (
          <>
            {/* Guest navigation when no authenticated session exists */}
            <Link href="/login" className="px-4 py-2 rounded-lg bg-black text-white rounded hover:bg-gray-800">
              Login
            </Link>

            <Link href="/register" className="px-4 py-2 rounded-lg bg-black text-white rounded hover:bg-gray-800">
              Register
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}