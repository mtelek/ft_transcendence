import type { PokerSettings } from "./types";
import { DEFAULT_SETTINGS } from "./defaults";

const KEY = "poker-settings-v1";

export function loadSettings(): PokerSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      custom: { ...DEFAULT_SETTINGS.custom, ...(parsed.custom ?? {}) },
      blinds: { ...DEFAULT_SETTINGS.blinds, ...(parsed.blinds ?? {}) },
    };
  } catch {
    return null;
  }
}

export function saveSettings(s: PokerSettings): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* quota / private mode — ignore */
  }
}

export function clearSettings(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
