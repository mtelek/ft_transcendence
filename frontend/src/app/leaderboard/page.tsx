import Link from "next/link";
import Image from "next/image";
import Leaderboard from "@/components/poker/stats/Leaderboard";

export default function LeaderboardPage() {
  return (
    <div className="relative min-h-[calc(100vh-64px)] bg-slate-900 flex flex-col items-center justify-center overflow-y-auto px-4 py-10">
      <Image
        src="/dark-poker-background-of-spades-and-clubs.jpg"
        alt=""
        aria-hidden="true"
        fill
        sizes="100vw"
        loading="eager"
        className="absolute inset-0 object-cover opacity-30"
      />

      <div className="relative z-10 w-full max-w-6xl flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold text-white tracking-wide">Leaderboard</h1>
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-full border border-white/20 text-slate-200 hover:text-white hover:border-white/40 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>

        <Leaderboard />
      </div>
    </div>
  );
}
