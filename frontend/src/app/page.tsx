"use client";

import PokerBackground from "@/components/background/PokerBackground";
import { VARIANT_BG, DEFAULT_VARIANT } from "@/constants/BackgroundVariants";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

export default function Home() {
  const prefersReducedMotion = useReducedMotion();

  const cardTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 1, ease: [0.22, 0.61, 0.36, 1] };

  const textTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.45, delay: 0.3, ease: "easeOut" };

  return (
    <div className="min-h-[calc(100vh-64px)] text-white">
      {/* Keep the animated hero separate so the footer can sit below it and scroll naturally. */}
      <section className="relative flex min-h-[calc(100vh-64px)] items-center justify-center overflow-hidden px-6"
        style={{ backgroundColor: VARIANT_BG[DEFAULT_VARIANT] }}>
        <PokerBackground />
        <div className="relative z-10 flex h-20 items-center justify-center" style={{ perspective: 600 }}>
          <motion.div
            className="absolute inset-0 mx-auto h-20 w-[32rem] max-w-[85vw] rounded-xl border border-white/15 bg-gradient-to-br from-slate-900/80 via-slate-800/70 to-slate-900/90 shadow-[0_8px_30px_rgba(0,0,0,0.35)]"
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 1, rotateY: 0, rotateX: 0 }}
            animate={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, rotateY: 180, rotateX: -6 }}
            transition={cardTransition}
            style={{ transformStyle: "preserve-3d" }}
            aria-hidden="true"
          />
          <motion.h1
            className="relative text-center text-4xl font-bold leading-none tracking-widest text-pokerred drop-shadow-[0_0_10px_rgba(231,0,0,0.7)]"
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 6, scale: prefersReducedMotion ? 1 : 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ ...textTransition, scale: { duration: 0.25, delay: prefersReducedMotion ? 0 : 0.4, ease: "easeOut" } }}
          >
            WELCOME TO FT_TRANSCENDENCE
          </motion.h1>
        </div>
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