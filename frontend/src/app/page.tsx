import PokerBackground from "@/components/PokerBackground";
import { VARIANT_BG, DEFAULT_VARIANT } from "@/constants/BackgroundVariants";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-64px)] text-white">
      {/* Keep the animated hero separate so the footer can sit below it and scroll naturally. */}
      <section className="relative flex min-h-[calc(100vh-64px)] items-center justify-center overflow-hidden px-6">
        <PokerBackground />
        <h1 className="relative z-10 text-center text-4xl font-bold tracking-widest text-red-500 drop-shadow-[0_0_10px_rgba(231,0,0,0.7)]">
          WELCOME TO FT_TRANSCENDENCE
        </h1>
      </section>

      {/* LEGAL / FOOTER SECTION */}
      <section
        className="flex min-h-[33vh] flex-col items-center justify-center gap-6 border-t border-gray-800 px-6 py-10"
        style={{ backgroundColor: VARIANT_BG[DEFAULT_VARIANT] }}
      >
        <div className="flex flex-wrap justify-center gap-6">
          <Link
            href="/privacy"
            className="rounded-lg bg-gray-800 px-6 py-2 transition hover:bg-gray-700">
            Privacy Policy
          </Link>

          <Link
            href="/terms"
            className="rounded-lg bg-gray-800 px-6 py-2 transition hover:bg-gray-700">
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