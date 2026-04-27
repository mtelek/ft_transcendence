"use client";

import Image from "next/image";

export function SettingsGearButton({
  onClick,
  open,
}: {
  onClick: () => void;
  open: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open settings"
      aria-expanded={open}
      className="rounded-full flex items-center justify-center transition-transform hover:scale-110"
      style={{
        position: "fixed",
        top: "80px",
        right: "16px",
        zIndex: 60,
        width: "48px",
        height: "48px",
        background: "transparent",
        border: "none",
        padding: 0,
      }}
      title="Settings"
    >
      <Image
        src="/settings_icon.png"
        alt=""
        aria-hidden="true"
        fill
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          filter: "brightness(0) invert(1)",
        }}
      />
    </button>
  );
}
