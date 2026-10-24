"use client";

export function ReflectionControls({
  enabled,
  opacity,
  onEnabled,
  onOpacity,
}: {
  enabled: boolean;
  opacity: number;
  onEnabled: (value: boolean) => void;
  onOpacity: (value: number) => void;
}) {
  return (
    <div className="rounded-xl border border-primary/15 bg-background/40 px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-foreground">Reflection</p>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => onEnabled(!enabled)}
          className={`relative h-6 w-11 rounded-full transition ${
            enabled ? "bg-primary" : "bg-foreground/20"
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
              enabled ? "left-5" : "left-0.5"
            }`}
          />
        </button>
      </div>
      {enabled ? (
        <label className="mt-2 block text-[11px] text-foreground/60">
          Opacity {opacity}
          <input
            type="range"
            min={10}
            max={100}
            value={opacity}
            onChange={(e) => onOpacity(Number(e.target.value))}
            className="mt-1 w-full accent-primary"
          />
        </label>
      ) : null}
    </div>
  );
}
