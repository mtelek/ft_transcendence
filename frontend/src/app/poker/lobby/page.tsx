import { auth } from "@/auth";
import { redirect } from "next/navigation";
import LobbyClient from "./LobbyClient";

export default async function LobbyPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return <LobbyClient username={session.user?.name ?? "Player"} />;
}
