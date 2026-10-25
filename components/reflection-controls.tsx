"use client";

const FADES = [20, 40, 60, 80, 100] as const;

function nearestFade(opacity: number) {
  return FADES.reduce((best, level) =>
    Math.abs(level - opacity) < Math.abs(best - opacity) ? level : best,
  );
}

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
  const selected = nearestFade(opacity);

  return (
    <div className="rounded-xl border border-primary/15 bg-background/40 px-3 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-foreground">Reflection</p>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => onEnabled(!enabled)}
          className={`relative h-7 w-12 shrink-0 rounded-full transition ${
            enabled ? "bg-primary" : "bg-foreground/20"
          }`}
        >
          <span
            className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition ${
              enabled ? "left-5" : "left-0.5"
            }`}
          />
        </button>
      </div>
      {enabled ? (
        <div
          className="mt-2.5 grid grid-cols-5 gap-1.5"
          role="radiogroup"
          aria-label="Reflection strength"
        >
          {FADES.map((level) => {
            const active = selected === level;
            return (
              <button
                key={level}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={`${level} percent reflection`}
                onClick={() => onOpacity(level)}
                className={`rounded-xl border px-1 py-1.5 ${
                  active ? "border-primary bg-primary/10" : "border-primary/20 bg-white"
                }`}
              >
                <FadeMark strength={level / 100} />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function FadeMark({ strength }: { strength: number }) {
  return (
    <svg viewBox="0 0 40 48" className="mx-auto h-9 w-7" aria-hidden>
      <g opacity={strength}>
        <ellipse cx="20" cy="14" rx="9" ry="11" fill="#c6a15a" />
        <ellipse cx="20" cy="12" rx="3.5" ry="4.5" fill="#f3e2b0" />
        <ellipse cx="20" cy="36" rx="8" ry="6" fill="#c6a15a" />
      </g>
    </svg>
  );
}
