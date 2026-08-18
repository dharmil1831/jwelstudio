"use client";

import { resizeImageFile } from "@/lib/image-resize";
import { friendlyClientError, readApiJson } from "@/lib/read-api-json";
import {
  PLACEMENT_LABELS,
  PLACEMENTS,
  SCENE_LABELS,
  SCENES,
  SHOT_LABELS,
  SHOTS,
  SUBJECT_LABELS,
  SUBJECTS,
  VIBE_LABELS,
  VIBES,
  type Placement,
  type Scene,
  type Shot,
  type Subject,
  type Vibe,
} from "@/lib/style-options";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DownloadImageButton } from "@/components/download-image-button";
import { ImageLightbox } from "@/components/image-lightbox";

function isAcceptedImage(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  const ext = file.name.split(".").pop()?.toLowerCase();
  return (
    ext === "jpg" ||
    ext === "jpeg" ||
    ext === "png" ||
    ext === "webp" ||
    ext === "heic" ||
    ext === "heif"
  );
}

export function StudioApp() {
  const pathname = usePathname();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [generationReady, setGenerationReady] = useState<boolean | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [placement, setPlacement] = useState<Placement>("auto");
  const [subject, setSubject] = useState<Subject>("auto");
  const [shot, setShot] = useState<Shot>("editorial");
  const [scene, setScene] = useState<Scene>("studio");
  const [vibe, setVibe] = useState<Vibe>("luxury");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    function loadSession() {
      void fetch("/api/session")
        .then((r) => r.json())
        .then(
          (d: {
            authenticated?: boolean;
            credits?: number;
            generationConfigured?: boolean;
          }) => {
            if (cancelled) return;
            setAuthenticated(Boolean(d.authenticated));
            if (d.authenticated && typeof d.credits === "number") {
              setCredits(d.credits);
            } else {
              setCredits(null);
              setFile(null);
              setResultUrl(null);
            }
            if (typeof d.generationConfigured === "boolean") {
              setGenerationReady(d.generationConfigured);
            }
          },
        )
        .catch(() => {
          if (cancelled) return;
          setAuthenticated(false);
          setCredits(null);
          setGenerationReady(null);
          setFile(null);
          setResultUrl(null);
        });
    }

    loadSession();

    function onAuthChanged() {
      setAuthenticated(null);
      loadSession();
    }
    window.addEventListener("jewel-auth-changed", onAuthChanged);

    return () => {
      cancelled = true;
      window.removeEventListener("jewel-auth-changed", onAuthChanged);
    };
  }, [pathname]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    let u: string | null = null;
    try {
      u = URL.createObjectURL(file);
      setPreviewUrl(u);
    } catch {
      setPreviewUrl(null);
      setError(
        "Could not preview this photo. Please try a JPG or PNG instead.",
      );
      return;
    }
    return () => {
      if (u) URL.revokeObjectURL(u);
    };
  }, [file]);

  const applyFile = useCallback((next: File | null) => {
    if (next && !isAcceptedImage(next)) {
      setError("Please choose a JPG, PNG, or WebP image.");
      return;
    }
    setFile(next);
    setResultUrl(null);
    setError(null);
  }, []);

  const onPick = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      applyFile(e.target.files?.[0] ?? null);
      try {
        e.target.value = "";
      } catch {
        /* iOS Safari can throw on resetting file inputs with strict accept lists */
      }
    },
    [applyFile],
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      applyFile(e.dataTransfer.files?.[0] ?? null);
    },
    [applyFile],
  );

  const generate = useCallback(async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResultUrl(null);

    try {
      const { base64, mimeType } = await resizeImageFile(file, 1024, 0.85);
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 90_000);
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType,
          placement,
          subject,
          shot,
          scene,
          vibe,
        }),
        signal: controller.signal,
      });
      window.clearTimeout(timeout);
      const data = await readApiJson<{
        error?: string;
        resultUrl?: string;
        credits?: number;
      }>(res);

      if (!res.ok) throw new Error(data.error ?? "Request failed");
      if (typeof data.credits === "number") setCredits(data.credits);
      if (data.resultUrl) setResultUrl(data.resultUrl);
    } catch (err) {
      setError(friendlyClientError(err));
    } finally {
      setLoading(false);
    }
  }, [file, placement, subject, shot, scene, vibe]);

  if (authenticated === null) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white/90 p-8 text-center">
        <p className="text-sm text-stone-500">Checking your session…</p>
      </div>
    );
  }

  if (authenticated === false) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-8 text-center">
        <p className="text-stone-700">Log in to upload jewelry and generate model shots.</p>
        <Link
          href="/login"
          className="mt-4 inline-block rounded-xl bg-amber-600 px-6 py-3 text-sm font-semibold text-white"
        >
          Log in / Sign up
        </Link>
        <p className="mt-3 text-xs text-stone-500">5 free generations for new accounts.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,360px)_1fr]">
      <aside className="flex flex-col gap-5 rounded-2xl border border-stone-200/90 bg-white/95 p-6 shadow-md">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-stone-600">
            Credits:{" "}
            <span className="text-lg font-medium text-stone-900">
              {credits ?? "—"}
            </span>
          </p>
          {credits === 0 ? (
            <Link
              href="/pricing"
              className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white"
            >
              Buy credits
            </Link>
          ) : null}
        </div>

        {generationReady === false ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Server missing OPENAI_API_KEY.
          </p>
        ) : null}

        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-amber-800/80">
            Jewelry photo
          </p>
          <input
            id="jewelry-upload"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={onPick}
          />
          <label
            htmlFor="jewelry-upload"
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
            className={`mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-4 py-8 text-center text-sm transition ${
              dragActive
                ? "border-amber-500 bg-amber-50 text-amber-900"
                : "border-stone-300 bg-stone-50 text-stone-600 hover:border-amber-400"
            }`}
          >
            {file && previewUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Selected"
                  className="mb-2 max-h-28 w-full rounded-lg object-contain"
                />
                <span className="text-xs text-stone-700">{file.name}</span>
              </>
            ) : (
              <>
                Drop or tap to upload
                <span className="mt-1 block text-xs text-stone-400">
                  JPG or PNG works best on iPhone
                </span>
              </>
            )}
          </label>
        </div>

        <Field
          label="Where to show jewelry"
          value={placement}
          onChange={setPlacement}
          options={PLACEMENTS.map((k) => [k, PLACEMENT_LABELS[k]] as const)}
        />
        <Field
          label="Model type"
          value={subject}
          onChange={setSubject}
          options={SUBJECTS.map((k) => [k, SUBJECT_LABELS[k]] as const)}
        />
        <Field
          label="Shot type"
          value={shot}
          onChange={setShot}
          options={SHOTS.map((k) => [k, SHOT_LABELS[k]] as const)}
        />
        <Field
          label="Scene"
          value={scene}
          onChange={setScene}
          options={SCENES.map((k) => [k, SCENE_LABELS[k]] as const)}
        />
        <Field
          label="Mood"
          value={vibe}
          onChange={setVibe}
          options={VIBES.map((k) => [k, VIBE_LABELS[k]] as const)}
        />

        <button
          type="button"
          disabled={
            !file ||
            loading ||
            generationReady === false ||
            (credits !== null && credits < 1)
          }
          onClick={() => void generate()}
          className="rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 py-3 text-sm font-semibold text-white disabled:opacity-40"
        >
          {loading ? "Generating…" : "Generate model shot"}
        </button>

        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </aside>

      <section className="flex min-h-[420px] flex-col items-center justify-center gap-4">
        {resultUrl ? (
          <>
            <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-lg">
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                className="block w-full cursor-zoom-in"
                aria-label="View full size"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resultUrl}
                  alt="Model shot"
                  className="aspect-square w-full object-contain bg-stone-50"
                />
              </button>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50"
              >
                Zoom in
              </button>
              <DownloadImageButton
                url={resultUrl}
                filename="jewel-studio-model-shot.png"
                className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
                label="Download image"
              />
            </div>
            <ImageLightbox
              url={resultUrl}
              alt="Model shot"
              open={lightboxOpen}
              onClose={() => setLightboxOpen(false)}
              filename="jewel-studio-model-shot.png"
            />
          </>
        ) : (
          <p className="max-w-sm text-center text-sm text-stone-500">
            Your AI model shot will appear here after generation.
          </p>
        )}
      </section>
    </div>
  );
}

function Field<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: readonly (readonly [T, string])[];
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-widest text-amber-800/80">
        {label}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {options.map(([key, name]) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
              value === key
                ? "bg-amber-600 text-white"
                : "bg-stone-100 text-stone-700 ring-1 ring-stone-200 hover:bg-stone-200"
            }`}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}
