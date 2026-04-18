"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { DEFAULT_AVATAR } from "@/lib/avatar";

type EditableField = "username" | "email" | "password";

export default function Home() {
  const { data: session, update } = useSession();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [avatars, setAvatars] = useState<string[]>([]);
  const [isLoadingAvatars, setIsLoadingAvatars] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [canChangePassword, setCanChangePassword] = useState(false);
  const [usernameValue, setUsernameValue] = useState("");
  const [emailValue, setEmailValue] = useState("");
  const [passwordValue, setPasswordValue] = useState("");

  const currentImage = session?.user?.image || DEFAULT_AVATAR;

  useEffect(() => {
    let isMounted = true;

    async function loadProfileMeta() {
      try {
        const res = await fetch("/api/auth/profile", { method: "GET" });
        const data = (await res.json()) as { canChangePassword?: boolean };

        if (!isMounted) return;
        setCanChangePassword(Boolean(data.canChangePassword));
      } catch {
        if (!isMounted) return;
        setCanChangePassword(false);
      }
    }

    if (session?.user) {
      loadProfileMeta();
    }

    return () => {
      isMounted = false;
    };
  }, [session]);

  function startEditing(field: EditableField) {
    setProfileError(null);
    setProfileSuccess(null);
    setEditingField(field);

    if (field === "username") {
      setUsernameValue(session?.user?.name || "");
    }
    if (field === "email") {
      setEmailValue(session?.user?.email || "");
    }
    if (field === "password") {
      setPasswordValue("");
    }
  }

  function cancelEditing() {
    setEditingField(null);
    setProfileError(null);
    setProfileSuccess(null);
    setPasswordValue("");
  }

  async function saveField(field: EditableField) {
    if (isSaving) return;

    setIsSaving(true);
    setProfileError(null);
    setProfileSuccess(null);

    try {
      const payload: { username?: string; email?: string; password?: string } = {};

      if (field === "username") payload.username = usernameValue;
      if (field === "email") payload.email = emailValue;
      if (field === "password") payload.password = passwordValue;

      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as {
        error?: string;
        message?: string;
        user?: { username?: string | null; email?: string | null };
      };

      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      const nextName = data.user?.username || session?.user?.name || "";
      const nextEmail = data.user?.email || session?.user?.email || "";

      setUsernameValue(nextName);
      setEmailValue(nextEmail);
      setPasswordValue("");
      await update({ name: nextName, email: nextEmail });

      setProfileSuccess(data.message || "Profile updated");
      setEditingField(null);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  }

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

        <div className="mt-8 space-y-4 max-w-2xl">
          <div className="flex items-center justify-between gap-4 border border-gray-700 rounded-lg p-3">
            <div className="flex-1">
              <p className="text-sm text-gray-400">Username</p>
              {editingField === "username" ? (
                <input
                  value={usernameValue}
                  onChange={(e) => setUsernameValue(e.target.value)}
                  className="mt-1 w-full rounded bg-zinc-800 px-3 py-2 text-white outline-none ring-1 ring-zinc-600 focus:ring-green-500"
                />
              ) : (
                <p className="mt-1 text-white">{session?.user?.name || "-"}</p>
              )}
            </div>

            {editingField === "username" ? (
              <div className="flex gap-2">
                <button
                  onClick={() => saveField("username")}
                  disabled={isSaving}
                  className="rounded bg-green-600 px-3 py-2 text-sm hover:bg-green-700 disabled:opacity-60"
                >
                  Save
                </button>
                <button
                  onClick={cancelEditing}
                  className="rounded bg-zinc-700 px-3 py-2 text-sm hover:bg-zinc-600"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => startEditing("username")}
                className="rounded bg-blue-600 px-3 py-2 text-sm hover:bg-blue-700"
              >
                Change
              </button>
            )}
          </div>

          <div className="flex items-center justify-between gap-4 border border-gray-700 rounded-lg p-3">
            <div className="flex-1">
              <p className="text-sm text-gray-400">Email</p>
              {editingField === "email" ? (
                <input
                  value={emailValue}
                  onChange={(e) => setEmailValue(e.target.value)}
                  className="mt-1 w-full rounded bg-zinc-800 px-3 py-2 text-white outline-none ring-1 ring-zinc-600 focus:ring-green-500"
                />
              ) : (
                <p className="mt-1 text-white">{session?.user?.email || "-"}</p>
              )}
            </div>

            {editingField === "email" ? (
              <div className="flex gap-2">
                <button
                  onClick={() => saveField("email")}
                  disabled={isSaving}
                  className="rounded bg-green-600 px-3 py-2 text-sm hover:bg-green-700 disabled:opacity-60"
                >
                  Save
                </button>
                <button
                  onClick={cancelEditing}
                  className="rounded bg-zinc-700 px-3 py-2 text-sm hover:bg-zinc-600"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => startEditing("email")}
                className="rounded bg-blue-600 px-3 py-2 text-sm hover:bg-blue-700"
              >
                Change
              </button>
            )}
          </div>

          {canChangePassword && (
            <div className="flex items-center justify-between gap-4 border border-gray-700 rounded-lg p-3">
              <div className="flex-1">
                <p className="text-sm text-gray-400">Password</p>
                {editingField === "password" ? (
                  <input
                    type="password"
                    value={passwordValue}
                    onChange={(e) => setPasswordValue(e.target.value)}
                    placeholder="Enter new password"
                    className="mt-1 w-full rounded bg-zinc-800 px-3 py-2 text-white outline-none ring-1 ring-zinc-600 focus:ring-green-500"
                  />
                ) : (
                  <p className="mt-1 text-white">********</p>
                )}
              </div>

              {editingField === "password" ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => saveField("password")}
                    disabled={isSaving}
                    className="rounded bg-green-600 px-3 py-2 text-sm hover:bg-green-700 disabled:opacity-60"
                  >
                    Save
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="rounded bg-zinc-700 px-3 py-2 text-sm hover:bg-zinc-600"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => startEditing("password")}
                  className="rounded bg-blue-600 px-3 py-2 text-sm hover:bg-blue-700"
                >
                  Change
                </button>
              )}
            </div>
          )}

          {profileError && <p className="text-sm text-red-400">{profileError}</p>}
          {profileSuccess && <p className="text-sm text-green-400">{profileSuccess}</p>}
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