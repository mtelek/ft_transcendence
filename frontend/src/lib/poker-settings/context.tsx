"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CustomChoice, PokerSettings, ThemeVisuals } from "./types";
import { DEFAULT_SETTINGS } from "./defaults";
import { PRESETS, resolveCustom } from "./presets";
import { clearSettings, loadSettings, saveSettings } from "./storage";

type Ctx = {
  settings: PokerSettings;
  visuals: ThemeVisuals;
  update: (partial: Partial<PokerSettings>) => void;
  updateCustom: (partial: Partial<CustomChoice>) => void;
  restoreDefaults: () => void;
  hydrated: boolean;
};

const PokerSettingsContext = createContext<Ctx | null>(null);

export function PokerSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PokerSettings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = loadSettings();
    // SSR-safe hydration: one-shot post-mount load from localStorage.
    if (saved) setSettings(saved);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveSettings(settings);
  }, [settings, hydrated]);

  const update = useCallback((partial: Partial<PokerSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  const updateCustom = useCallback((partial: Partial<CustomChoice>) => {
    setSettings((prev) => ({
      ...prev,
      theme: "custom",
      custom: { ...prev.custom, ...partial },
    }));
  }, []);

  const restoreDefaults = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    clearSettings();
  }, []);

  const visuals = useMemo<ThemeVisuals>(() => {
    if (settings.theme === "custom") return resolveCustom(settings.custom);
    return PRESETS[settings.theme];
  }, [settings]);

  const value = useMemo<Ctx>(
    () => ({ settings, visuals, update, updateCustom, restoreDefaults, hydrated }),
    [settings, visuals, update, updateCustom, restoreDefaults, hydrated],
  );

  return (
    <PokerSettingsContext.Provider value={value}>
      {children}
    </PokerSettingsContext.Provider>
  );
}

export function usePokerSettings() {
  const ctx = useContext(PokerSettingsContext);
  if (!ctx) {
    throw new Error("usePokerSettings must be used inside <PokerSettingsProvider>");
  }
  return ctx;
}
