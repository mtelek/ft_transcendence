"use client";

import { useEffect } from "react";
import { SessionProvider, signOut, useSession } from "next-auth/react";
import type { Session } from "next-auth";

type ApiErrorPayload = {
  error?: string;
};

function isStaleSessionResponse(status: number, payload: ApiErrorPayload) {
  if (status === 401) {
    return true;
  }

  return status === 404 && payload.error === "User not found";
}

function PresenceHeartbeat() {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user) {
      return;
    }

    const sendHeartbeat = async () => {
      try {
        const response = await fetch("/api/auth/presence", { method: "POST" });

        if (response.ok) {
          return;
        }

        const payload = (await response.json().catch(() => ({}))) as ApiErrorPayload;

        if (isStaleSessionResponse(response.status, payload)) {
          await signOut({ callbackUrl: "/" });
        }
      } catch {
        // Ignore heartbeat errors and retry on the next interval.
      }
    };

    sendHeartbeat();
    const intervalId = window.setInterval(sendHeartbeat, 5_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [session?.user]);

  return null;
}

type SessionWrapperProps = {
  children: React.ReactNode;
  initialSession?: Session | null;
};

export default function SessionWrapper({ children, initialSession }: SessionWrapperProps) {
  return (
    // Seed SessionProvider with server session to prevent first-paint fallback values.
    <SessionProvider session={initialSession}>
      <PresenceHeartbeat />
      {children}
    </SessionProvider>
  );
}
