import MatrixRain from "@/components/MatrixRain";

export default function Home() {
  return (
    <div className="relative flex items-center justify-center min-h-[calc(100vh-64px)] bg-black overflow-hidden">
      <MatrixRain />
      <h1 className="relative z-10 text-4xl font-bold text-green-400 tracking-widest drop-shadow-[0_0_10px_rgba(0,255,0,0.7)]">
        WELCOME TO FT_TRANSCENDENCE
      </h1>
    </div>
  );
}