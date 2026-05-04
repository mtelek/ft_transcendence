"use client";

//The ProfileOverlay component uses client-side hooks and APIs, so it must run on the client side
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import LogoutButton from "./LogoutButton";
import { motion } from "framer-motion"
import Link from "next/link";
import { DEFAULT_AVATAR } from "@/lib/avatar";
import { apiRequest } from "@/lib/client-api";

//Friend object - returned by the friends API
type Friend = {
  id: string;
  name: string;
  image: string | null;
  isOnline: boolean;
};

type FriendMutationResponse = {
  message?: string;
};

//Interval for refreshing the friend list and online status
const FRIENDS_REFRESH_MS = 1500;
const FRIENDS_CHANGED_EVENT = "friends:changed";

function areFriendsEqual(a: Friend[], b: Friend[]) {
  //Keep previous friend array reference when polling returns unchanged data,
  //so the overlay doesnt rerender every refresh cycle
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
  // Pending friend requests
  const [pending, setPending] = useState<Friend[]>([]);
  //Session data provides the logged in users profile informaation
  const { data: session } = useSession();
  //Friends currently shown in the overlay
  const [friends, setFriends] = useState<Friend[]>([]);
  //True only during the inital visible loading state for the friends list
  const [friendsLoading, setFriendsLoading] = useState(false);
  //Stores API or action errors related to friends
  const [friendsError, setFriendsError] = useState<string | null>(null);
  //Controlleed input value for the add friend field
  const [friendIdentifier, setFriendIdentifier] = useState("");
  //Prevents duplicate add friend request while one is already active
  const [isAddingFriend, setIsAddingFriend] = useState(false);
  //Tracks which friend is currently being removed so only that button is disabled.
  const [removingFriendId, setRemovingFriendId] = useState<string | null>(null);

  function notifyFriendsChanged() {
    //Notify other client components (like leaderboard) to re-fetch friend-derived data.
    window.dispatchEvent(new Event(FRIENDS_CHANGED_EVENT));
  }

  const loadFriends = useCallback(async (showLoading = false) => {
    //Only show the visible loading state when explicitly requested
    //Background polling refreshes stay invisible to the eye
    if (showLoading) {
      setFriendsLoading(true);
    }

    try {
      const data = await apiRequest<{ friends?: Friend[]; pending?: Friend[] }>(
        "/api/auth/friends",
        { method: "GET" },
        "Failed to load friends"
      );

      //Handle malformed responses by falling back to an empty list
      const incomingFriends = Array.isArray(data.friends) ? data.friends : [];
      const incomingPending = Array.isArray(data.pending) ? data.pending : [];

      setFriends((previousFriends) =>
        areFriendsEqual(previousFriends, incomingFriends) ? previousFriends : incomingFriends
      );
      setPending((previousPending) =>
        areFriendsEqual(previousPending, incomingPending) ? previousPending : incomingPending
      );
      setFriendsError(null);
    } catch (error) {
      setFriendsError(error instanceof Error ? error.message : "Failed to load friends");
    } finally {
      if (showLoading) {
        setFriendsLoading(false);
      }
    }
  }, []);
  async function handleAcceptFriend(friendId: string) {
    try {
      await apiRequest(
        "/api/auth/friends",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ friendId }),
        },
        "Failed to accept friend request"
      );
      await loadFriends();
      notifyFriendsChanged();
    } catch (error) {
      setFriendsError(error instanceof Error ? error.message : "Failed to accept friend request");
    }
  }

  async function handleDeclineFriend(friendId: string) {
    try {
      await apiRequest(
        "/api/auth/friends",
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ friendId }),
        },
        "Failed to decline friend request"
      );
      await loadFriends();
    } catch (error) {
      setFriendsError(error instanceof Error ? error.message : "Failed to decline friend request");
    }
  }

  async function handleAddFriend() {
    const identifier = friendIdentifier.trim();
    //Ignore empty input and block duplicate submissions
    if (!identifier || isAddingFriend) {
      return;
    }

    setIsAddingFriend(true);
    setFriendsError(null);

    try {
      const response = await apiRequest<FriendMutationResponse>(
        "/api/auth/friends",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier }),
        },
        "Failed to add friend"
      );

      //Clear the input after a succesful request
      setFriendIdentifier("");
      //Refresh the list  so the UI shows the latest friendship state
      await loadFriends();

      //Only refresh friend-derived widgets if friendship became accepted.
      if (response.message === "Friend request accepted" || response.message === "Already friends") {
        notifyFriendsChanged();
      }
    } catch (error) {
      setFriendsError(error instanceof Error ? error.message : "Failed to add friend");
    } finally {
      setIsAddingFriend(false);
    }
  }

  async function handleRemoveFriend(friendId: string) {
    //Prevent overlapping remove actions
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
      
       //Refresh the list  so the UI shows the latest friendship state
      await loadFriends();
      notifyFriendsChanged();
    } catch (error) {
      setFriendsError(error instanceof Error ? error.message : "Failed to remove friend");
    } finally {
      setRemovingFriendId(null);
    }
  }

  useEffect(() => {
    //Dont start polling until a user session exists
    if (!session?.user) {
      return;
    }
    if (friends.length === 0) {
      void loadFriends(true);
    }
    //Keep updating every few seconds and when you return to the tab so 
    // online status doesn’t get outdated
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

    //Clean up polling and browser listeners when the overlay unmounts or
    // when the session idenitiy changes
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loadFriends, session?.user]);

  return (
    <>
      {/* Backdrop closes the overlay when the user clicks outside the panel*/}
      <motion.div
        className="fixed inset-0 bg-transparent z-40"
        onClick={onClose}
		initial={{ opacity: 0}}
		animate={{ opacity: 1}}
		exit={{ opacity: 0}}
      />

      {/* Sliding side panel containing  profile details and friend management UI*/}
        <motion.div className="fixed top-16 bottom-0 right-0 w-80 bg-white shadow-lg z-50 p-4 overflow-hidden flex flex-col"
	  	initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 300, opacity: 0 }}
        transition={{ duration: 0.3 }}
		>
        <h2 className="text-lg font-bold mb-2 text-gray-800">Profile</h2>

        {session?.user ? (
          <div className="flex flex-col gap-2 text-gray-800">
            {/* Show the currently authenticated user's profile fields. */}
            <p><b>Name:</b> {session.user.name}</p>
            <p><b>Email:</b> {session.user.email}</p>
          </div>
        ) : (
          <p className="text-gray-800">Not logged in</p>
        )}

    {/* Main profile actions. */}
		<div className="mt-4 flex flex-col items-start gap-3">
			<Link 
        href="/settings"
        onClick={onClose} 
        className="w-28 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition text-center">
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

        <div className="mt-6 flex flex-col gap-6 min-h-0 flex-1 overflow-y-auto pr-1">
          {/* Pending friend requests */}
          <div className="border-t border-gray-300 pt-4">
            <h3 className="text-md font-bold text-gray-800">Pending Friend Requests</h3>
            <div className="mt-3 space-y-2">
              {pending.length === 0 ? (
                <p className="text-sm text-gray-500">No pending requests</p>
              ) : (
                pending.map((friend) => (
                  <div key={friend.id} className="flex items-center gap-2 rounded-md bg-yellow-100 px-2 py-2">
                    <Image
                      src={friend.image || DEFAULT_AVATAR}
                      alt={`${friend.name} avatar`}
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full object-cover"
                      onError={(event) => {
                        event.currentTarget.src = DEFAULT_AVATAR;
                      }}
                      unoptimized
                    />
                    <span className="text-sm text-gray-900">{friend.name}</span>
                    <button
                      onClick={() => handleAcceptFriend(friend.id)}
                      className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleDeclineFriend(friend.id)}
                      className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
                    >
                      Decline
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Friends area allows searching, adding, viewing presence, and removing friends. */}
          <div className="border-t border-gray-300 pt-4">
            <h3 className="text-md font-bold text-gray-800">Friends</h3>

            <div className="mt-3 flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <input
                  id="friend"
                  value={friendIdentifier}
                  onChange={(event) => setFriendIdentifier(event.target.value)}
                  placeholder="Username or email"
                  className="w-full rounded-md border px-2 py-1 text-sm text-gray-900 outline-none focus:border-gray-500 border-gray-300"
                  autoComplete="off"
                  aria-invalid={!!friendsError}
                  aria-describedby={friendsError ? 'friend-error' : undefined}
                />
                <button
                  onClick={handleAddFriend}
                  disabled={isAddingFriend}
                  className="rounded bg-black px-3 py-1 text-sm text-white hover:bg-gray-800 disabled:opacity-60"
                >
                  Add
                </button>
              </div>
              {/* Error as helper text under input, always reserve space */}
              <div className="min-h-[1.25rem]">
                <div
                  id="friend-error"
                  className={`text-xs text-pokerred ${friendsError ? "visible" : "invisible"}`}
                  role={friendsError ? "alert" : undefined}
                  aria-live="polite"
                >
                  {friendsError || "\u00A0"}
                </div>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {friendsLoading ? (
                <p className="text-sm text-gray-500">Loading friends...</p>
              ) : friends.length === 0 ? (
                <p className="text-sm text-gray-500">No friends yet</p>
              ) : (
                friends.map((friend) => (
                  <div key={friend.id} className="flex items-center gap-2 rounded-md bg-gray-100 px-2 py-2">
                    <Image
                      src={friend.image || DEFAULT_AVATAR}
                      alt={`${friend.name} avatar`}
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full object-cover"
                      onError={(event) => {
                        //User avatars may be missing or broken, always fall back to a safe default avatar
                        event.currentTarget.src = DEFAULT_AVATAR;
                      }}
                      unoptimized
                    />
                    <span className="text-sm text-gray-900">{friend.name}</span>
                    {/* Avalaible dot reflects the server-computed online status. */}
                    <span
                      className={`ml-auto h-2.5 w-2.5 rounded-full ${friend.isOnline ? "bg-green-500" : "bg-gray-400"}`}
                      title={friend.isOnline ? "Online" : "Offline"}
                    />
                    <button
                      onClick={() => handleRemoveFriend(friend.id)}
                      disabled={removingFriendId === friend.id}
                      className="rounded bg-pokerred px-2 py-1 text-xs text-white disabled:opacity-60"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}