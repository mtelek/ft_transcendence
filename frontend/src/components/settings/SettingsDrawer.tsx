"use client";

import { useEffect } from "react";
import { usePokerSettings } from "@/lib/poker-settings/context";
import { AppearanceTab } from "./tabs/AppearanceTab";

export function SettingsDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { restoreDefaults } = usePokerSettings();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        className="fixed inset-0 z-[70]"
      />

      <aside
        role="dialog"
        aria-label="Poker settings"
        className="border-l border-slate-800 shadow-2xl flex flex-col"
        style={{
          position: "fixed",
          top: "50%",
          right: "16px",
          transform: "translateY(-50%)",
          height: "70vh",
          width: "min(380px, 90vw)",
          zIndex: 75,
          background: "#020617",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        <header className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-white">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="w-8 h-8 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center text-xl leading-none"
          >
            ×
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5" style={{ background: "#0f172a" }}>
          <AppearanceTab />
        </div>

        <footer className="border-t border-slate-800 px-5 py-3">
          <button
            type="button"
            onClick={restoreDefaults}
            className="w-full px-3 py-2 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            Restore defaults
          </button>
        </footer>
      </aside>
    </>
  );
}
