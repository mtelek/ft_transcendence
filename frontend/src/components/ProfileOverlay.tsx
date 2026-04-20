"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import LogoutButton from "./LogoutButton";
import { motion } from "framer-motion"
import Link from "next/link";
import { DEFAULT_AVATAR } from "@/lib/avatar";
import { apiRequest } from "@/lib/client-api";

type Friend = {
  id: string;
  name: string;
  image: string | null;
  isOnline: boolean;
};

const FRIENDS_REFRESH_MS = 1500;

function areFriendsEqual(a: Friend[], b: Friend[]) {
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i += 1) {
    if (
      a[i].id !== b[i].id ||
      a[i].name !== b[i].name ||
      a[i].image !== b[i].image ||
      a[i].isOnline !== b[i].isOnline
    ) {
      return false;
    }
  }

  return true;
}

export default function ProfileOverlay({ onClose }: { onClose: () => void }) {
  const { data: session } = useSession();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friendsError, setFriendsError] = useState<string | null>(null);
  const [friendIdentifier, setFriendIdentifier] = useState("");
  const [isAddingFriend, setIsAddingFriend] = useState(false);
  const [removingFriendId, setRemovingFriendId] = useState<string | null>(null);

  async function loadFriends(showLoading = false) {
    if (showLoading) {
      setFriendsLoading(true);
    }

    try {
      const data = await apiRequest<{ friends?: Friend[] }>(
        "/api/auth/friends",
        { method: "GET" },
        "Failed to load friends"
      );

      const incomingFriends = Array.isArray(data.friends) ? data.friends : [];

      setFriends((previousFriends) =>
        areFriendsEqual(previousFriends, incomingFriends) ? previousFriends : incomingFriends
      );
      setFriendsError(null);
    } catch (error) {
      setFriendsError(error instanceof Error ? error.message : "Failed to load friends");
    } finally {
      if (showLoading) {
        setFriendsLoading(false);
      }
    }
  }

  async function handleAddFriend() {
    const identifier = friendIdentifier.trim();
    if (!identifier || isAddingFriend) {
      return;
    }

    setIsAddingFriend(true);
    setFriendsError(null);

    try {
      await apiRequest(
        "/api/auth/friends",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier }),
        },
        "Failed to add friend"
      );

      setFriendIdentifier("");
      await loadFriends();
    } catch (error) {
      setFriendsError(error instanceof Error ? error.message : "Failed to add friend");
    } finally {
      setIsAddingFriend(false);
    }
  }

  async function handleRemoveFriend(friendId: string) {
    if (removingFriendId) {
      return;
    }

    setRemovingFriendId(friendId);
    setFriendsError(null);

    try {
      await apiRequest(
        "/api/auth/friends",
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ friendId }),
        },
        "Failed to remove friend"
      );

      await loadFriends();
    } catch (error) {
      setFriendsError(error instanceof Error ? error.message : "Failed to remove friend");
    } finally {
      setRemovingFriendId(null);
    }
  }

  useEffect(() => {
    if (!session?.user) {
      return;
    }

    void loadFriends(true);
    const intervalId = window.setInterval(() => {
      void loadFriends();
    }, FRIENDS_REFRESH_MS);

    const handleFocus = () => {
      void loadFriends();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void loadFriends();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [session?.user?.email, session?.user?.name]);

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

        <div className="mt-6 border-t border-gray-300 pt-4">
          <h3 className="text-md font-bold text-gray-800">Friends</h3>

          <div className="mt-3 flex items-center gap-2">
            <input
              value={friendIdentifier}
              onChange={(event) => setFriendIdentifier(event.target.value)}
              placeholder="Username or email"
              className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 outline-none focus:border-gray-500"
            />
            <button
              onClick={handleAddFriend}
              disabled={isAddingFriend}
              className="rounded bg-black px-3 py-1 text-sm text-white hover:bg-gray-800 disabled:opacity-60"
            >
              Add
            </button>
          </div>

          {friendsError && (
            <p className="mt-2 text-xs text-red-600">{friendsError}</p>
          )}

          <div className="mt-3 space-y-2">
            {friendsLoading ? (
              <p className="text-sm text-gray-500">Loading friends...</p>
            ) : friends.length === 0 ? (
              <p className="text-sm text-gray-500">No friends yet</p>
            ) : (
              friends.map((friend) => (
                <div key={friend.id} className="flex items-center gap-2 rounded-md bg-gray-100 px-2 py-2">
                  <img
                    src={friend.image || DEFAULT_AVATAR}
                    alt={`${friend.name} avatar`}
                    className="h-8 w-8 rounded-full object-cover"
                    onError={(event) => {
                      event.currentTarget.src = DEFAULT_AVATAR;
                    }}
                  />
                  <span className="text-sm text-gray-900">{friend.name}</span>
                  <span
                    className={`ml-auto h-2.5 w-2.5 rounded-full ${friend.isOnline ? "bg-green-500" : "bg-gray-400"}`}
                    title={friend.isOnline ? "Online" : "Offline"}
                  />
                  <button
                    onClick={() => handleRemoveFriend(friend.id)}
                    disabled={removingFriendId === friend.id}
                    className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}