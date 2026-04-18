"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { DEFAULT_AVATAR } from "@/lib/avatar";

export default function Home() {
  const { data: session, update } = useSession();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [avatars, setAvatars] = useState<string[]>([]);
  const [isLoadingAvatars, setIsLoadingAvatars] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState(DEFAULT_AVATAR);

  useEffect(() => {
    setCurrentImage(session?.user?.image || DEFAULT_AVATAR);
  }, [session?.user?.image]);

  async function openAvatarPicker() {
    setError(null);
    setIsPickerOpen(true);
    setIsLoadingAvatars(true);

    try {
      const res = await fetch("/api/auth/avatar", { method: "GET" });
      const data = (await res.json()) as { avatars?: string[]; error?: string };

      if (!res.ok || !Array.isArray(data.avatars)) {
        throw new Error(data.error || "Failed to load avatars");
      }

      setAvatars(data.avatars);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load avatars");
    } finally {
      setIsLoadingAvatars(false);
    }
  }

  async function handleAvatarSelect(avatarPath: string) {
    if (isSaving) return;

    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/avatar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: avatarPath }),
      });

      const data = (await res.json()) as { image?: string; error?: string };

      if (!res.ok || typeof data.image !== "string") {
        throw new Error(data.error || "Failed to update avatar");
      }

      setCurrentImage(data.image);
      await update({ image: data.image });
      setIsPickerOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update avatar");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="ml-[33vw] p-6">
        <h1 className="text-3xl font-bold">Account</h1>

        <div className="border-b border-gray-700 my-4"></div>

        <div className="flex items-center gap-4">
          <img
            src={currentImage}
            onError={(e) => {
              e.currentTarget.src = DEFAULT_AVATAR;
            }}
            className="w-20 h-20 rounded-full object-cover"
          />

          <button
            onClick={openAvatarPicker}
            className="bg-green-500 px-4 py-2 rounded hover:bg-green-600 transition"
          >
            Change profile picture
          </button>
        </div>

        {isPickerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-3xl rounded-xl border border-gray-700 bg-zinc-900 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Choose an avatar</h2>
                <button
                  onClick={() => setIsPickerOpen(false)}
                  className="rounded bg-zinc-700 px-3 py-1 text-sm hover:bg-zinc-600"
                >
                  Close
                </button>
              </div>

              {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

              {isLoadingAvatars ? (
                <p className="text-gray-300">Loading avatars...</p>
              ) : (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                  {avatars.map((avatar) => (
                    <button
                      key={avatar}
                      onClick={() => handleAvatarSelect(avatar)}
                      disabled={isSaving}
                      className="group rounded-lg border border-zinc-700 p-1 hover:border-green-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <img
                        src={avatar}
                        alt="Avatar option"
                        className="h-20 w-20 rounded-md object-cover"
                        onError={(e) => {
                          e.currentTarget.src = DEFAULT_AVATAR;
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}