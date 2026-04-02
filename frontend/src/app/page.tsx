import PokerBackground from "@/components/PokerBackground";

export default function Home() {
  return (
    <div className="relative flex items-center justify-center min-h-[calc(100vh-64px)] bg-black overflow-hidden">
      <PokerBackground />
      <h1 className="relative z-10 text-4xl font-bold text-red-500 tracking-widest drop-shadow-[0_0_10px_rgba(231,0,0,0.7)]">
        WELCOME TO FT_TRANSCENDENCE
      </h1>
    </div>
  );
}