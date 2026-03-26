import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Chat from "@/components/Chat";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) redirect("/login");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6">
      <h1 className="text-3xl font-bold">Welcome, {session.user?.name}!</h1>
      <Chat username={session.user?.name ?? "Anonymous"} />
    </div>
  );
}
