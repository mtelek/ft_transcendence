"use client";

import { useState } from "react";

export function PlayerAvatar({
  src,
  fallback,
  className,
}: {
  src?: string;
  fallback: string;
  className: string;
}) {
  const [err, setErr] = useState(false);

  if (!err && src) {
    return (
      <img
        src={src}
        alt={fallback}
        onError={() => setErr(true)}
        className={`${className} object-cover`}
      />
    );
  }

  return (
    <div className={`${className} flex items-center justify-center text-sm font-bold text-white bg-slate-600`}>
      {fallback[0]?.toUpperCase()}
    </div>
  );
}
