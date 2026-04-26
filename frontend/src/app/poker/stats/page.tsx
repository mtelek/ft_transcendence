import { auth } from "@/auth";
import { redirect } from "next/navigation";
import StatsClient from "./StatsClient";

export default async function PokerStatsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <StatsClient
      username={session.user?.name ?? "Player"}
      image={session.user?.image ?? ""}
    />
  );
}
