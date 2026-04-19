"use client";

export function SwatchRow<T extends string>({
  value,
  options,
  swatches,
  onChange,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  swatches: Record<T, string>;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            title={opt.label}
            className={`w-8 h-8 rounded-full border-2 transition-all ${
              active
                ? "border-white scale-110 shadow-lg"
                : "border-white/30 hover:border-white/70"
            }`}
            style={{ background: swatches[opt.value] }}
          />
        );
      })}
    </div>
  );
}
