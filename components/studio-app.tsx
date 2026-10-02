"use client";

import { BrandMarketingPanel, EMPTY_BRAND, type BrandFormState } from "@/components/brand-marketing-panel";
import { StudioMobileHome } from "@/components/studio-mobile-home";
import { DownloadImageButton } from "@/components/download-image-button";
import { MarketingPosterButton } from "@/components/marketing-poster-button";
import { GenerationPreviewPlaceholder } from "@/components/generation-preview-placeholder";
import { ImageLightbox } from "@/components/image-lightbox";
import { ShareImageButton } from "@/components/share-image-button";
import { ThemesPanel, type ThemeListItem } from "@/components/themes-panel";
import { prepareImageForUpload } from "@/lib/image-resize";
import { downloadFilename } from "@/lib/download-image";
import { friendlyClientError, readApiJson } from "@/lib/read-api-json";
import { toUserFacingError } from "@/lib/user-facing-error";
import type { ThemeStyleSnapshot } from "@/lib/themes";
import {
  CREDIT_COST_PER_VIDEO,
  VIDEO_ASPECT_CLASS,
  VIDEO_ASPECT_HINTS,
  VIDEO_ASPECT_IDS,
  VIDEO_ASPECT_LABELS,
  VIDEO_CAST_HINTS,
  VIDEO_CAST_IDS,
  VIDEO_CAST_LABELS,
  VIDEO_PRESET_IDS,
  VIDEO_PRESET_LABELS,
  VIDEO_PURPOSE_IDS,
  VIDEO_PURPOSE_LABELS,
  type VideoAspectId,
  type VideoCastId,
  type VideoPresetId,
  type VideoPurposeId,
} from "@/lib/video-presets";
import {
  BACKDROP_COLOR_PRESETS,
  DEFAULT_BACKDROP_HEX,
  FRAMING_LABELS,
  FRAMINGS,
  GENERATION_MODES,
  JEWELRY_SHADOWS,
  JEWELRY_SHADOW_HINTS,
  JEWELRY_SHADOW_LABELS,
  MODE_LABELS,
  OUTPUT_FORMAT_ASPECT_CLASS,
  OUTPUT_FORMAT_LABELS,
  PLACEMENT_LABELS,
  PLACEMENTS,
  SCENE_LABELS,
  SCENES,
  SHOT_LABELS,
  SHOTS,
  STUDIO_OUTPUT_FORMATS,
  SUBJECT_LABELS,
  SUBJECTS,
  VIBE_LABELS,
  VIBES,
  normalizeBackdropHex,
  type Framing,
  type GenerationMode,
  type JewelryShadow,
  type OutputFormat,
  type Placement,
  type Scene,
  type Shot,
  type Subject,
  type Vibe,
} from "@/lib/style-options";
import { CREDIT_COST_PER_GENERATION } from "@/lib/users";
import {
  LOOK_PRESET_HINTS,
  LOOK_PRESET_IDS,
  LOOK_PRESET_LABELS,
  parseLookPreset,
  type LookPresetId,
} from "@/lib/look-presets";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type StudioTab = GenerationMode | "video" | "batch";

const BATCH_MAX = 10;

type BatchItemStatus = "idle" | "queued" | "running" | "done" | "failed";

type BatchItem = {
  id: string;
  file: File;
  previewUrl: string;
  status: BatchItemStatus;
  resultUrl?: string;
  generationId?: string;
  error?: string;
};

/** After the first photo sets the look, remaining SKUs run together. */
const BATCH_CONCURRENCY = 3;

type BatchBackdropMode = "white" | "soft_studio" | "scene";

const BATCH_BACKDROP_MODES: BatchBackdropMode[] = [
  "white",
  "soft_studio",
  "scene",
];

const BATCH_BACKDROP_LABELS: Record<BatchBackdropMode, string> = {
  white: "White",
  soft_studio: "Soft studio",
  scene: "Keep scene",
};

