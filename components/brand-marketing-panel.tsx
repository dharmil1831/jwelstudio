"use client";

import {
  BRAND_ACCENT_PRESETS,
  EMPTY_BRAND,
  brandKitReady,
  type BrandFormState,
} from "@/lib/brand-form-state";
import {
  getUpcomingFestivals,
  LOGO_PLACEMENT_LABELS,
  LOGO_PLACEMENTS,
  type LogoPlacement,
} from "@/lib/brand-options";
import { POSTER_TEMPLATES } from "@/lib/poster-templates";
import { useEffect, useState } from "react";

export type { BrandFormState };
export { EMPTY_BRAND };

export function BrandMarketingPanel({
  value,
  onChange,
  locked,
  initialOpen = true,
}: {
  value: BrandFormState;
  onChange: (next: BrandFormState) => void;
  locked?: boolean;
  initialOpen?: boolean;
}) {
  const [open, setOpen] = useState(initialOpen);
  const kitReady = brandKitReady(value);
  const [festivals, setFestivals] = useState<
    { id: string; label: string; date: string | null; country: string | null }[]
  >(() =>
    getUpcomingFestivals(7).map((f) => ({
      id: f.id,
      label: f.label,
      date: null,
      country: f.id === "none" ? null : "Jewelry calendar",
    })),
  );

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/festivals")
      .then((r) => r.json())
      .then((data: { festivals?: typeof festivals }) => {
        if (cancelled || !Array.isArray(data.festivals) || data.festivals.length === 0) return;
        setFestivals(data.festivals);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

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
          <div className="rounded-xl bg-primary/10 px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
              Marketing post (Scalio-style)
            </p>
            <ol className="mt-1.5 space-y-1 text-[11px] leading-relaxed text-foreground/70">
              <li>1. Add logo, brand, phone, Instagram</li>
              <li>2. Pick festival + template pack</li>
              <li>3. Generate jewelry photo</li>
              <li>4. Share card stamps your brand on the result</li>
            </ol>
            <p className="mt-2 text-[10px] text-foreground/55">
              {kitReady
                ? "Brand details ready for the share card."
                : "Add brand name or logo for a complete share card."}
            </p>
          </div>
          <div>
            <p className="mb-2 text-[11px] text-foreground/55">Template gallery</p>
            <div className="grid grid-cols-1 gap-2">
              {POSTER_TEMPLATES.map((t) => {
                const active = value.posterTemplate === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() =>
                      onChange({ ...value, posterTemplate: t.id })
                    }
                    className={`cursor-pointer rounded-xl border px-3 py-2 text-left transition ${
                      active
                        ? "border-primary bg-primary/15 text-foreground"
                        : "border-primary/20 bg-background/30 text-foreground/75 hover:border-primary/40"
                    }`}
                  >
                    <span className="flex items-start gap-3">
                      <span
                        className="mt-0.5 flex h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-black/10"
                        aria-hidden
                      >
                        <span
                          className="h-full w-1/3"
                          style={{ background: t.swatch[0] }}
                        />
                        <span
                          className="h-full w-1/3"
                          style={{ background: t.swatch[1] }}
                        />
                        <span
                          className="h-full w-1/3"
                          style={{ background: t.swatch[2] }}
                        />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">
                          {t.label}
                        </span>
                        <span className="block text-[11px] text-foreground/55">
                          {t.blurb}
                        </span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-foreground/45">
              Same playbook as Scalio / Photoroom / Flyr: AI photo first, then a
              branded template. Designer PSD flyers can plug in later as blank
              packs.
            </p>
          </div>
          <div>
            <p className="mb-1.5 text-[11px] text-foreground/55">Brand accent</p>
            <div className="flex flex-wrap gap-2">
              {BRAND_ACCENT_PRESETS.map((hex) => {
                const active =
                  value.accentColor.toUpperCase() === hex.toUpperCase();
                return (
                  <button
                    key={hex}
                    type="button"
                    title={hex}
                    onClick={() => onChange({ ...value, accentColor: hex })}
                    className={`h-7 w-7 rounded-full border-2 ${
                      active
                        ? "border-foreground scale-110"
                        : "border-transparent"
                    }`}
                    style={{ background: hex }}
                    aria-label={`Accent ${hex}`}
                  />
                );
              })}
            </div>
          </div>
          <input
            type="text"
            placeholder="Headline (e.g. Pure gold necklace set)"
            value={value.headline}
            onChange={(e) =>
              onChange({ ...value, headline: e.target.value.slice(0, 80) })
            }
            className="w-full rounded-lg border border-primary/25 bg-background/40 px-3 py-2 text-sm text-foreground outline-none placeholder:text-foreground/40 focus:ring-2 focus:ring-primary"
          />
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
          <p className="text-[10px] leading-relaxed text-foreground/45">
            Festival changes the photo scene (props &amp; light). Brand text,
            grams, and logo never appear inside the AI photo — tap{" "}
            <strong className="font-medium text-foreground/65">Preview share card</strong>{" "}
            (or Share card on batch results) after generate.
          </p>
          <input
            type="text"
            placeholder="Phone for the poster"
            value={value.phone}
            onChange={(e) =>
              onChange({ ...value, phone: e.target.value.slice(0, 40) })
            }
            className="w-full rounded-lg border border-primary/25 bg-background/40 px-3 py-2 text-sm text-foreground outline-none placeholder:text-foreground/40 focus:ring-2 focus:ring-primary"
          />
          <input
            type="text"
            placeholder="WhatsApp (optional)"
            value={value.whatsapp}
            onChange={(e) =>
              onChange({ ...value, whatsapp: e.target.value.slice(0, 40) })
            }
            className="w-full rounded-lg border border-primary/25 bg-background/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="text"
            placeholder="Instagram handle (optional)"
            value={value.instagram}
            onChange={(e) =>
              onChange({ ...value, instagram: e.target.value.slice(0, 60) })
            }
            className="w-full rounded-lg border border-primary/25 bg-background/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="text"
            placeholder="Store address (optional)"
            value={value.address}
            onChange={(e) =>
              onChange({ ...value, address: e.target.value.slice(0, 120) })
            }
            className="w-full rounded-lg border border-primary/25 bg-background/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          <textarea
            placeholder={
              "Poster points, one per line\n22K pure gold\nHallmarked\nTrusted quality"
            }
            value={value.highlights}
            onChange={(e) =>
              onChange({ ...value, highlights: e.target.value.slice(0, 240) })
            }
            rows={3}
            className="w-full rounded-lg border border-primary/25 bg-background/40 px-3 py-2 text-sm text-foreground outline-none placeholder:text-foreground/40 focus:ring-2 focus:ring-primary"
          />
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
            <FestivalPicker
              festivals={festivals}
              selectedId={value.festivalId}
              onSelect={(id, label) =>
                onChange({ ...value, festivalId: id, festivalLabel: label })
              }
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground/80">
            <input
              type="checkbox"
              checked={value.watermark}
              onChange={(e) =>
                onChange({ ...value, watermark: e.target.checked })
              }
            />
            Soft watermark on marketing poster
          </label>
          <div>
            <p className="text-[11px] text-foreground/55">
              Logo placement on share card photo (bottom left, top right, etc.)
            </p>
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
                <div className="flex h-20 w-28 items-center justify-center overflow-hidden rounded-lg border border-primary/25 bg-white">
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

type FestivalRow = {
  id: string;
  label: string;
  date: string | null;
  country: string | null;
};

function FestivalPicker({
  festivals,
  selectedId,
  onSelect,
}: {
  festivals: FestivalRow[];
  selectedId: string;
  onSelect: (id: string, label: string) => void;
}) {
  const today = new Date();
  const [cursor, setCursor] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [openDay, setOpenDay] = useState<number | null>(null);
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const title = cursor.toLocaleString("en-US", { month: "long", year: "numeric" });
  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const inMonth = festivals.filter((f) => f.date?.startsWith(monthKey));
  const undated = festivals.filter((f) => f.id !== "none" && !f.date);
  const selected = festivals.find((f) => f.id === selectedId);

  function onDay(day: number) {
    const iso = `${monthKey}-${String(day).padStart(2, "0")}`;
    const hits = inMonth.filter((f) => f.date === iso);
    setOpenDay(day);
    if (hits.length === 1) onSelect(hits[0].id, hits[0].label);
  }

  const openIso = openDay
    ? `${monthKey}-${String(openDay).padStart(2, "0")}`
    : "";
  const openHits = openDay ? inMonth.filter((f) => f.date === openIso) : [];

  return (
    <div className="mt-1 rounded-xl border border-primary/20 bg-secondary p-3">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          className="rounded-lg px-2 py-1 text-sm text-primary"
          onClick={() => {
            setOpenDay(null);
            setCursor(new Date(year, month - 1, 1));
          }}
          aria-label="Previous month"
        >
          ‹
        </button>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <button
          type="button"
          className="rounded-lg px-2 py-1 text-sm text-primary"
          onClick={() => {
            setOpenDay(null);
            setCursor(new Date(year, month + 1, 1));
          }}
          aria-label="Next month"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px]">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={`${d}-${i}`} className="py-1 text-foreground/45">
            {d}
          </span>
        ))}
        {cells.map((day, i) => {
          const iso = day ? `${monthKey}-${String(day).padStart(2, "0")}` : "";
          const hits = day ? inMonth.filter((f) => f.date === iso) : [];
          const chosen = hits.some((f) => f.id === selectedId);
          return (
            <button
              key={`${day ?? "e"}-${i}`}
              type="button"
              disabled={!day || hits.length === 0}
              title={hits.map((f) => f.label).join(", ")}
              onClick={() => day && onDay(day)}
              className={`rounded-lg py-1.5 ${
                chosen
                  ? "bg-primary font-bold text-white"
                  : hits.length
                    ? "bg-primary/20 font-semibold text-foreground"
                    : "text-foreground/70"
              } disabled:cursor-default`}
            >
              {day ?? ""}
            </button>
          );
        })}
      </div>
      {openHits.length > 0 ? (
        <div className="mt-3 rounded-lg bg-background px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
            {title.split(" ")[0]} {openDay}
          </p>
          <ul className="mt-1 space-y-1">
            {openHits.map((f) => (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => onSelect(f.id, f.label)}
                  className={`w-full rounded-lg px-2 py-1.5 text-left text-sm ${
                    f.id === selectedId ? "bg-primary font-semibold text-white" : "hover:bg-primary/10"
                  }`}
                >
                  {f.label}
                  {f.country ? ` · ${f.country}` : ""}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-2 text-xs text-foreground/55">
          Tap a plum day to see which festival it is.
        </p>
      )}
      {selected && selected.id !== "none" ? (
        <p className="mt-2 text-xs text-foreground/70">
          Using {selected.label}
          {selected.country ? ` · ${selected.country}` : ""}
          <button
            type="button"
            className="ml-2 text-primary underline"
            onClick={() => onSelect("none", "")}
          >
            Clear
          </button>
        </p>
      ) : null}
      {undated.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {undated.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onSelect(f.id, f.label)}
              className={`rounded-full px-2 py-1 text-[11px] ${
                f.id === selectedId
                  ? "bg-primary text-white"
                  : "bg-background text-foreground ring-1 ring-primary/20"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
