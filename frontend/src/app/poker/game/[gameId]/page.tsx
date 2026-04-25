import { requireExistingUserSession } from "@/lib/require-existing-user-session";
import { PokerSettingsProvider } from "@/lib/poker-settings/context";
import GameTable from "./GameTable";

// Check if user is authenticated, if not ->login page
// if yes pass gameID and username to GameTable to start the game

export default async function GamePage({ params }: { params: Promise<{ gameId: string }> }) {
  const { session } = await requireExistingUserSession();

  const { gameId } = await params;

  return (
    <PokerSettingsProvider>
      <GameTable gameId={gameId} username={session.user?.name ?? "Player"} image={session.user?.image ?? ""} />
    </PokerSettingsProvider>
  );
}
