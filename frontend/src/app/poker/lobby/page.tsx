import { requireExistingUserSession } from "@/lib/require-existing-user-session";
import LobbyClient from "./LobbyClient";

export default async function LobbyPage() {
  const { session } = await requireExistingUserSession();

  return <LobbyClient username={session.user?.name ?? "Player"} image={session.user?.image ?? ""} />;
}
