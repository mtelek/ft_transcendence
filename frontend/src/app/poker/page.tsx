import { requireExistingUserSession } from "@/lib/require-existing-user-session";
import { PokerSettingsProvider } from "@/lib/poker-settings/context";
import PokerTable from "./PokerTable";

export default async function PokerPage() {
  const { session } = await requireExistingUserSession();

  return (
    <PokerSettingsProvider>
      <PokerTable username={session.user?.name ?? "Anonymous"} />
    </PokerSettingsProvider>
  );
}
