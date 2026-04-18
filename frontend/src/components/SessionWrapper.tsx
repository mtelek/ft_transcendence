"use client";

import { useEffect } from "react";
import { SessionProvider, useSession } from "next-auth/react";

function PresenceHeartbeat() {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user) {
      return;
    }

    const sendHeartbeat = async () => {
      try {
        await fetch("/api/auth/presence", { method: "POST" });
      } catch {
        // Ignore heartbeat errors and retry on the next interval.
      }
    };

    sendHeartbeat();
    const intervalId = window.setInterval(sendHeartbeat, 5_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [session?.user?.email, session?.user?.name]);

  return null;
}

export default function SessionWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PresenceHeartbeat />
      {children}
    </SessionProvider>
  );
}
