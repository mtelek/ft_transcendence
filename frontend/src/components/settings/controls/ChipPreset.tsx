"use client";

export function ChipPreset({
  value,
  options,
  onChange,
  format = (n) => `$${n.toLocaleString()}`,
}: {
  value: number;
  options: readonly number[];
  onChange: (v: number) => void;
  format?: (n: number) => string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((n) => {
        const active = n === value;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              active
                ? "bg-white text-slate-900"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            {format(n)}
          </button>
        );
      })}
    </div>
  );
}
