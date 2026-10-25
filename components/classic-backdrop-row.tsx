"use client";

import {
  CUSTOM_SIZE_MAX,
  CUSTOM_SIZE_MIN,
  parseCustomSize,
  type CustomSize,
} from "@/lib/custom-size";
import { useEffect, useState } from "react";

export type ClassicBackdropId = "white" | "black" | "transparent" | "original";

const CHOICES: { id: ClassicBackdropId; label: string; swatch: string }[] = [
  { id: "white", label: "White", swatch: "#FFFFFF" },
  { id: "black", label: "Black", swatch: "#111111" },
  { id: "transparent", label: "Transparent", swatch: "transparent" },
  { id: "original", label: "Original", swatch: "" },
];

export function ClassicBackdropRow({
  active,
  onSelect,
  customSize,
  onCustomSize,
  onClearCustomSize,
}: {
  active: ClassicBackdropId | null;
  onSelect: (id: ClassicBackdropId) => void;
  customSize: CustomSize | null;
  onCustomSize: (size: CustomSize) => void;
  onClearCustomSize: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [width, setWidth] = useState(customSize ? String(customSize.width) : "1512");
  const [height, setHeight] = useState(customSize ? String(customSize.height) : "1512");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setWidth(customSize ? String(customSize.width) : "1512");
    setHeight(customSize ? String(customSize.height) : "1512");
    setError(null);
  }, [open, customSize]);

  function apply() {
    const size = parseCustomSize(width, height);
    if (!size) {
      setError(`Use whole numbers from ${CUSTOM_SIZE_MIN} to ${CUSTOM_SIZE_MAX}.`);
      return;
    }
    setError(null);
    onCustomSize(size);
  }

  return (
    <div>
      <div className="grid grid-cols-5 gap-1.5">
        {CHOICES.map((choice) => {
          const selected = active === choice.id;
          return (
            <button
              key={choice.id}
              type="button"
              onClick={() => {
                setOpen(false);
                onSelect(choice.id);
              }}
              className={`min-w-0 overflow-hidden rounded-xl border px-0.5 py-2 text-center text-[10px] font-semibold leading-tight sm:text-[11px] ${
                selected ? "border-primary bg-primary/10" : "border-primary/20 bg-white"
              }`}
            >
              <Swatch kind={choice.swatch} />
              <TileLabel label={choice.label} />
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className={`min-w-0 overflow-hidden rounded-xl border px-0.5 py-2 text-center text-[10px] font-semibold leading-tight sm:text-[11px] ${
            open || customSize ? "border-primary bg-primary/10" : "border-primary/20 bg-white"
          }`}
        >
          <span className="mx-auto mb-1 grid h-7 w-7 place-items-center rounded-lg border border-dashed border-primary/40 bg-white text-primary">
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
              <path
                d="M8 4H4v4M16 4h4v4M8 20H4v-4M16 20h4v-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <TileLabel label="Custom" />
          {customSize ? (
            <span className="mt-0.5 block w-full break-all text-[9px] font-semibold leading-tight text-primary">
              {customSize.width}×{customSize.height}
            </span>
          ) : null}
        </button>
      </div>
      {open ? (
        <div className="mt-2 rounded-xl border border-primary/25 bg-white p-2.5">
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[11px] font-semibold text-foreground/70">
              Width
              <input
                autoFocus
                inputMode="numeric"
                value={width}
                onChange={(e) => setWidth(e.target.value.replace(/[^\d]/g, ""))}
                className="mt-1 w-full rounded-lg border border-primary/25 bg-background px-3 py-2 text-sm text-foreground"
              />
            </label>
            <label className="text-[11px] font-semibold text-foreground/70">
              Height
              <input
                inputMode="numeric"
                value={height}
                onChange={(e) => setHeight(e.target.value.replace(/[^\d]/g, ""))}
                className="mt-1 w-full rounded-lg border border-primary/25 bg-background px-3 py-2 text-sm text-foreground"
              />
            </label>
          </div>
          {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={apply}
              className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white"
            >
              Use this size
            </button>
            {customSize ? (
              <button
                type="button"
                onClick={() => {
                  onClearCustomSize();
                  setOpen(false);
                }}
                className="rounded-full px-3 py-2 text-xs font-semibold text-foreground/70"
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TileLabel({ label }: { label: string }) {
  const lines = label === "Transparent" ? ["Trans", "parent"] : [label];
  return (
    <span className="block min-h-[2.2em] w-full overflow-hidden text-center leading-tight">
      {lines.map((line) => (
        <span key={line} className="block">
          {line}
        </span>
      ))}
    </span>
  );
}

function Swatch({ kind }: { kind: string }) {
  return (
    <span
      className="mx-auto mb-1 block h-7 w-7 rounded-lg border border-black/10"
      style={
        kind === "transparent"
          ? {
              backgroundImage:
                "linear-gradient(45deg,#ccc 25%,transparent 25%),linear-gradient(-45deg,#ccc 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ccc 75%),linear-gradient(-45deg,transparent 75%,#ccc 75%)",
              backgroundSize: "8px 8px",
              backgroundPosition: "0 0,0 4px,4px -4px,-4px 0",
            }
          : kind
            ? { background: kind }
            : { background: "linear-gradient(135deg,#fff,#d9d3e6)" }
      }
    />
  );
}
