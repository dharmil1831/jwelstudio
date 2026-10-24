"use client";

import {
  BUILTIN_HOME_IMAGES,
  DEFAULT_HOME_PLACEHOLDERS,
  libraryFor,
  type HomePlaceholderConfig,
  type HomePlaceholderSelection,
} from "@/lib/home-placeholders";
import { toUserFacingError } from "@/lib/user-facing-error";
import { useEffect, useState } from "react";

const SINGLE_SLOTS = [
  { key: "before", label: "Before photo" },
  { key: "after", label: "After photo" },
  { key: "stepUpload", label: "Step 1 — upload" },
  { key: "stepModel", label: "Step 2 — model" },
  { key: "stepBackdrop", label: "Step 2 — backdrop" },
  { key: "stepDownload", label: "Step 3 — download" },
] as const;

function move(list: string[], index: number, direction: -1 | 1): string[] {
  const next = index + direction;
  if (next < 0 || next >= list.length) return list;
  const copy = [...list];
  const [item] = copy.splice(index, 1);
  copy.splice(next, 0, item);
  return copy;
}

function Picker({
  library,
  selected,
  onPick,
}: {
  library: string[];
  selected: string | string[];
  onPick: (src: string) => void;
}) {
  const chosen = Array.isArray(selected) ? selected : [selected];
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
      {library.map((src) => {
        const order = chosen.indexOf(src);
        const on = order >= 0;
        return (
          <button
            key={src}
            type="button"
            onClick={() => onPick(src)}
            className={`relative overflow-hidden rounded-lg ring-2 ${
              on ? "ring-primary" : "ring-transparent hover:ring-primary/40"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="aspect-square w-full object-cover" />
            {on ? (
              <span className="absolute top-1 left-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">
                {Array.isArray(selected) ? order + 1 : "✓"}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function AdminHomepageForm() {
  const [images, setImages] = useState<HomePlaceholderConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void fetch("/api/admin/homepage")
      .then(async (r) => {
        const data = (await r.json()) as { images?: HomePlaceholderConfig; error?: string };
        if (!r.ok) throw new Error(data.error ?? "Failed to load");
        setImages(data.images ?? null);
      })
      .catch((e) => setError(toUserFacingError(e, "Failed to load")))
      .finally(() => setLoading(false));
  }, []);

  function patch(partial: Partial<HomePlaceholderSelection>) {
    setImages((current) => (current ? { ...current, ...partial } : current));
    setSaved(false);
  }

  function toggleList(key: "hero" | "gallery", src: string, min: number, max: number) {
    if (!images) return;
    const list = images[key];
    if (list.includes(src)) {
      if (list.length <= min) {
        setError(`Keep at least ${min} photos in this section.`);
        return;
      }
      patch({ [key]: list.filter((item) => item !== src) });
      return;
    }
    if (list.length >= max) {
      setError(`This section can show up to ${max} photos.`);
      return;
    }
    setError(null);
    patch({ [key]: [...list, src] });
  }

  async function save(next?: HomePlaceholderSelection) {
    const body = next ?? images;
    if (!body) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/homepage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { error?: string; images?: HomePlaceholderConfig };
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      if (data.images) setImages(data.images);
      setSaved(true);
    } catch (e) {
      setError(toUserFacingError(e, "Save failed"));
    } finally {
      setSaving(false);
    }
  }

  async function upload(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError(null);
    setSaved(false);
    try {
      const form = new FormData();
      form.set("file", file);
      const res = await fetch("/api/admin/homepage/upload", { method: "POST", body: form });
      const data = (await res.json()) as { error?: string; images?: HomePlaceholderConfig };
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      if (data.images) setImages(data.images);
    } catch (e) {
      setError(toUserFacingError(e, "Upload failed"));
    } finally {
      setUploading(false);
    }
  }

  if (loading) return <p className="text-sm text-foreground/55">Loading photos…</p>;
  if (!images) return <p className="text-sm text-red-600">{error ?? "Unavailable"}</p>;

  const library = libraryFor(images.uploads);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center gap-3">
        <label className="cursor-pointer rounded-full border border-primary/30 bg-secondary px-4 py-2 text-sm font-medium text-foreground">
          {uploading ? "Uploading…" : "Add a photo"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              e.target.value = "";
              void upload(file);
            }}
          />
        </label>
        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save homepage"}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => {
            setImages({ ...images, ...DEFAULT_HOME_PLACEHOLDERS });
            void save(DEFAULT_HOME_PLACEHOLDERS);
          }}
          className="text-sm text-foreground/70 hover:text-primary"
        >
          Use the original set
        </button>
        {saved ? <span className="text-sm text-primary">Saved. Refresh the signed-out home to see it.</span> : null}
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <p className="text-xs text-foreground/55">
        {BUILTIN_HOME_IMAGES.length} sample photos
        {images.uploads.length > 0 ? ` · ${images.uploads.length} uploaded` : ""}. Click a photo to use it. The number is the order it appears.
      </p>

      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-foreground">Hero strip</h2>
        <p className="text-sm text-foreground/70">The sliding row under the headline. Pick 2 to 12.</p>
        <div className="flex flex-wrap gap-2">
          {images.hero.map((src, index) => (
            <div key={src} className="flex items-center gap-1 rounded-lg bg-secondary p-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-12 w-12 rounded object-cover" />
              <button type="button" className="px-1 text-sm" onClick={() => patch({ hero: move(images.hero, index, -1) })} aria-label="Move earlier">‹</button>
              <button type="button" className="px-1 text-sm" onClick={() => patch({ hero: move(images.hero, index, 1) })} aria-label="Move later">›</button>
            </div>
          ))}
        </div>
        <Picker library={library} selected={images.hero} onPick={(src) => toggleList("hero", src, 2, 12)} />
      </section>

      <section className="space-y-6">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-foreground">Before, after, and steps</h2>
        {SINGLE_SLOTS.map((slot) => (
          <div key={slot.key} className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">{slot.label}</h3>
            <Picker
              library={library}
              selected={images[slot.key]}
              onPick={(src) => patch({ [slot.key]: src })}
            />
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-foreground">Gallery</h2>
        <p className="text-sm text-foreground/70">The grid at the bottom. Pick 4 to 16.</p>
        <div className="flex flex-wrap gap-2">
          {images.gallery.map((src, index) => (
            <div key={src} className="flex items-center gap-1 rounded-lg bg-secondary p-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-12 w-12 rounded object-cover" />
              <button type="button" className="px-1 text-sm" onClick={() => patch({ gallery: move(images.gallery, index, -1) })} aria-label="Move earlier">‹</button>
              <button type="button" className="px-1 text-sm" onClick={() => patch({ gallery: move(images.gallery, index, 1) })} aria-label="Move later">›</button>
            </div>
          ))}
        </div>
        <Picker library={library} selected={images.gallery} onPick={(src) => toggleList("gallery", src, 4, 16)} />
      </section>
    </div>
  );
}
