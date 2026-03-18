import { auth } from "@/auth";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) redirect("/login");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-3xl font-bold">Welcome, {session.user?.name}!</h1>
      <p className="text-gray-500">You are logged in as {session.user?.email}</p>
      <LogoutButton />
    </div>
  );
}
