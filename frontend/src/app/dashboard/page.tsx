import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold text-white mb-8">
        Welcome, {session.user?.name}!
      </h1>

      <Link href="/poker" className="group">
        <img
          src="/poker-preview.png"
          alt="Poker"
          className="rounded-2xl shadow-lg w-full group-hover:scale-105 transition-transform" style={{ maxWidth: "40%" }}
        />
        <p className="text-center text-white font-medium mt-3">Poker</p>
      </Link>
    </div>
  );
}
