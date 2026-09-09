"use client";

import {
  getUpcomingFestivals,
  LOGO_PLACEMENT_LABELS,
  LOGO_PLACEMENTS,
  type LogoPlacement,
} from "@/lib/brand-options";
import { useMemo, useState } from "react";

export type BrandFormState = {
  brandName: string;
  marketingLine: string;
  grams: string;
  festivalId: string;
  watermark: boolean;
  logoPlacement: LogoPlacement;
  logoBase64: string | null;
  logoMimeType: string | null;
};

export const EMPTY_BRAND: BrandFormState = {
  brandName: "",
  marketingLine: "",
  grams: "",
  festivalId: "none",
  watermark: false,
  logoPlacement: "corner_br",
  logoBase64: null,
  logoMimeType: null,
};

export function BrandMarketingPanel({
  value,
  onChange,
  locked,
}: {
  value: BrandFormState;
  onChange: (next: BrandFormState) => void;
  locked?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const festivals = useMemo(() => getUpcomingFestivals(7), []);

  async function onLogoFile(file: File | null) {
    if (!file) {
      onChange({ ...value, logoBase64: null, logoMimeType: null });
      return;
    }
    if (!file.type.startsWith("image/")) return;
    if (file.size > 600_000) {
      window.alert("Logo should be under ~600 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const base64 = result.split(",")[1] ?? "";
      onChange({
        ...value,
        logoBase64: base64 || null,
        logoMimeType: file.type || "image/png",
        watermark: true,
      });
    };
    reader.readAsDataURL(file);
  }

  if (locked) {
    return (
      <p className="rounded-lg bg-primary/10 px-3 py-2 text-[11px] text-foreground/65">
        Brand name, logo, festival banner &amp; watermark unlock on Gold+.
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-background/30">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-semibold uppercase tracking-widest text-primary/90"
      >
        Brand &amp; festival
        <span className="text-foreground/50">{open ? "−" : "+"}</span>
      </button>
      {open ? (
        <div className="space-y-3 border-t border-primary/15 px-3 py-3">
          <input
            type="text"
            placeholder="Brand name"
            value={value.brandName}
            onChange={(e) =>
              onChange({ ...value, brandName: e.target.value.slice(0, 80) })
            }
            className="w-full rounded-lg border border-primary/25 bg-background/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="text"
            placeholder="Marketing line / festival banner text"
            value={value.marketingLine}
            onChange={(e) =>
              onChange({
                ...value,
                marketingLine: e.target.value.slice(0, 160),
              })
            }
            className="w-full rounded-lg border border-primary/25 bg-background/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-[10px] text-foreground/45">
            Brand name, marketing line, and grams are rendered as readable text on the generated image.
          </p>
          <input
            type="text"
            placeholder="Grams / weight (e.g. 8.2g)"
            value={value.grams}
            onChange={(e) =>
              onChange({ ...value, grams: e.target.value.slice(0, 40) })
            }
            className="w-full rounded-lg border border-primary/25 bg-background/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          <div>
            <p className="text-[11px] text-foreground/55">Festival</p>
            <select
              value={value.festivalId}
              onChange={(e) =>
                onChange({ ...value, festivalId: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-primary/25 bg-background/40 px-3 py-2 text-sm"
            >
              {festivals.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground/80">
            <input
              type="checkbox"
              checked={value.watermark}
              onChange={(e) =>
                onChange({ ...value, watermark: e.target.checked })
              }
            />
            Watermark / logo on image
          </label>
          <div>
            <p className="text-[11px] text-foreground/55">Logo placement</p>
            <select
              value={value.logoPlacement}
              onChange={(e) =>
                onChange({
                  ...value,
                  logoPlacement: e.target.value as LogoPlacement,
                })
              }
              className="mt-1 w-full rounded-lg border border-primary/25 bg-background/40 px-3 py-2 text-sm"
            >
              {LOGO_PLACEMENTS.map((p) => (
                <option key={p} value={p}>
                  {LOGO_PLACEMENT_LABELS[p]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="mb-1 text-[11px] text-foreground/55">Brand logo (optional)</p>
            {value.logoBase64 ? (
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-primary/25 bg-background/60">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`data:${value.logoMimeType ?? "image/png"};base64,${value.logoBase64}`}
                    alt="Logo preview"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <button
                  type="button"
                  className="text-xs text-primary underline"
                  onClick={() =>
                    onChange({
                      ...value,
                      logoBase64: null,
                      logoMimeType: null,
                    })
                  }
                >
                  Remove logo
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary/30 bg-background/40 px-3 py-4 text-xs text-foreground/60 transition hover:border-primary/50 hover:bg-background/60">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Click to upload logo (PNG, JPG, WebP)
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => void onLogoFile(e.target.files?.[0] ?? null)}
                />
              </label>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
