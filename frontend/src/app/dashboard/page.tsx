import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import PokerBackground from "@/components/PokerBackground";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) redirect("/login");

  return (
    <div className="relative min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8">
      <PokerBackground />
      <div className="relative z-10 flex flex-col items-center">
        <h1 className="text-3xl font-bold text-white mb-10">
          Welcome, {session.user?.name}!
        </h1>

        <div className="flex flex-wrap justify-center" style={{ gap: "40px" }}>
          <Link href="/poker" className="group flex flex-col" style={{ width: "600px" }}>
            <img
              src="/poker-preview.png"
              alt="Poker"
              className="rounded-2xl shadow-lg object-cover group-hover:scale-105 transition-transform"
              style={{ width: "600px", height: "375px" }}
            />
            <p className="text-center text-white font-medium mt-3">Poker</p>
          </Link>

          <div className="flex flex-col cursor-not-allowed" style={{ width: "600px" }}>
            <div className="relative rounded-2xl shadow-lg overflow-hidden" style={{ width: "600px", height: "375px" }}>
              <img
                src="/dark-poker-background-of-spades-and-clubs.jpg"
                alt="Other Game"
                className="w-full h-full object-cover opacity-60"
                style={{ filter: "sepia(1) hue-rotate(190deg) saturate(3) brightness(0.8)" }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white text-sm font-medium bg-black/50 px-3 py-1 rounded-full">Coming Soon</span>
              </div>
            </div>
            <p className="text-center text-white font-medium mt-3">Other Game</p>
          </div>
        </div>
      </div>
    </div>
  );
}
