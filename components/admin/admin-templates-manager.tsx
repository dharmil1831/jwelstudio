"use client";

import { useCallback, useEffect, useState } from "react";
import {
  TEMPLATE_CATEGORIES,
  TEMPLATE_CATEGORY_LABELS,
  type TemplateCategory,
} from "@/lib/model-template-categories";

type Template = {
  id: string;
  category: string;
  description: string | null;
  imageUrl: string;
  active: boolean;
  sourceGenerationId: string | null;
};

type SourceShot = {
  id: string;
  resultUrl: string;
  thumbUrl: string | null;
  subject: string;
  scene: string;
  createdAt: string;
  userEmail: string;
};

export function AdminTemplatesManager() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [shots, setShots] = useState<SourceShot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [picking, setPicking] = useState<SourceShot | null>(null);
  const [category, setCategory] = useState<TemplateCategory>("bridal");
  const [description, setDescription] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/templates", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load templates.");
      setTemplates(data.templates);
      setShots(data.generations);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load templates.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function call(key: string, url: string, init: RequestInit) {
    setBusy(key);
    setError(null);
    try {
      const res = await fetch(url, {
        ...init,
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      await load();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function createFromShot() {
    if (!picking) return;
    const ok = await call("create", "/api/admin/templates", {
      method: "POST",
      body: JSON.stringify({ generationId: picking.id, category, description }),
    });
    if (ok) {
      setPicking(null);
      setDescription("");
    }
  }

  const usedSourceIds = new Set(templates.map((t) => t.sourceGenerationId));

  if (loading) return <p className="text-sm text-foreground/60">Loading…</p>;

  return (
    <div className="space-y-10">
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <section>
        <h2 className="text-lg font-semibold">Current templates ({templates.length})</h2>
        {templates.length === 0 ? (
          <p className="mt-2 text-sm text-foreground/60">
            No templates yet. Pick a model shot below to make the first one.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {templates.map((t, i) => (
              <div
                key={t.id}
                className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${
                  t.active ? "border-primary/20" : "border-black/10 opacity-60"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t.imageUrl} alt="" className="aspect-[4/5] w-full object-cover" />
                <div className="space-y-2 p-3 text-sm">
                  <select
                    value={t.category}
                    disabled={busy !== null}
                    onChange={(e) =>
                      void call(t.id, `/api/admin/templates/${t.id}`, {
                        method: "PATCH",
                        body: JSON.stringify({ category: e.target.value }),
                      })
                    }
                    className="w-full rounded-lg border border-primary/20 bg-white px-2 py-1.5"
                  >
                    {TEMPLATE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {TEMPLATE_CATEGORY_LABELS[c]}
                      </option>
                    ))}
                  </select>
                  {t.description ? (
                    <p className="line-clamp-2 text-xs text-foreground/60">{t.description}</p>
                  ) : null}
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() =>
                        void call(t.id, `/api/admin/templates/${t.id}`, {
                          method: "PATCH",
                          body: JSON.stringify({ active: !t.active }),
                        })
                      }
                      className="rounded-full border border-primary/25 px-2.5 py-1 text-xs font-semibold text-primary"
                    >
                      {t.active ? "Hide" : "Show"}
                    </button>
                    <button
                      type="button"
                      disabled={busy !== null || i === 0}
                      onClick={() =>
                        void call(t.id, `/api/admin/templates/${t.id}`, {
                          method: "PATCH",
                          body: JSON.stringify({ move: "up" }),
                        })
                      }
                      className="rounded-full border border-black/10 px-2.5 py-1 text-xs disabled:opacity-40"
                      aria-label="Move earlier"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      disabled={busy !== null || i === templates.length - 1}
                      onClick={() =>
                        void call(t.id, `/api/admin/templates/${t.id}`, {
                          method: "PATCH",
                          body: JSON.stringify({ move: "down" }),
                        })
                      }
                      className="rounded-full border border-black/10 px-2.5 py-1 text-xs disabled:opacity-40"
                      aria-label="Move later"
                    >
                      →
                    </button>
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => {
                        if (!window.confirm("Delete this template?")) return;
                        void call(t.id, `/api/admin/templates/${t.id}`, { method: "DELETE" });
                      }}
                      className="rounded-full border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                  <p className="text-[11px] text-foreground/45">{t.active ? "Visible to users" : "Hidden"}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold">Make a template from a model shot</h2>
        <p className="mt-1 text-sm text-foreground/60">
          Recent successful model shots. Prefer shots from your own test account: the template briefly shows the
          jewelry that was in the original photo.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {shots.map((s) => {
            const used = usedSourceIds.has(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setPicking(s)}
                className={`group overflow-hidden rounded-xl border bg-white text-left ${
                  picking?.id === s.id ? "border-primary ring-2 ring-primary" : "border-black/10"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.thumbUrl || s.resultUrl} alt="" className="aspect-[4/5] w-full object-cover" />
                <span className="block truncate px-2 py-1.5 text-[11px] text-foreground/60">
                  {used ? "Already a template · " : ""}
                  {s.userEmail}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {picking ? (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-black/40 p-4" onClick={() => setPicking(null)}>
          <div
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={picking.resultUrl} alt="" className="h-40 w-32 shrink-0 rounded-xl object-cover" />
              <div className="min-w-0 flex-1 space-y-3">
                <p className="font-semibold">New model template</p>
                <label className="block text-xs font-semibold text-foreground/70">
                  Category
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TemplateCategory)}
                    className="mt-1 w-full rounded-lg border border-primary/20 bg-white px-2 py-1.5 text-sm font-normal"
                  >
                    {TEMPLATE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {TEMPLATE_CATEGORY_LABELS[c]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-semibold text-foreground/70">
                  Short description (optional)
                  <input
                    value={description}
                    maxLength={140}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Bridal studio, soft glam, front pose"
                    className="mt-1 w-full rounded-lg border border-primary/20 px-2 py-1.5 text-sm font-normal"
                  />
                </label>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPicking(null)}
                className="rounded-full border border-black/10 px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy === "create"}
                onClick={() => void createFromShot()}
                className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {busy === "create" ? "Saving…" : "Make template"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
