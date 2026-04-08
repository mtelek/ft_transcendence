"use client";

import { useSession } from "next-auth/react";
import LogoutButton from "./LogoutButton";
import { motion } from "framer-motion"
import Link from "next/link";

export default function ProfileOverlay({ onClose }: { onClose: () => void }) {
  const { data: session } = useSession();

  return (
    <>
      {/* 🔲 Background overlay */}
      <motion.div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
		initial={{ opacity: 0}}
		animate={{ opacity: 1}}
		exit={{ opacity: 0}}
      />

      {/* 📦 Profile panel */}
      <motion.div className="fixed top-16 bottom-0 right-0 w-80 bg-white shadow-lg z-50 p-4 overflow-y-auto"
	  	initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 300, opacity: 0 }}
        transition={{ duration: 0.3 }}
		>
        <h2 className="text-lg font-bold mb-2 text-gray-800">Profile</h2>

        {session?.user ? (
          <div className="flex flex-col gap-2 text-gray-800">
            <p><b>Name:</b> {session.user.name}</p>
            <p><b>Email:</b> {session.user.email}</p>
          </div>
        ) : (
          <p className="text-gray-800">Not logged in</p>
        )}

		<div className="mt-4 flex flex-col items-start gap-3">
			<Link 
        href="/settings"
        onClick={onClose} 
        className="w-28 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-800 transition text-center">
			  Settings
			</Link>

			<button
    			onClick={onClose}
    			className="w-28 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition text-center"
  			>
			Close
			</button>

			<LogoutButton/>
		</div>
      </motion.div>
    </>
  );
}