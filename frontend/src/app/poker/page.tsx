import { auth } from "@/auth";
import { redirect } from "next/navigation";
import PokerTable from "./PokerTable";

export default async function PokerPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return <PokerTable username={session.user?.name ?? "Anonymous"} />;
}
