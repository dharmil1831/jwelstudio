"use client";

import { toUserFacingError } from "@/lib/user-facing-error";
import {
  normalizeThemeStyle,
  parseThemeStyleJson,
  type ThemeStyleSnapshot,
} from "@/lib/themes";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export type ThemeListItem = {
  id: string;
  name: string;
  styleJson: string;
  previewUrl: string | null;
  createdAt: string;
};

type RecentGeneration = {
  id: string;
  resultUrl: string;
  mode: string;
  format: string;
  placement: string;
  subject: string;
  shot: string;
  scene: string;
  vibe: string;
  createdAt: string;
};

export function ThemesPanel({
  locked,
  enabled,
  currentStyle,
  previewUrl,
  appliedThemeId,
  onApply,
  onClear,
}: {
  locked: boolean;
  enabled: boolean;
  currentStyle: ThemeStyleSnapshot;
  previewUrl: string | null;
  appliedThemeId: string | null;
  onApply: (theme: ThemeListItem, style: ThemeStyleSnapshot) => void;
  onClear?: () => void;
}) {
  const [themes, setThemes] = useState<ThemeListItem[]>([]);
  const [recent, setRecent] = useState<RecentGeneration[]>([]);
  const [limit, setLimit] = useState(0);
  const [name, setName] = useState("");
  const [selectedGen, setSelectedGen] = useState<RecentGeneration | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [open, setOpen] = useState(true);
  const [step, setStep] = useState<"save" | "use">("save");

  const effectivePreview = selectedGen?.resultUrl || previewUrl;
  const appliedTheme = themes.find((t) => t.id === appliedThemeId) ?? null;

  const styleForSave = useCallback((): ThemeStyleSnapshot => {
    if (selectedGen) {
      const fromGen = normalizeThemeStyle({
        mode: selectedGen.mode,
        format: selectedGen.format,
        placement: selectedGen.placement,
        subject: selectedGen.subject,
        shot: selectedGen.shot,
        scene: selectedGen.scene,
        vibe: selectedGen.vibe,
        framing: "catalog",
        usePreviewAsReference: true,
      });
      if (fromGen) return fromGen;
    }
    return { ...currentStyle, usePreviewAsReference: true };
  }, [selectedGen, currentStyle]);

  const reload = useCallback(() => {
    if (!enabled) return;
    void fetch("/api/themes")
      .then(async (r) => {
        const data = (await r.json()) as {
          themes?: ThemeListItem[];
          limit?: number;
          error?: string;
        };
        if (!r.ok) throw new Error(data.error ?? "Failed to load themes");
        setThemes(data.themes ?? []);
        setLimit(typeof data.limit === "number" ? data.limit : 0);
      })
      .catch((e) =>
        setError(toUserFacingError(e, "Failed to load themes")),
      );

    void fetch("/api/generations")
      .then(async (r) => {
        if (!r.ok) return;
        const data = (await r.json()) as { items?: RecentGeneration[] };
        const images = (data.items ?? [])
          .filter(
            (g) =>
              g.mode !== "video" && !/\.(mp4|webm)(\?|$)/i.test(g.resultUrl),
          )
          .slice(0, 6);
        setRecent(images);
      })
      .catch(() => {
        /* optional */
      });
  }, [enabled]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (themes.length > 0 && !previewUrl && !effectivePreview) {
      setStep("use");
    }
  }, [themes.length, previewUrl, effectivePreview]);

  async function saveTheme() {
    const trimmed =
      name.trim() ||
      `Look ${new Date().toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    if (!effectivePreview) {
      setError("Generate an image first, then save it as a look.");
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/themes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmed.slice(0, 80),
          previewUrl: effectivePreview,
          style: styleForSave(),
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        theme?: ThemeListItem;
      };
      if (!res.ok) throw new Error(data.error ?? "Could not save");
      setName("");
      setSelectedGen(null);
      reload();
      if (data.theme) {
        const style = parseThemeStyleJson(data.theme.styleJson);
        if (style) onApply(data.theme, style);
      }
      setStep("use");
      setMessage(
        "Saved! Next: upload a NEW jewelry photo above, then press Generate.",
      );
    } catch (e) {
      setError(toUserFacingError(e, "Could not save"));
    } finally {
      setBusy(false);
    }
  }

  async function deleteTheme(id: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/themes/${id}`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not delete");
      if (appliedThemeId === id) onClear?.();
      reload();
    } catch (e) {
      setError(toUserFacingError(e, "Could not delete"));
    } finally {
      setBusy(false);
    }
  }

  if (locked) {
    return (
      <p className="rounded-lg bg-primary/10 px-3 py-2 text-[11px] text-foreground/65">
        Saved looks unlock on{" "}
        <Link href="/pricing" className="font-medium text-primary underline">
          Platinum and above
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-background/30">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-medium uppercase tracking-widest text-primary/90"
      >
        Reuse a look (themes)
        <span className="text-foreground/50">{open ? "−" : "+"}</span>
      </button>

      {open ? (
        <div className="space-y-3 border-t border-primary/15 px-3 py-3">
          {/* Big status */}
          {appliedTheme ? (
            <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2">
              <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-100">
                Using look: {appliedTheme.name}
              </p>
              <p className="mt-1 text-[11px] text-emerald-800/90 dark:text-emerald-200/90">
                1) Upload a new jewelry photo above → 2) Press Generate. Same
                style, new jewelry.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClear?.();
                  setMessage(null);
                }}
                className="mt-2 text-[11px] font-medium text-foreground/70 underline"
              >
                Stop using this look
              </button>
            </div>
          ) : (
            <p className="text-[11px] leading-relaxed text-foreground/60">
              Save one good generation, then reuse that style on other jewelry
              pieces — no need to re-pick model / scene every time.
            </p>
          )}

          {/* Tabs: Save vs Use */}
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-background/50 p-1">
            <button
              type="button"
              onClick={() => setStep("save")}
              className={`rounded-md px-2 py-1.5 text-[11px] font-semibold ${
                step === "save"
                  ? "bg-primary text-background"
                  : "text-foreground/65 hover:bg-primary/10"
              }`}
            >
              1. Save a look
            </button>
            <button
              type="button"
              onClick={() => setStep("use")}
              className={`rounded-md px-2 py-1.5 text-[11px] font-semibold ${
                step === "use"
                  ? "bg-primary text-background"
                  : "text-foreground/65 hover:bg-primary/10"
              }`}
            >
              2. Use a look
            </button>
          </div>

          {step === "save" ? (
            <div className="space-y-3">
              <p className="text-[11px] font-medium text-foreground/80">
                Step 1 — Pick the image you like, give it a name, save.
              </p>

              {!effectivePreview && recent.length === 0 ? (
                <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-[11px] text-amber-900 dark:text-amber-100">
                  Generate an image first (right side). Then come back here to
                  save that look.
                </p>
              ) : (
                <>
                  <p className="text-[10px] uppercase tracking-wide text-foreground/45">
                    Which image to save?
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {previewUrl ? (
                      <button
                        type="button"
                        onClick={() => setSelectedGen(null)}
                        className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${
                          !selectedGen
                            ? "border-primary ring-2 ring-primary/30"
                            : "border-primary/20 opacity-70"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={previewUrl}
                          alt="Just generated"
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute inset-x-0 bottom-0 bg-black/55 py-0.5 text-center text-[8px] text-white">
                          Just now
                        </span>
                      </button>
                    ) : null}
                    {recent.map((g, i) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setSelectedGen(g)}
                        className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${
                          selectedGen?.id === g.id
                            ? "border-primary ring-2 ring-primary/30"
                            : "border-primary/20 opacity-70"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={g.resultUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute inset-x-0 bottom-0 bg-black/55 py-0.5 text-center text-[8px] text-white">
                          {i === 0 ? "Latest" : i === 1 ? "2nd last" : `Older`}
                        </span>
                      </button>
                    ))}
                  </div>

                  <label className="block text-[10px] uppercase tracking-wide text-foreground/45">
                    Name (optional)
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value.slice(0, 80))}
                      placeholder="e.g. Red saree bridal"
                      className="mt-1 w-full rounded-lg border border-primary/25 bg-background/40 px-3 py-2 text-sm normal-case tracking-normal outline-none focus:ring-2 focus:ring-primary"
                    />
                  </label>

                  <button
                    type="button"
                    disabled={busy || !effectivePreview}
                    onClick={() => void saveTheme()}
                    className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-background disabled:opacity-40"
                  >
                    {busy ? "Saving…" : "Save this look"}
                  </button>
                  <p className="text-[10px] text-foreground/50">
                    After saving we move you to “Use a look” automatically.
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[11px] font-medium text-foreground/80">
                Step 2 — Tap <span className="text-primary">Use this look</span>,
                upload new jewelry, then Generate.
              </p>
              <p className="text-[10px] text-foreground/50">
                {themes.length}/{limit || "—"} saved
              </p>

              {themes.length === 0 ? (
                <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-[11px] text-amber-900 dark:text-amber-100">
                  No saved looks yet. Switch to{" "}
                  <button
                    type="button"
                    className="font-semibold underline"
                    onClick={() => setStep("save")}
                  >
                    1. Save a look
                  </button>{" "}
                  first.
                </p>
              ) : (
                <ul className="max-h-56 space-y-2 overflow-y-auto">
                  {themes.map((t) => {
                    const style = parseThemeStyleJson(t.styleJson);
                    const selected = appliedThemeId === t.id;
                    return (
                      <li
                        key={t.id}
                        className={`flex items-center gap-2 rounded-lg border px-2 py-2 ${
                          selected
                            ? "border-primary bg-primary/15"
                            : "border-primary/20 bg-secondary/40"
                        }`}
                      >
                        {t.previewUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={t.previewUrl}
                            alt=""
                            className="h-12 w-12 shrink-0 rounded object-cover"
                          />
                        ) : (
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-background/50 text-[10px] text-foreground/40">
                            —
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-foreground">
                            {t.name}
                          </p>
                          {selected ? (
                            <p className="text-[10px] font-medium text-primary">
                              Active now
                            </p>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          disabled={!style || busy || selected}
                          onClick={() => {
                            if (!style) return;
                            onApply(t, style);
                            setMessage(
                              `“${t.name}” is active. Upload new jewelry, then Generate.`,
                            );
                          }}
                          className="rounded-md bg-primary px-2.5 py-1.5 text-[10px] font-semibold text-background disabled:opacity-50"
                        >
                          {selected ? "In use" : "Use this look"}
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void deleteTheme(t.id)}
                          className="rounded-md px-2 py-1.5 text-[10px] text-foreground/55 hover:text-red-500"
                          aria-label={`Delete ${t.name}`}
                        >
                          Delete
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {message ? (
            <p className="rounded-lg bg-emerald-500/10 px-2 py-1.5 text-[11px] text-emerald-800 dark:text-emerald-200">
              {message}
            </p>
          ) : null}
          {error ? (
            <p className="text-[11px] text-red-500" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
