"use client";

import { useState } from "react";
import Link from "next/link";
import ProfileOverlay from "@/components/ProfileOverlay";
import { AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function HeaderClient({ session }: any) {
  const [open, setOpen] = useState(false);

  return (
    <header className="h-16 flex items-center justify-between px-6 py-4 bg-white border-b">
      <Link href="/" className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800">
        ft_transcendence
      </Link>

      <nav className="flex gap-4 items-center">
        {session ? (
          <>
            <span className="px-4 py-2 text-gray-600">
              Hey, {session.user?.name}
            </span>

            <Link href="/poker" className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800">
              Poker
            </Link>

            {/* Avatar setting based on the authentication form*/}
            <button onClick={() => setOpen(!open)}>
              <div className="w-10 h-10 bg-gray-500 rounded-full overflow-hidden flex items-center justify-center">
                {session?.user.image ? (
                  <Image
                  src= {session.user.image}
                  alt="User Avatar"
                  width={40}
                  height={40}
                  className="object-cover w-full h-full"
                  />
                ) : (
                  <Image
                  src="/avatars/Western avatar.jpg"
                  alt="Default Avatar"
                  width={40}
                  height={40}
                  className="object-cover w-full h-full"
                />
                )}
              </div>
            </button>

        {/* Overlay */}
      <AnimatePresence>
        	{open && <ProfileOverlay onClose={() => setOpen(false)} />}
      </AnimatePresence>
          </>
        ) : (
          <>
            <Link href="/login" className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800">
              Login
            </Link>

            <Link href="/register" className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800">
              Register
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}