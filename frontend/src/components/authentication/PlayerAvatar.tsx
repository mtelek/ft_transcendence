"use client";

import { useState } from "react";
import Image from "next/image";

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
      <Image
        src={src}
        alt={fallback}
        width={40}
        height={40}
        onError={() => setErr(true)}
        className={`${className} object-cover`}
        unoptimized
      />
    );
  }

  return (
    <div className={`${className} flex items-center justify-center text-sm font-bold text-white bg-slate-600`}>
      {fallback[0]?.toUpperCase()}
    </div>
  );
}
