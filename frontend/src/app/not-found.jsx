import Link from "next/link";
import { VARIANT_BG, DEFAULT_VARIANT } from "@/constants/BackgroundVariants";

export default function NotFound() {
  return (
    <main className="relative min-h-[calc(100vh-64px)]" style={{ backgroundColor: VARIANT_BG[DEFAULT_VARIANT] }}>
      <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-3xl flex-col items-center justify-center px-6 text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-pokerred">Error 404</p>
        <h1 className="mb-4 text-4xl font-bold text-pokerred drop-shadow-[0_0_10px_rgba(231,0,0,0.7)] sm:text-5xl">Page not found</h1>
        <p className="mb-8 max-w-xl text-base text-gray-300 sm:text-lg">
          The page you requested does not exist or may have been moved.
        </p>
        <Link
          href="/"
          className="rounded-lg bg-gray-800 px-6 py-2 text-sm font-semibold text-gray-300 transition hover:bg-gray-700"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
