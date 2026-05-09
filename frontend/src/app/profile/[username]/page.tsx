"use client";

import Image from "next/image";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { DEFAULT_AVATAR } from "@/constants/avatar";
import { VARIANT_BG, DEFAULT_VARIANT } from "@/constants/BackgroundVariants";
import { useEffect, useState } from "react";
import { ALL_ACHIEVEMENTS } from "@/constants/Achievements"

type ProfileUser = {
    username: string | null;
    email: string | null;
    image: string | null;
    wins: number;
    losses: number;
    handsPlayed: number;
    achievements: { type: string; unlockedAt: string }[];
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const { username } = useParams<{ username: string }>();
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);

  const isOwnProfile = session?.user?.name === username;

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch(`/api/user/${username}`);
        const data = await res.json();
        setUser(data.user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    void fetchUser();
  }, [username]);

  if (loading) return <p className="text-white p-6">Loading...</p>
  if (!user) return <p className="text-white p-6">User not found</p>

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: VARIANT_BG[DEFAULT_VARIANT] }}>
      <div className="ml-[33vw] p-6">
        <h1 className="text-3xl font-bold">
          {isOwnProfile ? "Your Profile" : `${username}'s Profile`}
        </h1>

        <div className="my-4 max-w-2xl border-b border-gray-700"></div>

        <div className="flex items-center gap-4">
          <Image
            src={user.image ?? DEFAULT_AVATAR}
            alt="Profile avatar"
            width={80}
            height={80}
            onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }}
            className="w-20 h-20 rounded-full object-cover"
            unoptimized
          />
        </div>

        <div className="mt-8 space-y-4 max-w-2xl">
          <div className="flex items-center justify-between rounded-lg border border-gray-700 px-4 py-3">
            <span className="text-gray-400 text-sm">Username</span>
            <span>{user.username || "-"}</span>
          </div>

          {isOwnProfile && (
            <div className="flex items-center justify-between rounded-lg border border-gray-700 px-4 py-3">
              <span className="text-gray-400 text-sm">Email</span>
              <span>{user.email || "-"}</span>
            </div>
          )}
        </div>

        <div className="mt-8 max-w-2xl">
  <h2 className="text-xl font-bold mb-4">Game Stats</h2>
  <div className="grid grid-cols-3 gap-4">
    <div className="flex flex-col items-center rounded-lg border border-gray-700 px-4 py-3">
      <span className="text-2xl font-bold text-teal-500">{user.wins}</span>
      <span className="text-gray-400 text-sm">Wins</span>
    </div>
    <div className="flex flex-col items-center rounded-lg border border-gray-700 px-4 py-3">
      <span className="text-2xl font-bold text-red-500">{user.losses}</span>
      <span className="text-gray-400 text-sm">Losses</span>
    </div>
    <div className="flex flex-col items-center rounded-lg border border-gray-700 px-4 py-3">
      <span className="text-2xl font-bold text-white">{user.handsPlayed}</span>
      <span className="text-gray-400 text-sm">Hands Played</span>
    </div>
  </div>
</div>
        


        <div className="mt-8 max-w-2xl">
          <h2 className="text-xl font-bold mb-4">Achievements</h2>
          <div className="flex flex-wrap gap-4">
            {ALL_ACHIEVEMENTS.map((achievement) => {
              const unlocked = user.achievements.some(a => a.type === achievement.type)
              return (
                <div
                  key={achievement.type}
                  className={`relative flex flex-col items-center gap-2 group ${unlocked ? "opacity-100" : "opacity-50"}`}
                >
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl border-2 ${unlocked ? "border-teal-500 bg-teal-900" : "border-gray-600 bg-gray-800"}`}>
                    {achievement.icon}
                  </div>
                  <span className="text-xs text-center text-gray-300">{achievement.label}</span>
                  <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap border border-gray-600 z-10">
                    {achievement.description}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  );
}