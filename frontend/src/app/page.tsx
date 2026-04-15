import MatrixRain from "@/components/MatrixRain";
import Link from "next/link";

export default function Home() {
  return (
    <div className="bg-black text-white">

      {/* HERO SECTION */}
      <section className="relative flex items-center justify-center h-screen overflow-hidden">
        <MatrixRain />

        <h1 className="relative z-10 text-4xl font-bold text-green-400 tracking-widest text-center">
          WELCOME TO FT_TRANSCENDENCE
        </h1>
      </section>

      {/* LEGAL / FOOTER SECTION */}
      <section className="flex flex-col items-center justify-center h-[33vh] gap-6 bg-gradient-to-b from-black to-gray-900 border-t border-gray-800">

        <div className="flex gap-6">
          <Link
            href="/privacy"
            className="px-6 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition">
            Privacy Policy
          </Link>

          <Link
            href="/terms"
            className="px-6 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition">
            Terms of Service
          </Link>
        </div>

        {/* small footer text */}
        <p className="text-xs text-gray-500">
          © 2026 ft_transcendence
        </p>
      </section>
    </div>
  );
}