const BATCH_BACKDROP_HINTS: Record<BatchBackdropMode, string> = {
  white: "Clean solid white product backdrop",
  soft_studio: "Warm ivory studio surface",
  scene: "Use Scene / Mood chips (no solid fill)",
};

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
  const [canCustomPrompt, setCanCustomPrompt] = useState(false);
  const [canBrand, setCanBrand] = useState(false);
  const [canThemes, setCanThemes] = useState(false);
  const [canSelfie, setCanSelfie] = useState(false);
  const [canVideo, setCanVideo] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [brand, setBrand] = useState<BrandFormState>(EMPTY_BRAND);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreviewUrl, setSelfiePreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultMime, setResultMime] = useState<string | null>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [tab, setTab] = useState<StudioTab>("model");
  const [mode, setMode] = useState<GenerationMode>("model");
  const [placement, setPlacement] = useState<Placement>("auto");
  const [subject, setSubject] = useState<Subject>("auto");
  const [lookPreset, setLookPreset] = useState<LookPresetId>("auto");
  const [shot, setShot] = useState<Shot>("editorial");
  const [framing, setFraming] = useState<Framing>("catalog");
  const [scene, setScene] = useState<Scene>("studio");
  const [vibe, setVibe] = useState<Vibe>("luxury");
  const [format, setFormat] = useState<OutputFormat>("whatsapp");
  const [backdropColor, setBackdropColor] = useState<string>(DEFAULT_BACKDROP_HEX);
  const [backdropHexInput, setBackdropHexInput] = useState(DEFAULT_BACKDROP_HEX);
  const [videoPreset, setVideoPreset] = useState<VideoPresetId>("slow_orbit");
  const [videoAspect, setVideoAspect] = useState<VideoAspectId>("vertical");
  const [videoPurpose, setVideoPurpose] = useState<VideoPurposeId>("promotional");
  const [videoCast, setVideoCast] = useState<VideoCastId>("product");
  const [appliedThemeId, setAppliedThemeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [jewelryShadow, setJewelryShadow] = useState<JewelryShadow>("soft");
  const [batchBackdropMode, setBatchBackdropMode] =
    useState<BatchBackdropMode>("white");
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [batchRunning, setBatchRunning] = useState(false);
  const batchAbortRef = useRef(false);

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
            features?: {
              customPrompt?: boolean;
              brandOverlay?: boolean;
              themes?: boolean;
              selfieTryOn?: boolean;
              videoGeneration?: boolean;
            };
          }) => {
            if (cancelled) return;
            setAuthenticated(Boolean(d.authenticated));
            setCanCustomPrompt(Boolean(d.features?.customPrompt));
            setCanBrand(Boolean(d.features?.brandOverlay));
            setCanThemes(Boolean(d.features?.themes));
            setCanSelfie(Boolean(d.features?.selfieTryOn));
            setCanVideo(Boolean(d.features?.videoGeneration));
            if (d.authenticated && typeof d.credits === "number") {
              setCredits(d.credits);
            } else {
              setCredits(null);
              setCanCustomPrompt(false);
              setCanBrand(false);
              setCanThemes(false);
              setCanSelfie(false);
              setCanVideo(false);
              setFile(null);
              setSelfieFile(null);
              setResultUrl(null);
              setResultMime(null);
              setGenerationId(null);
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
          setCanCustomPrompt(false);
          setCanBrand(false);
          setCanThemes(false);
          setCanSelfie(false);
          setCanVideo(false);
          setGenerationReady(null);
          setFile(null);
          setSelfieFile(null);
          setResultUrl(null);
          setResultMime(null);
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

  useEffect(() => {
    if (!selfieFile) {
      setSelfiePreviewUrl(null);
      return;
    }
    let u: string | null = null;
    try {
      u = URL.createObjectURL(selfieFile);
      setSelfiePreviewUrl(u);
    } catch {
      setSelfiePreviewUrl(null);
      return;
    }
    return () => {
      if (u) URL.revokeObjectURL(u);
    };
  }, [selfieFile]);

  const applyFile = useCallback((next: File | null) => {
    if (next && !isAcceptedImage(next)) {
      setError("Please choose a JPG, PNG, or WebP image.");
      return;
    }
    setFile(next);
    setResultUrl(null);
    setResultMime(null);
    setError(null);
  }, []);

  const addBatchFiles = useCallback((list: FileList | File[] | null) => {
    if (!list || list.length === 0) return;
    const incoming = Array.from(list).filter(isAcceptedImage);
    if (incoming.length === 0) {
      setError("Please choose JPG, PNG, or WebP images.");
      return;
    }
    setError(null);
    setBatchItems((prev) => {
      const room = BATCH_MAX - prev.length;
      if (room <= 0) {
        setError(`Batch max is ${BATCH_MAX} images.`);
        return prev;
      }
      const slice = incoming.slice(0, room);
      if (incoming.length > room) {
        setError(`Only ${BATCH_MAX} images per batch. Extra files skipped.`);
      }
      const added: BatchItem[] = slice.map((f) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        file: f,
        previewUrl: URL.createObjectURL(f),
        status: "idle",
      }));
      return [...prev, ...added];
    });
  }, []);

  const removeBatchItem = useCallback((id: string) => {
    setBatchItems((prev) => {
      const hit = prev.find((i) => i.id === id);
      if (hit?.previewUrl) URL.revokeObjectURL(hit.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const clearBatch = useCallback(() => {
    setBatchItems((prev) => {
      for (const i of prev) {
        if (i.previewUrl) URL.revokeObjectURL(i.previewUrl);
      }
      return [];
    });
    batchAbortRef.current = true;
    setBatchRunning(false);
  }, []);

  const applySelfie = useCallback((next: File | null) => {
    if (next && !isAcceptedImage(next)) {
      setError("Please choose a JPG, PNG, or WebP selfie.");
      return;
    }
    setSelfieFile(next);
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

  const onSelfiePick = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      applySelfie(e.target.files?.[0] ?? null);
      try {
        e.target.value = "";
      } catch {
        /* ignore */
      }
    },
    [applySelfie],
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

  const applyTheme = useCallback((theme: ThemeListItem, style: ThemeStyleSnapshot) => {
    setAppliedThemeId(theme.id);
    setTab((current) => (current === "batch" ? "batch" : style.mode));
    setMode(style.mode);
    setPlacement(style.placement);
    setSubject(style.subject);
    setLookPreset(parseLookPreset(style.lookPreset));
    setShot(style.shot);
    setFraming(style.framing);
    setScene(style.scene);
    setVibe(style.vibe);
    setFormat(style.format);
    if (style.backdropColor) {
      setBackdropColor(style.backdropColor);
      setBackdropHexInput(style.backdropColor);
    }
    setCustomPrompt(style.customPrompt ?? "");
    setResultUrl(null);
    setResultMime(null);
    setError(null);
  }, []);

  const themeSnapshot = useCallback((): ThemeStyleSnapshot => {
    const batchHex =
      batchBackdropMode === "white"
        ? "#FFFFFF"
        : batchBackdropMode === "soft_studio"
          ? "#F5F0E8"
          : null;
    return {
      mode: tab === "batch" ? "background" : mode,
      placement,
      subject,
      shot,
      framing,
      scene,
      vibe,
      format,
      backdropColor:
        tab === "batch"
          ? batchHex
          : mode === "background"
            ? backdropColor
            : null,
      lookPreset: mode === "model" || tab === "video" ? lookPreset : null,
      customPrompt: customPrompt.trim() || null,
      usePreviewAsReference: true,
    };
  }, [
    mode,
    placement,
    subject,
    shot,
    framing,
    scene,
    vibe,
    format,
    backdropColor,
    batchBackdropMode,
    lookPreset,
    customPrompt,
    tab,
  ]);

  const saveCurrentResultAsTheme = useCallback(async () => {
    if (!resultUrl || resultMime?.startsWith("video/")) return;
    if (!canThemes) {
      setError("Saved looks unlock on Platinum and above.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const autoName = `Look ${new Date().toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })}`;
      const res = await fetch("/api/themes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: autoName,
          previewUrl: resultUrl,
          style: { ...themeSnapshot(), usePreviewAsReference: true },
        }),
      });
      const data = await readApiJson<{
        error?: string;
        theme?: ThemeListItem;
      }>(res);
      if (!res.ok) throw new Error(data.error ?? "Could not save look");
      if (data.theme) {
        const { parseThemeStyleJson } = await import("@/lib/themes");
        const style = parseThemeStyleJson(data.theme.styleJson);
        if (style) applyTheme(data.theme, style);
      }
      setError(null);
      window.alert(
        "Look saved! Now upload a NEW jewelry photo on the left, then press Generate — same style, new jewelry.",
      );
    } catch (err) {
      setError(friendlyClientError(err));
    } finally {
      setLoading(false);
    }
  }, [resultUrl, resultMime, canThemes, themeSnapshot, applyTheme]);

  const generate = useCallback(async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResultUrl(null);
    setResultMime(null);
    setGenerationId(null);

    try {
      const { base64, mimeType } = await prepareImageForUpload(file);
      let selfieBase64: string | undefined;
      let selfieMimeType: string | undefined;
      if (selfieFile && mode === "model" && canSelfie) {
        const selfie = await prepareImageForUpload(selfieFile);
        selfieBase64 = selfie.base64;
        selfieMimeType = selfie.mimeType;
      }

      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 120_000);
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType,
          mode,
          placement,
          subject,
          shot,
          framing,
          scene,
          vibe,
          format,
          lookPreset: mode === "model" ? lookPreset : undefined,
          backdropColor: mode === "background" ? backdropColor : undefined,
          jewelryShadow:
            mode === "background" ? jewelryShadow : undefined,
          customPrompt: customPrompt.trim() || undefined,
          brandName: brand.brandName || undefined,
          marketingLine: brand.marketingLine || undefined,
          grams: brand.grams || undefined,
          festivalId: brand.festivalId,
          festivalLabel: brand.festivalLabel || undefined,
          watermark: brand.watermark,
          logoPlacement: brand.logoPlacement,
          logoBase64: brand.logoBase64 || undefined,
          logoMimeType: brand.logoMimeType || undefined,
          selfieBase64,
          selfieMimeType,
          themeId: appliedThemeId || undefined,
        }),
        signal: controller.signal,
      });
      window.clearTimeout(timeout);
      const data = await readApiJson<{
        error?: string;
        resultUrl?: string;
        generationId?: string;
        mimeType?: string;
        credits?: number;
        themeUsed?: boolean;
        themeWarning?: string;
      }>(res);

      if (!res.ok) throw new Error(data.error ?? "Request failed");
      if (typeof data.credits === "number") setCredits(data.credits);
      if (data.resultUrl) setResultUrl(data.resultUrl);
      if (typeof data.generationId === "string") setGenerationId(data.generationId);
      if (typeof data.mimeType === "string") setResultMime(data.mimeType);
      if (data.themeWarning) setError(toUserFacingError(data.themeWarning));
      else if (data.themeUsed) setError(null);
    } catch (err) {
      setError(friendlyClientError(err));
    } finally {
      setLoading(false);
    }
  }, [
    file,
    selfieFile,
    canSelfie,
    mode,
    placement,
    subject,
    shot,
    framing,
    scene,
    vibe,
    format,
    lookPreset,
    backdropColor,
    jewelryShadow,
    customPrompt,
    brand,
    appliedThemeId,
  ]);

  const runBatchIds = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0 || batchRunning) return;
      const need = ids.length * CREDIT_COST_PER_GENERATION;
      if (credits !== null && credits < need) {
        setError(
          `Need ${need} credits for ${ids.length} images (you have ${credits}).`,
        );
        return;
      }

      batchAbortRef.current = false;
      setBatchRunning(true);
      setLoading(true);
      setError(null);

      setBatchItems((prev) =>
        prev.map((i) =>
          ids.includes(i.id)
            ? {
                ...i,
                status: "queued" as const,
                resultUrl: undefined,
                generationId: undefined,
                error: undefined,
              }
            : i,
        ),
      );

      let lastCredits = credits;
      const snapshot = batchItems.filter((i) => ids.includes(i.id));
      // Retries reuse a photo that already succeeded so the backdrop stays the same.
      let lockGenerationId = batchItems.find(
        (i) =>
          !ids.includes(i.id) &&
          i.status === "done" &&
          Boolean(i.generationId),
      )?.generationId;

      const pending = [...ids];
      let stopForCredits = false;

      const generateOne = async (id: string, lockId?: string) => {
        if (batchAbortRef.current || stopForCredits) return;
        const item = snapshot.find((i) => i.id === id);
        if (!item) return;

        setBatchItems((prev) =>
          prev.map((i) =>
            i.id === id ? { ...i, status: "running" as const } : i,
          ),
        );

        try {
          const { base64, mimeType } = await prepareImageForUpload(item.file);
          const controller = new AbortController();
          const timeout = window.setTimeout(() => controller.abort(), 120_000);
          const res = await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageBase64: base64,
              mimeType,
              mode,
              placement: mode === "model" ? placement : undefined,
              subject: mode === "model" ? subject : undefined,
              shot: mode === "model" ? shot : undefined,
              lookPreset: mode === "model" ? lookPreset : undefined,
              framing,
              scene,
              vibe,
              format,
              backdropMode: mode === "background" ? "solid" : undefined,
              backdropColor: mode === "background" ? backdropColor : undefined,
              jewelryShadow: mode === "background" ? jewelryShadow : undefined,
              customPrompt: customPrompt.trim() || undefined,
              brandName: brand.brandName || undefined,
              marketingLine: brand.marketingLine || undefined,
              grams: brand.grams || undefined,
              festivalId: brand.festivalId,
          festivalLabel: brand.festivalLabel || undefined,
              watermark: brand.watermark,
              logoPlacement: brand.logoPlacement,
              logoBase64: brand.logoBase64 || undefined,
              logoMimeType: brand.logoMimeType || undefined,
              themeId: appliedThemeId || undefined,
              backgroundLockGenerationId:
                mode === "background" ? lockId : undefined,
            }),
            signal: controller.signal,
          });
          window.clearTimeout(timeout);
          const data = await readApiJson<{
            error?: string;
            resultUrl?: string;
            generationId?: string;
            credits?: number;
          }>(res);

          if (typeof data.credits === "number") {
            lastCredits = data.credits;
            setCredits(data.credits);
          }
          if (!res.ok) throw new Error(data.error ?? "Request failed");

          if (data.generationId) lockGenerationId = lockGenerationId ?? data.generationId;

          setBatchItems((prev) =>
            prev.map((i) =>
              i.id === id
                ? {
                    ...i,
                    status: "done" as const,
                    resultUrl: data.resultUrl,
                    generationId: data.generationId,
                    error: undefined,
                  }
                : i,
            ),
          );

          if (data.resultUrl) {
            setResultUrl(data.resultUrl);
            setResultMime("image/jpeg");
          }
        } catch (err) {
          const msg = friendlyClientError(err);
          setBatchItems((prev) =>
            prev.map((i) =>
              i.id === id
                ? { ...i, status: "failed" as const, error: msg }
                : i,
            ),
          );
          setError(msg);
          if (
            typeof lastCredits === "number" &&
            lastCredits < CREDIT_COST_PER_GENERATION
          ) {
            stopForCredits = true;
          }
        }
      };

      // First success becomes the shared background for the rest of the set.
      while (
        !lockGenerationId &&
        pending.length > 0 &&
        !batchAbortRef.current &&
        !stopForCredits
      ) {
        const id = pending.shift();
        if (!id) break;
        await generateOne(id);
      }

      const worker = async () => {
        while (
          pending.length > 0 &&
          !batchAbortRef.current &&
          !stopForCredits
        ) {
          const id = pending.shift();
          if (!id) return;
          await generateOne(id, lockGenerationId);
        }
      };

      const workers = Math.min(BATCH_CONCURRENCY, pending.length);
      if (workers > 0) {
        await Promise.all(Array.from({ length: workers }, () => worker()));
      }

      setBatchItems((prev) =>
        prev.map((i) =>
          ids.includes(i.id) && i.status === "queued"
            ? { ...i, status: "idle" as const }
            : i,
        ),
      );

      setBatchRunning(false);
      setLoading(false);
    },
    [
      batchItems,
      batchRunning,
      credits,
      mode,
      placement,
      subject,
      shot,
      lookPreset,
      framing,
      scene,
      vibe,
      format,
      backdropColor,
      jewelryShadow,
      customPrompt,
      brand,
      appliedThemeId,
    ],
  );

  const generateBatch = useCallback(async () => {
    if (batchItems.length === 0) return;
    await runBatchIds(batchItems.map((i) => i.id));
  }, [batchItems, runBatchIds]);

  const retryFailedBatch = useCallback(async () => {
    const failedIds = batchItems
      .filter((i) => i.status === "failed")
      .map((i) => i.id);
    if (failedIds.length === 0) return;
    await runBatchIds(failedIds);
  }, [batchItems, runBatchIds]);

  const generateVideo = useCallback(async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResultUrl(null);
    setResultMime(null);
    setGenerationId(null);

    try {
      const { base64, mimeType } = await prepareImageForUpload(file);
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 260_000);
      const res = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType,
          preset: videoPreset,
          aspect: videoAspect,
          purpose: videoPurpose,
          cast: videoCast,
          subject: videoCast === "model" ? subject : undefined,
          lookPreset: videoCast === "model" ? lookPreset : undefined,
          customPrompt: customPrompt.trim() || undefined,
        }),
        signal: controller.signal,
      });
      window.clearTimeout(timeout);
      const data = await readApiJson<{
        error?: string;
        resultUrl?: string;
        generationId?: string;
        mimeType?: string;
        credits?: number;
      }>(res);

      if (!res.ok) throw new Error(data.error ?? "Video failed");
      if (typeof data.credits === "number") setCredits(data.credits);
      if (data.resultUrl) setResultUrl(data.resultUrl);
      if (typeof data.generationId === "string") setGenerationId(data.generationId);
      if (typeof data.mimeType === "string") setResultMime(data.mimeType);
    } catch (err) {
      setError(friendlyClientError(err));
    } finally {
      setLoading(false);
    }
  }, [file, videoPreset, videoAspect, videoPurpose, videoCast, subject, lookPreset, customPrompt]);

  const selectTab = useCallback((next: StudioTab) => {
    setTab(next);
    if (next === "video") {
      setResultUrl(null);
      setResultMime(null);
      setError(null);
      return;
    }
    if (next === "batch") {
      setMode("background");
      setResultUrl(null);
      setResultMime(null);
      setError(null);
      setSelfieFile(null);
      return;
    }
    setMode(next);
    setResultUrl(null);
    setResultMime(null);
    setError(null);
    if (next !== "model") setSelfieFile(null);
  }, []);

  if (authenticated === null) {
    return (
      <div className="rounded-2xl border border-primary/20 bg-secondary/90 p-8 text-center">
        <p className="text-sm text-foreground/55">Checking your session…</p>
      </div>
    );
  }

  if (authenticated === false) {
    return (
      <div className="rounded-2xl border border-primary/30 bg-primary/10 p-8 text-center">
        <p className="text-foreground/80">
          Log in to upload jewelry and generate model shots or background stills.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-block rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-background"
        >
          Log in / Sign up
        </Link>
        <p className="mt-3 text-xs text-foreground/55">5 free generations for new accounts.</p>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-50 lg:hidden">
        <StudioMobileHome
          credits={credits}
          previewUrl={previewUrl}
          fileName={file?.name ?? null}
          resultUrl={resultUrl}
          resultMime={resultMime}
          generationId={generationId}
          loading={loading || batchRunning}
          error={error}
          canCustomPrompt={canCustomPrompt}
          canBrand={canBrand}
          canThemes={canThemes}
          canSelfie={canSelfie}
          canVideo={canVideo}
          generationReady={generationReady}
          customPrompt={customPrompt}
          onCustomPrompt={setCustomPrompt}
          brand={brand}
          onBrand={setBrand}
          subject={subject}
          onSubject={setSubject}
          lookPreset={lookPreset}
          onLook={setLookPreset}
          shot={shot}
          onShot={setShot}
          placement={placement}
          onPlacement={setPlacement}
          scene={scene}
          onScene={setScene}
          vibe={vibe}
          onVibe={setVibe}
          format={format}
          onFormat={setFormat}
          backdropColor={backdropColor}
          onBackdrop={(hex) => {
            setBackdropColor(hex);
            setBackdropHexInput(hex);
            setBatchBackdropMode("white");
          }}
          jewelryShadow={jewelryShadow}
          onShadow={setJewelryShadow}
          videoPreset={videoPreset}
          onVideoPreset={setVideoPreset}
          videoAspect={videoAspect}
          onVideoAspect={setVideoAspect}
          videoPurpose={videoPurpose}
          onVideoPurpose={setVideoPurpose}
          videoCast={videoCast}
          onVideoCast={setVideoCast}
          selfiePreviewUrl={selfiePreviewUrl}
          onPickJewelry={applyFile}
          onPickSelfie={applySelfie}
          onAddBatch={(files) => {
            addBatchFiles(files);
          }}
          onSelectJob={(job) => {
            if (job === "video" && !canVideo) {
              setError("Video unlocks on Diamond. See Pricing.");
              return;
            }
            selectTab(job);
          }}
          onGenerate={() => {
            void (batchItems.length > 0 && tab !== "video"
              ? generateBatch()
              : tab === "video"
                ? generateVideo()
                : generate());
          }}
          themeSnapshot={themeSnapshot}
          appliedThemeId={appliedThemeId}
          onApplyTheme={applyTheme}
          onClearTheme={() => setAppliedThemeId(null)}
          onSaveTheme={() => void saveCurrentResultAsTheme()}
        />
      </div>
      <div className="hidden gap-8 lg:grid lg:grid-cols-[minmax(0,360px)_1fr]">
      <aside className="flex flex-col gap-5 rounded-2xl border border-primary/20 bg-secondary/95 p-6 shadow-md">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-foreground/70">
            Credits:{" "}
            <span className="text-lg font-medium text-foreground">
              {credits ?? "—"}
            </span>
          </p>
          {credits === 0 ? (
            <Link
              href="/pricing"
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-background"
            >
              Buy credits
            </Link>
          ) : null}
        </div>

        {generationReady === false ? (
          <p className="rounded-lg bg-primary/15 px-3 py-2 text-xs text-primary">
            Generation is temporarily unavailable. Please try again later.
          </p>
        ) : null}

        <div
          role="tablist"
          aria-label="Generation mode"
          className="grid grid-cols-2 gap-1 rounded-xl bg-background/60 p-1 sm:grid-cols-3"
        >
          {GENERATION_MODES.map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => selectTab(key)}
              className={`rounded-lg px-2 py-2 text-xs font-semibold transition sm:text-sm ${
                tab === key
                  ? "bg-secondary text-foreground shadow-sm"
                  : "text-foreground/65 hover:text-foreground"
              }`}
            >
              {MODE_LABELS[key]}
            </button>
          ))}
          <button
            type="button"
            role="tab"
            aria-selected={tab === "video"}
            onClick={() => {
              if (!canVideo) {
                setError("Video unlocks on Diamond. See Pricing.");
                return;
              }
              selectTab("video");
            }}
            className={`rounded-lg px-2 py-2 text-xs font-semibold transition sm:text-sm ${
              tab === "video"
                ? "bg-secondary text-foreground shadow-sm"
                : canVideo
                  ? "text-foreground/65 hover:text-foreground"
                  : "text-foreground/35"
            }`}
            title={canVideo ? "AI video" : "Diamond plan"}
          >
            Video
          </button>
        </div>

        {tab === "batch" ? (
          <div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-widest text-primary/90">
                Jewelry photos
              </p>
              {batchItems.length > 0 ? (
                <button
                  type="button"
                  onClick={clearBatch}
                  className="text-[11px] text-primary underline"
                >
                  Clear all
                </button>
              ) : null}
            </div>
            <input
              id="batch-upload"
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(e) => {
                addBatchFiles(e.target.files);
                try {
                  e.target.value = "";
                } catch {
                  /* ignore */
                }
              }}
            />
            <label
              htmlFor="batch-upload"
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                addBatchFiles(e.dataTransfer.files);
              }}
              className={`mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-4 py-6 text-center text-sm transition ${
                dragActive
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-primary/30 bg-background/40 text-foreground/70 hover:border-primary"
              }`}
            >
              Drop or tap to add up to {BATCH_MAX}
              <span className="mt-1 block text-xs text-foreground/45">
                First photo sets the background. Every other photo uses that same backdrop.
              </span>
            </label>
            {batchItems.length > 0 ? (
              <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto">
                {batchItems.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-2 rounded-lg bg-background/50 px-2 py-1.5"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.previewUrl}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] text-foreground/80">
                        {item.file.name}
                      </p>
                      <p className="text-[10px] text-foreground/50">
                        {item.status === "idle" && "Ready"}
                        {item.status === "queued" && "Queued"}
                        {item.status === "running" && "Generating…"}
                        {item.status === "done" && "Done"}
                        {item.status === "failed" && (item.error ?? "Failed")}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={batchRunning}
                      onClick={() => removeBatchItem(item.id)}
                      className="text-[11px] text-primary underline disabled:opacity-40"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : (
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-primary/90">
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
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-primary/30 bg-background/40 text-foreground/70 hover:border-primary"
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
                  <span className="text-xs text-foreground/80">{file.name}</span>
                </>
              ) : (
                <>
                  Drop or tap to upload
                  <span className="mt-1 block text-xs text-foreground/45">
                    JPG or PNG works best on iPhone
                  </span>
                </>
              )}
            </label>
          </div>
        )}

        {tab === "model" || tab === "background" ? (
          <div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-widest text-primary/90">
                Batch photos
              </p>
              {batchItems.length > 0 ? (
                <button
                  type="button"
                  onClick={clearBatch}
                  className="text-[11px] text-primary underline"
                >
                  Clear all
                </button>
              ) : null}
            </div>
            <input
              id="inline-batch-upload"
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(e) => {
                addBatchFiles(e.target.files);
                try {
                  e.target.value = "";
                } catch {
                  /* ignore */
                }
              }}
            />
            <label
              htmlFor="inline-batch-upload"
              className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-primary/30 bg-background/40 px-4 py-4 text-center text-sm text-foreground/70 hover:border-primary"
            >
              Add more pieces, up to {BATCH_MAX}
              <span className="mt-1 block text-xs text-foreground/45">
                {tab === "background"
                  ? "Every photo uses the backdrop color and shadow on this tab."
                  : "Every photo uses the model look on this tab."}
              </span>
            </label>
            {batchItems.length > 0 ? (
              <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto">
                {batchItems.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-2 rounded-lg bg-background/50 px-2 py-1.5"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.previewUrl}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] text-foreground/80">
                        {item.file.name}
                      </p>
                      <p className="text-[10px] text-foreground/50">
                        {item.status === "idle" && "Ready"}
                        {item.status === "queued" && "Queued"}
                        {item.status === "running" && "Generating…"}
                        {item.status === "done" && "Done"}
                        {item.status === "failed" && (item.error ?? "Failed")}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={batchRunning}
                      onClick={() => removeBatchItem(item.id)}
                      className="text-[11px] text-primary underline disabled:opacity-40"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {tab === "model" ? (
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-primary/90">
              Your photo / selfie
            </p>
            {canSelfie ? (
              <>
                <input
                  id="selfie-upload"
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="sr-only"
                  onChange={onSelfiePick}
                />
                <label
                  htmlFor="selfie-upload"
                  className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-primary/30 bg-background/40 px-4 py-4 text-center text-sm text-foreground/70 hover:border-primary"
                >
                  {selfieFile && selfiePreviewUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selfiePreviewUrl}
                        alt="Selfie"
                        className="mb-2 max-h-20 w-full rounded-lg object-contain"
                      />
                      <span className="text-xs">{selfieFile.name}</span>
                      <button
                        type="button"
                        className="mt-2 text-[11px] text-primary underline"
                        onClick={(e) => {
                          e.preventDefault();
                          setSelfieFile(null);
                        }}
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <>
                      Optional: upload selfie for try-on
                      <span className="mt-1 block text-xs text-foreground/45">
                        Platinum+ · face identity preserved
                      </span>
                    </>
                  )}
                </label>
              </>
            ) : (
              <p className="mt-2 rounded-lg bg-primary/10 px-3 py-2 text-[11px] text-foreground/65">
                Selfie try-on unlocks on{" "}
                <Link href="/pricing" className="font-medium text-primary underline">
                  Platinum and above
                </Link>
                .
              </p>
            )}
          </div>
        ) : null}

        {tab !== "video" ? (
          <ThemesPanel
            locked={!canThemes}
            enabled={canThemes}
            currentStyle={themeSnapshot()}
            previewUrl={resultUrl && !resultMime?.startsWith("video/") ? resultUrl : null}
            appliedThemeId={appliedThemeId}
            onApply={applyTheme}
            onClear={() => setAppliedThemeId(null)}
          />
        ) : null}

        {tab !== "video" ? (
          <BrandMarketingPanel
            value={brand}
            onChange={setBrand}
            locked={!canBrand}
          />
        ) : null}

        {tab === "video" ? (
          <div className="space-y-4">
            {!canVideo ? (
              <p className="rounded-lg bg-primary/10 px-3 py-2 text-[11px] text-foreground/65">
                Video unlocks on{" "}
                <Link href="/pricing" className="font-medium text-primary underline">
                  Diamond
                </Link>
                .
              </p>
            ) : (
              <>
                <div>
                  <p className="text-xs font-medium uppercase tracking-widest text-primary/90">
                    Ratio
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {VIDEO_ASPECT_IDS.map((id) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setVideoAspect(id)}
                        className={`rounded-lg px-3 py-2 text-left text-xs font-medium ${
                          videoAspect === id
                            ? "bg-primary text-background"
                            : "bg-background/50 text-foreground/70 hover:bg-primary/20"
                        }`}
                      >
                        <span className="block">{VIDEO_ASPECT_LABELS[id]}</span>
                        <span
                          className={`mt-0.5 block text-[10px] font-normal ${
                            videoAspect === id
                              ? "text-background/80"
                              : "text-foreground/45"
                          }`}
                        >
                          {VIDEO_ASPECT_HINTS[id]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-widest text-primary/90">
                    Show jewelry as
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {VIDEO_CAST_IDS.map((id) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setVideoCast(id)}
                        className={`rounded-lg px-3 py-2 text-left text-xs font-medium ${
                          videoCast === id
                            ? "bg-primary text-background"
                            : "bg-background/50 text-foreground/70 hover:bg-primary/20"
                        }`}
                      >
                        <span className="block">{VIDEO_CAST_LABELS[id]}</span>
                        <span
                          className={`mt-0.5 block text-[10px] font-normal ${
                            videoCast === id
                              ? "text-background/80"
                              : "text-foreground/45"
                          }`}
                        >
                          {VIDEO_CAST_HINTS[id]}
                        </span>
                      </button>
                    ))}
                  </div>
                  {videoCast === "model" ? (
                    <div className="mt-3 space-y-3">
                      <Field
                        label="Model type"
                        value={subject}
                        onChange={setSubject}
                        options={SUBJECTS.map(
                          (k) => [k, SUBJECT_LABELS[k]] as const,
                        )}
                      />
                      <Field
                        label="Campaign look"
                        value={lookPreset}
                        onChange={setLookPreset}
                        options={LOOK_PRESET_IDS.map(
                          (k) => [k, LOOK_PRESET_LABELS[k]] as const,
                        )}
                      />
                    </div>
                  ) : null}
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-widest text-primary/90">
                    Video type
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {VIDEO_PURPOSE_IDS.map((id) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setVideoPurpose(id)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                          videoPurpose === id
                            ? "bg-primary text-background"
                            : "bg-background/50 text-foreground/70 hover:bg-primary/20"
                        }`}
                      >
                        {VIDEO_PURPOSE_LABELS[id]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-widest text-primary/90">
                    Camera / motion
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {VIDEO_PRESET_IDS.map((id) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setVideoPreset(id)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                          videoPreset === id
                            ? "bg-primary text-background"
                            : "bg-background/50 text-foreground/70 hover:bg-primary/20"
                        }`}
                      >
                        {VIDEO_PRESET_LABELS[id]}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            <p className="text-[11px] text-foreground/50">
              Costs {CREDIT_COST_PER_VIDEO} credits · may take a few minutes
            </p>
          </div>
        ) : canCustomPrompt ? (
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-primary/90">
              Custom prompt
            </p>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value.slice(0, 2000))}
              rows={3}
              placeholder="Describe the look in your own words. When filled, style chips below are ignored."
              className="mt-2 w-full rounded-lg border border-primary/25 bg-background/40 px-3 py-2 text-sm text-foreground outline-none placeholder:text-foreground/40 focus:ring-2 focus:ring-primary"
            />
            <p className="mt-1 text-[11px] text-foreground/50">
              Gold+ feature. Leave empty to use the options below.
            </p>
          </div>
        ) : (
          <p className="rounded-lg bg-primary/10 px-3 py-2 text-[11px] text-foreground/65">
            Custom prompt unlocks on{" "}
            <Link href="/pricing" className="font-medium text-primary underline">
              Gold and above
            </Link>
            .
          </p>
        )}

        {tab === "video" ? null : tab === "batch" ? (
          <>
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-primary/90">
                Backdrop
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {BATCH_BACKDROP_MODES.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setBatchBackdropMode(id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                      batchBackdropMode === id
                        ? "bg-primary text-background"
                        : "bg-background/60 text-foreground/70 hover:bg-secondary"
                    }`}
                  >
                    {BATCH_BACKDROP_LABELS[id]}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-foreground/55">
                {BATCH_BACKDROP_HINTS[batchBackdropMode]}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-primary/90">
                Jewelry shadow
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {JEWELRY_SHADOWS.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setJewelryShadow(id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                      jewelryShadow === id
                        ? "bg-primary text-background"
                        : "bg-background/60 text-foreground/70 hover:bg-secondary"
                    }`}
                  >
                    {JEWELRY_SHADOW_LABELS[id]}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-foreground/55">
                {JEWELRY_SHADOW_HINTS[jewelryShadow]}
              </p>
            </div>
            <Field
              label="Framing"
              value={framing}
              onChange={setFraming}
              disabled={Boolean(customPrompt.trim())}
              options={FRAMINGS.map((k) => [k, FRAMING_LABELS[k]] as const)}
            />
          </>
        ) : mode === "model" ? (
          <>
            <Field
              label="Where to show jewelry"
              value={placement}
              onChange={setPlacement}
              disabled={Boolean(customPrompt.trim())}
              options={PLACEMENTS.map((k) => [k, PLACEMENT_LABELS[k]] as const)}
            />
            {selfieFile ? (
              <p className="rounded-lg bg-primary/10 px-3 py-2 text-[11px] text-foreground/65">
                Selfie uploaded — model type / campaign look / shot are hidden.
                Your photo is the model; only jewelry placement &amp; format matter.
              </p>
            ) : appliedThemeId ? (
              <p className="rounded-lg bg-primary/10 px-3 py-2 text-[11px] text-foreground/65">
                Theme applied — model / look / scene options are taken from the saved look.
                Upload new jewelry and Generate to swap the piece.
              </p>
            ) : (
              <>
                <Field
                  label="Model type"
                  value={subject}
                  onChange={setSubject}
                  options={SUBJECTS.map((k) => [k, SUBJECT_LABELS[k]] as const)}
                />
                <Field
                  label="Campaign look"
                  value={lookPreset}
                  onChange={setLookPreset}
                  options={LOOK_PRESET_IDS.map(
                    (k) => [k, LOOK_PRESET_LABELS[k]] as const,
                  )}
                />
                {lookPreset !== "auto" ? (
                  <p className="text-[11px] text-foreground/55">
                    {LOOK_PRESET_HINTS[lookPreset]}
                  </p>
                ) : (
                  <p className="text-[11px] text-foreground/55">
                    Auto picks a look from your scene, mood &amp; shot — still keeps
                    your jewelry exact.
                  </p>
                )}
                <Field
                  label="Shot type"
                  value={shot}
                  onChange={setShot}
                  disabled={Boolean(customPrompt.trim())}
                  options={SHOTS.map((k) => [k, SHOT_LABELS[k]] as const)}
                />
              </>
            )}
          </>
        ) : (
          <>
            <Field
              label="Framing"
              value={framing}
              onChange={setFraming}
              disabled={Boolean(customPrompt.trim())}
              options={FRAMINGS.map((k) => [k, FRAMING_LABELS[k]] as const)}
            />
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-primary/90">
                Jewelry shadow
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {JEWELRY_SHADOWS.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setJewelryShadow(id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                      jewelryShadow === id
                        ? "bg-primary text-background"
                        : "bg-background/60 text-foreground/70 hover:bg-secondary"
                    }`}
                  >
                    {JEWELRY_SHADOW_LABELS[id]}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-foreground/55">
                {JEWELRY_SHADOW_HINTS[jewelryShadow]}
              </p>
            </div>
            <div
              className={
                customPrompt.trim() ? "pointer-events-none opacity-40" : undefined
              }
            >
              <BackdropColorField
                value={backdropColor}
                hexInput={backdropHexInput}
                onSelectPreset={(hex) => {
                  setBackdropColor(hex);
                  setBackdropHexInput(hex);
                }}
                onHexInputChange={setBackdropHexInput}
                onApplyHex={() => {
                  const next = normalizeBackdropHex(backdropHexInput);
                  if (!next) {
                    setError("Enter a valid hex color like #110707");
                    return;
                  }
                  setError(null);
                  setBackdropColor(next);
                  setBackdropHexInput(next);
                }}
              />
            </div>
          </>
        )}
        {tab !== "video" ? (
          <>
            <Field
              label="Output format"
              value={format}
              onChange={setFormat}
              options={STUDIO_OUTPUT_FORMATS.map(
                (k) => [k, OUTPUT_FORMAT_LABELS[k]] as const,
              )}
            />
            <p className="text-[11px] leading-relaxed text-foreground/55">
              Targets Instagram / WhatsApp sizes. Download exports exact pixels
              (e.g. post 1080×1350, story 1080×1920, chat 1080×1080).
            </p>
            {!selfieFile && !appliedThemeId && (tab === "batch" ? batchBackdropMode === "scene" : true) ? (
              <>
                <Field
                  label="Scene"
                  value={scene}
                  onChange={setScene}
                  disabled={Boolean(customPrompt.trim())}
                  options={SCENES.map((k) => [k, SCENE_LABELS[k]] as const)}
                />
                <Field
                  label="Mood"
                  value={vibe}
                  onChange={setVibe}
                  disabled={Boolean(customPrompt.trim())}
                  options={VIBES.map((k) => [k, VIBE_LABELS[k]] as const)}
                />
              </>
            ) : tab === "batch" && batchBackdropMode !== "scene" && !appliedThemeId ? (
              <p className="text-[11px] text-foreground/55">
                Scene / Mood hidden for solid backdrops. Switch to Keep scene to
                style the setting.
              </p>
            ) : null}
          </>
        ) : null}

        <button
          type="button"
          disabled={
            loading ||
            batchRunning ||
            generationReady === false ||
            (batchItems.length > 0 && tab !== "video"
              ? batchItems.length === 0 ||
                (credits !== null &&
                  credits < batchItems.length * CREDIT_COST_PER_GENERATION)
              : tab === "video"
                ? !file ||
                  !canVideo ||
                  (credits !== null && credits < CREDIT_COST_PER_VIDEO)
                : !file || (credits !== null && credits < 1))
          }
          onClick={() =>
            void (batchItems.length > 0 && tab !== "video"
              ? generateBatch()
              : tab === "video"
                ? generateVideo()
                : generate())
          }
          className="rounded-xl bg-primary py-3 text-sm font-semibold text-background disabled:opacity-40 hover:bg-accent hover:text-foreground"
        >
          {loading || batchRunning
            ? tab === "video"
              ? "Generating video…"
              : batchItems.length > 0
                ? "Generating batch…"
                : "Generating…"
            : batchItems.length > 0 && tab !== "video"
              ? `Generate all (${batchItems.length * CREDIT_COST_PER_GENERATION} credits)`
              : tab === "video"
                ? `Generate video (${CREDIT_COST_PER_VIDEO} credits)`
                : appliedThemeId
                  ? "Generate with applied theme"
                  : mode === "background"
                    ? "Generate background"
                    : "Generate model shot"}
        </button>
        {batchItems.length > 0 && tab !== "video" && batchRunning ? (
          <button
            type="button"
            onClick={() => {
              batchAbortRef.current = true;
            }}
            className="text-center text-[11px] text-primary underline"
          >
            Stop after current image
          </button>
        ) : null}
        {batchItems.length > 0 && tab !== "video" &&
        !batchRunning &&
        batchItems.some((i) => i.status === "failed") ? (
          <button
            type="button"
            disabled={generationReady === false}
            onClick={() => void retryFailedBatch()}
            className="rounded-xl border border-primary/30 bg-secondary py-2 text-sm font-medium text-foreground hover:bg-accent/30"
          >
            Retry failed (
            {batchItems.filter((i) => i.status === "failed").length})
          </button>
        ) : null}
        {batchItems.length > 0 && tab !== "video" ? (
          <p className="text-center text-[11px] text-foreground/55">
            {tab === "background"
              ? "The first photo locks the backdrop. The rest use that same color"
              : "Each photo uses the model look selected above"}
            {appliedThemeId ? ", using your applied theme" : ""}.
          </p>
        ) : null}
        {tab !== "video" && !(batchItems.length > 0) && appliedThemeId ? (
          <p className="text-center text-[11px] text-foreground/55">
            Theme applied — new jewelry will reuse that look.
          </p>
        ) : null}

        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </aside>

      <section className="flex min-h-[420px] flex-col items-center justify-center gap-4">
        {batchItems.some((i) => i.status !== "idle" || Boolean(i.resultUrl)) &&
        tab !== "video" ? (
          <div className="w-full space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {batchItems.map((item) => (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-xl border border-primary/20 bg-secondary/80"
                >
                  <div
                    className={`relative bg-background/40 ${OUTPUT_FORMAT_ASPECT_CLASS[format]}`}
                  >
                    {item.resultUrl ? (
                      <button
                        type="button"
                        onClick={() => {
                          setResultUrl(item.resultUrl!);
                          setResultMime("image/jpeg");
                          setLightboxOpen(true);
                        }}
                        className="block h-full w-full cursor-zoom-in"
                        aria-label={`View ${item.file.name}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.resultUrl}
                          alt={item.file.name}
                          className="h-full w-full object-contain"
                        />
                      </button>
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-2 text-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.previewUrl}
                          alt=""
                          className="mb-1 h-12 w-12 rounded object-cover opacity-60"
                        />
                        <p className="text-[10px] text-foreground/55">
                          {item.status === "running" && "Generating…"}
                          {item.status === "queued" && "Queued"}
                          {item.status === "idle" && "Waiting"}
                          {item.status === "failed" && "Failed"}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-1 px-2 py-1.5">
                    <p className="truncate text-[10px] text-foreground/65">
                      {item.file.name}
                    </p>
                    {item.resultUrl ? (
                      <DownloadImageButton
                        url={item.resultUrl}
                        filename={downloadFilename(
                          item.resultUrl,
                          `jwelpixel-batch-${format}`,
                          "image/jpeg",
                        )}
                        exportFormat={format}
                        className="shrink-0 text-[10px] font-semibold text-primary underline"
                        label="Save"
                      />
                    ) : item.status === "failed" && !batchRunning ? (
                      <button
                        type="button"
                        onClick={() => void runBatchIds([item.id])}
                        className="shrink-0 text-[10px] font-semibold text-primary underline"
                      >
                        Retry
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
            {batchItems.some((i) => i.resultUrl) ? (
              <p className="text-center text-[11px] text-foreground/55">
                {
                  batchItems.filter((i) => i.status === "done" && i.resultUrl)
                    .length
                }{" "}
                of {batchItems.length} ready — tap a result to zoom, Save to
                download.
              </p>
            ) : null}
            {resultUrl && lightboxOpen ? (
              <ImageLightbox
                url={resultUrl}
                alt="Batch result"
                open={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
                filename={downloadFilename(
                  resultUrl,
                  `jwelpixel-batch-${format}`,
                  resultMime,
                )}
              />
            ) : null}
          </div>
        ) : loading && tab !== "batch" ? (
          <GenerationPreviewPlaceholder
            aspectClass={
              tab === "video"
                ? VIDEO_ASPECT_CLASS[videoAspect]
                : OUTPUT_FORMAT_ASPECT_CLASS[format]
            }
            label={
              tab === "video"
                ? "Creating your jewelry video…"
                : mode === "background"
                  ? "Creating your background still…"
                  : "Creating your model shot…"
            }
          />
        ) : resultUrl && tab !== "batch" ? (
          <>
            {resultMime?.startsWith("video/") || tab === "video" ? (
              <div
                className={`mx-auto w-full overflow-hidden rounded-2xl border border-primary/20 bg-secondary shadow-lg ${VIDEO_ASPECT_CLASS[videoAspect]}`}
              >
                <video
                  src={resultUrl}
                  controls
                  playsInline
                  className="h-full w-full bg-background/50 object-contain"
                />
              </div>
            ) : (
              <div
                className={`mx-auto w-full overflow-hidden rounded-2xl border border-primary/20 bg-secondary shadow-lg ${OUTPUT_FORMAT_ASPECT_CLASS[format]}`}
              >
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  className="block h-full w-full cursor-zoom-in"
                  aria-label="View full size"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resultUrl}
                    alt={
                      mode === "background" ? "Background still" : "Model shot"
                    }
                    className="h-full w-full bg-background/50 object-contain"
                  />
                </button>
              </div>
            )}
            <div className="flex flex-wrap items-center justify-center gap-3">
              {!(resultMime?.startsWith("video/") || tab === "video") ? (
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  className="rounded-xl border border-primary/25 bg-secondary px-4 py-2 text-sm font-medium text-foreground hover:bg-accent/30"
                >
                  Zoom in
                </button>
              ) : null}
              {canThemes &&
              !(resultMime?.startsWith("video/") || tab === "video") &&
              resultUrl ? (
                <button
                  type="button"
                  onClick={() => void saveCurrentResultAsTheme()}
                  className="rounded-xl border border-primary/40 bg-primary/15 px-4 py-2 text-sm font-semibold text-foreground hover:bg-primary/25"
                >
                  Save as look
                </button>
              ) : null}
              <DownloadImageButton
                url={resultUrl}
                filename={downloadFilename(
                  resultUrl,
                  tab === "video" || resultMime?.startsWith("video/")
                    ? `jwelpixel-video-${videoPurpose}-${videoAspect}`
                    : mode === "background"
                      ? `jwelpixel-background-${format}`
                      : `jwelpixel-model-${format}`,
                  resultMime,
                )}
                exportFormat={
                  resultMime?.startsWith("video/") || tab === "video"
                    ? undefined
                    : format
                }
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-background hover:bg-accent hover:text-foreground"
                label={
                  resultMime?.startsWith("video/") || tab === "video"
                    ? "Download video"
                    : "Download image"
                }
              />
              {!(resultMime?.startsWith("video/") || tab === "video") ? (
                <MarketingPosterButton
                  imageUrl={resultUrl}
                  brand={brand}
                  className="rounded-xl border border-primary/40 bg-primary/15 px-4 py-2 text-sm font-semibold text-foreground hover:bg-primary/25"
                />
              ) : null}
              {!(resultMime?.startsWith("video/") || tab === "video") ? (
                <ShareImageButton
                  generationId={generationId}
                  imageUrl={resultUrl}
                />
              ) : null}
            </div>
            {canThemes &&
            !(resultMime?.startsWith("video/") || tab === "video") ? (
              <p className="max-w-md text-center text-[11px] text-foreground/55">
                Tip: click <strong className="font-medium text-foreground/70">Save as look</strong>, then
                upload different jewelry and Generate to reuse this style.
              </p>
            ) : null}
            {!(resultMime?.startsWith("video/") || tab === "video") ? (
              <ImageLightbox
                url={resultUrl}
                alt={mode === "background" ? "Background still" : "Model shot"}
                open={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
                filename={downloadFilename(
                  resultUrl,
                  mode === "background"
                    ? `jwelpixel-background-${format}`
                    : `jwelpixel-model-${format}`,
                  resultMime,
                )}
              />
            ) : null}
          </>
        ) : (
          <p className="max-w-sm text-center text-sm text-foreground/55">
            {tab === "video"
                ? "Your jewelry video will appear here after generation. Pick ratio, type, and motion first."
                : mode === "background"
                  ? "Your jewelry on a styled background will appear here after generation."
                  : "Your AI model shot will appear here after generation."}
          </p>
        )}
      </section>
    </div>
    </>
  );
}

function BackdropColorField({
  value,
  hexInput,
  onSelectPreset,
  onHexInputChange,
  onApplyHex,
}: {
  value: string;
  hexInput: string;
  onSelectPreset: (hex: string) => void;
  onHexInputChange: (hex: string) => void;
  onApplyHex: () => void;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-widest text-primary/90">
        Background color
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {BACKDROP_COLOR_PRESETS.map((preset) => {
          const selected = value === preset.hex;
          const isLight =
            preset.hex === "#FFFFFF" ||
            preset.hex === "#F5F0E8" ||
            preset.hex === "#F3E4E7";
          return (
            <button
              key={preset.id}
              type="button"
              title={preset.label}
              aria-label={preset.label}
              aria-pressed={selected}
              onClick={() => onSelectPreset(preset.hex)}
              className={`relative h-8 w-8 rounded-full transition ${
                selected
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-secondary"
                  : "ring-1 ring-primary/25 hover:ring-primary/50"
              }`}
              style={{ backgroundColor: preset.hex }}
            >
              {isLight ? (
                <span className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-black/10" />
              ) : null}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span
          className="h-8 w-8 shrink-0 rounded-full ring-1 ring-primary/25"
          style={{ backgroundColor: normalizeBackdropHex(hexInput) ?? "#CCCCCC" }}
          aria-hidden
        />
        <input
          type="text"
          value={hexInput}
          onChange={(e) => onHexInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onApplyHex();
            }
          }}
          placeholder="#FFFFFF"
          spellCheck={false}
          className="min-w-0 flex-1 rounded-lg border border-primary/25 bg-background/40 px-3 py-2 font-mono text-sm text-foreground outline-none placeholder:text-foreground/40 focus:ring-2 focus:ring-primary"
          aria-label="Custom backdrop hex color"
        />
        <button
          type="button"
          onClick={onApplyHex}
          className="shrink-0 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-background hover:bg-accent hover:text-foreground"
        >
          Apply
        </button>
      </div>
      <p className="mt-1.5 text-[11px] text-foreground/50">
        Choose a preset or enter a custom hex color for the solid backdrop.
      </p>
    </div>
  );
}

function Field<T extends string>({
  label,
  value,
  onChange,
  options,
  disabled = false,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: readonly (readonly [T, string])[];
  disabled?: boolean;
}) {
  return (
    <div className={disabled ? "opacity-40" : undefined}>
      <p className="text-xs font-medium uppercase tracking-widest text-primary/90">
        {label}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {options.map(([key, name]) => (
          <button
            key={key}
            type="button"
            disabled={disabled}
            onClick={() => onChange(key)}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition disabled:cursor-not-allowed ${
              value === key
                ? "bg-primary text-background"
                : "bg-background/50 text-foreground/80 ring-1 ring-primary/20 hover:bg-accent/30"
            }`}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}
