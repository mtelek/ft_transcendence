"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { DEFAULT_AVATAR } from "@/lib/avatar";
import { apiRequest } from "@/lib/client-api";
import EditableFieldRow from "@/components/EditableFieldRow";

//Editable profile fields supported by this page
type EditableField = "username" | "email" | "password";

//Normalize unknown errors into user-friendly strings
function getErrorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

export default function Home() {
  //Session gives current user data; update lets us refresh client session values after edits
  const { data: session, update } = useSession();

  //Avatar picker state
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [avatars, setAvatars] = useState<string[]>([]);
  const [isLoadingAvatars, setIsLoadingAvatars] = useState(false);

  //Shared saving/error state used by profile and avatar actions
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  //Inline edit mode state for profile fields
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [canChangePassword, setCanChangePassword] = useState(false);
  const [usernameValue, setUsernameValue] = useState("");
  const [emailValue, setEmailValue] = useState("");
  const [passwordValue, setPasswordValue] = useState("");

  //Hidden file input ref used for avatar upload
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  //Display helpers derived from session
  const currentImage = session?.user?.image ?? DEFAULT_AVATAR;
  const sessionUserEmail = session?.user?.email;

  //Reused by both avatar select and avatar upload flows
  //Validates returned image path, updates session avatar, then closes the picker
  async function applyAvatarImageOrThrow(image: unknown, invalidMessage: string) {
    if (typeof image !== "string") {
      throw new Error(invalidMessage);
    }

    await update({ image });
    setIsPickerOpen(false);
  }

  useEffect(() => {
    //Guard against state updates after unmount while async request is in flight
    let isMounted = true;

    async function loadProfileMeta() {
      try {
        const data = await apiRequest<{ canChangePassword?: boolean }>(
          "/api/auth/profile",
          { method: "GET" },
          "Failed to load profile"
        );

        if (!isMounted) return;
        setCanChangePassword(Boolean(data.canChangePassword));
      } catch {
        if (!isMounted) return;
        setCanChangePassword(false);
      }
    }

    //Load capabilities only when a user exists
    if (session?.user) {
      loadProfileMeta();
    }

    return () => {
      isMounted = false;
    };
  }, [sessionUserEmail]);

  function startEditing(field: EditableField) {
    //Enter edit mode for one field and reset old status messages
    setProfileError(null);
    setProfileSuccess(null);
    setEditingField(field);

    switch (field) {
      case "username":
        setUsernameValue(session?.user?.name ?? "");
        break;
      case "email":
        setEmailValue(session?.user?.email ?? "");
        break;
      case "password":
        setPasswordValue("");
        break;
    }
  }

  function cancelEditing() {
    //Exit edit mode and clear transient values/messages
    setEditingField(null);
    setProfileError(null);
    setProfileSuccess(null);
    setPasswordValue("");
  }

  async function saveField(field: EditableField) {
    //Prevent overlapping save requests
    if (isSaving) return;

    setIsSaving(true);
    setProfileError(null);
    setProfileSuccess(null);

    try {
      //Build a minimal PATCH payload containing only the edited field
      const payload: { username?: string; email?: string; password?: string } = {};
      if (field === "username") payload.username = usernameValue;
      else if (field === "email") payload.email = emailValue;
      else payload.password = passwordValue;

      const data = await apiRequest<{
        message?: string;
        user?: { username?: string | null; email?: string | null };
      }>(
        "/api/auth/profile",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
        "Failed to update profile"
      );

      const nextName = data.user?.username ?? session?.user?.name ?? "";
      const nextEmail = data.user?.email ?? session?.user?.email ?? "";

      //Keep local form values and session in sync with server response
      setUsernameValue(nextName);
      setEmailValue(nextEmail);
      setPasswordValue("");
      await update({ name: nextName, email: nextEmail });

      setProfileSuccess(data.message || "Profile updated");
      setEditingField(null);
    } catch (err) {
      setProfileError(getErrorMessage(err, "Failed to update profile"));
    } finally {
      setIsSaving(false);
    }
  }

  async function openAvatarPicker() {
    //Open modal first, then load available avatar options
    setError(null);
    setIsPickerOpen(true);
    setIsLoadingAvatars(true);

    try {
      const data = await apiRequest<{ avatars?: string[] }>(
        "/api/auth/avatar",
        { method: "GET" },
        "Failed to load avatars"
      );

      if (!Array.isArray(data.avatars)) {
        throw new Error("Failed to load avatars");
      }

      setAvatars(data.avatars);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load avatars"));
    } finally {
      setIsLoadingAvatars(false);
    }
  }

  async function handleAvatarSelect(avatarPath: string) {
    //Prevent parallel avatar updates
    if (isSaving) return;

    setIsSaving(true);
    setError(null);

    try {
      const data = await apiRequest<{ image?: string }>(
        "/api/auth/avatar",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: avatarPath }),
        },
        "Failed to update avatar"
      );

      await applyAvatarImageOrThrow(data.image, "Failed to update avatar");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update avatar"));
    } finally {
      setIsSaving(false);
    }
  }

  function openUploadDialog() {
    //Trigger hidden file input from a styled button
    uploadInputRef.current?.click();
  }

  async function handleAvatarUpload(event: ChangeEvent<HTMLInputElement>) {
    //Read selected file from hidden input
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    //If a save is already running, reset input and ignore this selection
    if (isSaving) {
      event.target.value = "";
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      //Send file as multipart/form-data to avatar upload endpoint
      const formData = new FormData();
      formData.append("file", file);

      const data = await apiRequest<{ image?: string }>(
        "/api/auth/avatar",
        {
          method: "POST",
          body: formData,
        },
        "Failed to upload avatar"
      );

      await applyAvatarImageOrThrow(data.image, "Failed to upload avatar");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to upload avatar"));
    } finally {
      event.target.value = "";
      setIsSaving(false);
    }
  }

  return (
    //Main account settings layout
    <div className="min-h-screen bg-black text-white">
      <div className="ml-[33vw] p-6">
        <h1 className="text-3xl font-bold">Account</h1>

        <div className="border-b border-gray-700 my-4"></div>

        <div className="flex items-center gap-4">
          {/* Current avatar preview with safe fallback if image fails to load */}
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
          {/* Reusable editable rows for profile fields */}
          <EditableFieldRow
            label="Username"
            field="username"
            editingField={editingField}
            value={usernameValue}
            displayValue={session?.user?.name || "-"}
            isSaving={isSaving}
            onChangeValue={setUsernameValue}
            onStartEdit={startEditing}
            onSave={saveField}
            onCancel={cancelEditing}
          />

          <EditableFieldRow
            label="Email"
            field="email"
            editingField={editingField}
            value={emailValue}
            displayValue={session?.user?.email || "-"}
            isSaving={isSaving}
            onChangeValue={setEmailValue}
            onStartEdit={startEditing}
            onSave={saveField}
            onCancel={cancelEditing}
          />

          {canChangePassword && (
            <EditableFieldRow
              label="Password"
              field="password"
              editingField={editingField}
              value={passwordValue}
              displayValue="********"
              isSaving={isSaving}
              onChangeValue={setPasswordValue}
              onStartEdit={startEditing}
              onSave={saveField}
              onCancel={cancelEditing}
              inputType="password"
              placeholder="Enter new password"
            />
          )}

          {profileError && <p className="text-sm text-red-400">{profileError}</p>}
          {profileSuccess && <p className="text-sm text-green-400">{profileSuccess}</p>}
        </div>

        {isPickerOpen && (
          //Avatar picker modal overlay
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-3xl rounded-xl border border-gray-700 bg-zinc-900 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Choose an avatar</h2>
                <div className="flex items-center gap-2">
                  <input
                    ref={uploadInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                  <button
                    onClick={openUploadDialog}
                    disabled={isSaving}
                    className="rounded bg-blue-600 px-3 py-1 text-sm hover:bg-blue-700 disabled:opacity-60"
                  >
                    Upload profile picture
                  </button>
                  <button
                    onClick={() => setIsPickerOpen(false)}
                    className="rounded bg-zinc-700 px-3 py-1 text-sm hover:bg-zinc-600"
                  >
                    Close
                  </button>
                </div>
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