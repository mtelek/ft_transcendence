import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { PokerSettingsProvider } from "@/lib/poker-settings/context";
import PokerTable from "./PokerTable";

export default async function PokerPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <PokerSettingsProvider>
      <PokerTable username={session.user?.name ?? "Anonymous"} />
    </PokerSettingsProvider>
  );
}
