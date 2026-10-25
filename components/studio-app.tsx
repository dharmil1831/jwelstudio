"use client";

import { BrandMarketingPanel, EMPTY_BRAND, type BrandFormState } from "@/components/brand-marketing-panel";
import { StudioMobileHome } from "@/components/studio-mobile-home";
import { ClassicBackdropRow } from "@/components/classic-backdrop-row";
import { DownloadImageButton } from "@/components/download-image-button";
import { GenerationPreviewPlaceholder } from "@/components/generation-preview-placeholder";
import { BrandedVideoStage, VideoBrandFields } from "@/components/video-brand-fields";
import { renderBrandedVideo, videoLengthLabel } from "@/lib/brand-video";
import { ImageLightbox } from "@/components/image-lightbox";
import { ShareImageButton } from "@/components/share-image-button";
import { ThemesPanel, type ThemeListItem } from "@/components/themes-panel";
import { prepareImageForUpload } from "@/lib/image-resize";
import { downloadFilename } from "@/lib/download-image";
import { finishProductImage } from "@/lib/product-finish";
import { ReflectionControls } from "@/components/reflection-controls";
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
  VIDEO_PHOTO_LOCK_NOTE,
  VIDEO_CAST_IDS,
  VIDEO_CAST_LABELS,
  VIDEO_PRESET_IDS,
  VIDEO_PRESET_LABELS,
  VIDEO_PURPOSE_HINTS,
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
import { nearestOutputFormat, type CustomSize } from "@/lib/custom-size";
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

/** One photo at a time. Parallel calls were hitting the Vercel time limit after the first image. */
const BATCH_CONCURRENCY = 1;

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

function festivalSelected(brand: BrandFormState): boolean {
  return Boolean(brand.festivalId && brand.festivalId !== "none");
}

/** Batch / festival: solid white kills festive scene — prefer scene mode. */
function resolveBackdropPayload(
  opts: {
    batchMode?: BatchBackdropMode;
    solidHex?: string;
    festivalOn: boolean;
  },
): { backdropMode: "solid" | "scene"; backdropColor?: string } {
  if (opts.festivalOn) {
    return { backdropMode: "scene" };
  }
  if (opts.batchMode === "scene") {
    return { backdropMode: "scene" };
  }
  if (opts.batchMode === "soft_studio") {
    return { backdropMode: "solid", backdropColor: "#F5F0E8" };
  }
  if (opts.batchMode === "white") {
    return { backdropMode: "solid", backdropColor: "#FFFFFF" };
  }
  return {
    backdropMode: "solid",
    backdropColor: opts.solidHex ?? DEFAULT_BACKDROP_HEX,
  };
}

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
  const [userEmail, setUserEmail] = useState<string | null>(null);
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
  const [customSize, setCustomSize] = useState<CustomSize | null>(null);
  const [backdropColor, setBackdropColor] = useState<string>(DEFAULT_BACKDROP_HEX);
  const [backdropHexInput, setBackdropHexInput] = useState(DEFAULT_BACKDROP_HEX);
  const [videoPreset, setVideoPreset] = useState<VideoPresetId>("slow_orbit");
  const [videoAspect, setVideoAspect] = useState<VideoAspectId>("vertical");
  const [videoPurpose, setVideoPurpose] = useState<VideoPurposeId>("promotional");
  const [videoCast, setVideoCast] = useState<VideoCastId>("product");
  const [videoShopName, setVideoShopName] = useState("");
  const [videoLogoSrc, setVideoLogoSrc] = useState<string | null>(null);
  const [videoEndCard, setVideoEndCard] = useState(false);
  const [videoSeconds, setVideoSeconds] = useState<number | null>(null);
  const [brandingVideo, setBrandingVideo] = useState(false);
  const [videoBrandedFile, setVideoBrandedFile] = useState(false);
  const brandedUrlRef = useRef<string | null>(null);
  const [appliedThemeId, setAppliedThemeId] = useState<string | null>(null);
  const appliedThemeIdRef = useRef<string | null>(null);
  const themePromptRef = useRef<string | null>(null);
  const tabRef = useRef<StudioTab>("model");
  const savingThemeRef = useRef(false);
  const savedResultUrlRef = useRef<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingTheme, setSavingTheme] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lookNotice, setLookNotice] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [jewelryShadow, setJewelryShadow] = useState<JewelryShadow>("off");
  const [cutoutTransparent, setCutoutTransparent] = useState(false);
  const [sceneBackdrop, setSceneBackdrop] = useState(false);
  const [reflectionOn, setReflectionOn] = useState(false);
  const [reflectionOpacity, setReflectionOpacity] = useState(80);
  const [finishedUrl, setFinishedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (
      !resultUrl ||
      mode !== "background" ||
      resultMime?.startsWith("video/") ||
      (!cutoutTransparent && !reflectionOn && jewelryShadow === "off")
    ) {
      setFinishedUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }
    let cancelled = false;
    let tempUrl: string | null = null;
    void (async () => {
      let sourceUrl = resultUrl;
      if (generationId) {
        const res = await fetch(`/api/generations/${generationId}/file`);
        if (!res.ok) throw new Error("Could not load image");
        const fileBlob = await res.blob();
        if (cancelled) return;
        tempUrl = URL.createObjectURL(fileBlob);
        sourceUrl = tempUrl;
      }
      const blob = await finishProductImage({
        sourceUrl,
        cutout: cutoutTransparent,
        reflection: reflectionOn,
        reflectionOpacity,
        shadow: cutoutTransparent ? "off" : jewelryShadow,
      });
      if (cancelled) return;
      const url = URL.createObjectURL(blob);
      setFinishedUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    })()
      .catch(() => {
        if (!cancelled) setFinishedUrl(null);
      })
      .finally(() => {
        if (tempUrl) URL.revokeObjectURL(tempUrl);
      });
    return () => {
      cancelled = true;
    };
  }, [
    resultUrl,
    resultMime,
    mode,
    cutoutTransparent,
    reflectionOn,
    reflectionOpacity,
    jewelryShadow,
    generationId,
  ]);
  const [batchBackdropMode, setBatchBackdropMode] =
    useState<BatchBackdropMode>("white");
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [batchRunning, setBatchRunning] = useState(false);
  const batchAbortRef = useRef(false);
  useEffect(() => {
    try {
      window.localStorage.removeItem("jwelpixel-brand-kit-v1");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!festivalSelected(brand)) return;
    setBatchBackdropMode("scene");
    setScene("festive_indoor");
    setVibe("festive");
  }, [brand.festivalId]);

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
            user?: { email?: string | null };
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
              setUserEmail(
                typeof d.user?.email === "string" ? d.user.email : null,
              );
            } else {
              setCredits(null);
              setUserEmail(null);
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
          setUserEmail(null);
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

  const releaseSavedLook = useCallback((announce = true) => {
    const hadLook = appliedThemeIdRef.current != null;
    appliedThemeIdRef.current = null;
    themePromptRef.current = null;
    setAppliedThemeId(null);
    if (!hadLook) return;
    setCustomPrompt("");
    setPlacement("auto");
    setSubject("auto");
    setLookPreset("auto");
    setShot("editorial");
    setFraming("catalog");
    setScene("studio");
    setVibe("luxury");
    if (announce) setLookNotice("Look turned off. Options are back to normal.");
  }, []);

  const leaveEditor = useCallback(() => {
    releaseSavedLook(false);
    setLookNotice(null);
    setFile(null);
    setSelfieFile(null);
    setResultUrl(null);
    setResultMime(null);
    setGenerationId(null);
    setError(null);
    clearBatch();
  }, [releaseSavedLook, clearBatch]);

  useEffect(() => {
    if (!lookNotice) return;
    const timer = window.setTimeout(() => setLookNotice(null), 6000);
    return () => window.clearTimeout(timer);
  }, [lookNotice]);

  const editPrompt = useCallback(
    (value: string) => {
      if (
        appliedThemeIdRef.current &&
        themePromptRef.current &&
        value !== themePromptRef.current
      ) {
        releaseSavedLook();
      }
      setCustomPrompt(value);
    },
    [releaseSavedLook],
  );

  const applyTheme = useCallback((theme: ThemeListItem, style: ThemeStyleSnapshot, keepResult = false) => {
    appliedThemeIdRef.current = theme.id;
    themePromptRef.current = style.customPrompt?.trim() ? style.customPrompt : null;
    setAppliedThemeId(theme.id);
    setTab((current) => {
      const next = current === "batch" ? current : style.mode;
      tabRef.current = next;
      return next;
    });
    setMode(style.mode);
    setPlacement(style.placement);
    setSubject(style.subject);
    setLookPreset(parseLookPreset(style.lookPreset));
    setShot(style.shot);
    setFraming(style.framing);
    setScene(style.scene);
    setVibe(style.vibe);
    setFormat(style.format);
    setCustomSize(null);
    if (style.backdropColor) {
      setBackdropColor(style.backdropColor);
      setBackdropHexInput(style.backdropColor);
    }
    setCustomPrompt(style.customPrompt ?? "");
    setLookNotice(null);
    if (!keepResult) {
      setResultUrl(null);
      setResultMime(null);
    }
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
    if (savingThemeRef.current) return;
    if (!resultUrl || resultMime?.startsWith("video/")) return;
    if (savedResultUrlRef.current === resultUrl) {
      setLookNotice("This photo is already saved as a look.");
      return;
    }
    if (!canThemes) {
      setError("Saved looks unlock on Platinum and above.");
      return;
    }
    savingThemeRef.current = true;
    setSavingTheme(true);
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
      savedResultUrlRef.current = resultUrl;
      if (data.theme) {
        const { parseThemeStyleJson } = await import("@/lib/themes");
        const style = parseThemeStyleJson(data.theme.styleJson);
        if (style) applyTheme(data.theme, style, true);
      }
      setError(null);
      window.alert(
        "Look saved. It is used for the next Generate only. Change any option, or go Home, and it turns off.",
      );
    } catch (err) {
      setError(friendlyClientError(err));
    } finally {
      savingThemeRef.current = false;
      setSavingTheme(false);
    }
  }, [resultUrl, resultMime, canThemes, themeSnapshot, applyTheme]);

  const generate = useCallback(async (modeOverride?: "model" | "background") => {
    if (!file) return;
    const useMode = modeOverride ?? (mode === "background" ? "background" : "model");
    setLoading(true);
    setError(null);
    setResultUrl(null);
    setResultMime(null);
    setGenerationId(null);

    try {
      const { base64, mimeType } = await prepareImageForUpload(file);
      let selfieBase64: string | undefined;
      let selfieMimeType: string | undefined;
      if (selfieFile && useMode === "model" && canSelfie) {
        const selfie = await prepareImageForUpload(selfieFile);
        selfieBase64 = selfie.base64;
        selfieMimeType = selfie.mimeType;
      }

      const festivalOn = festivalSelected(brand);
      const backdrop =
        useMode === "background"
          ? sceneBackdrop && !festivalOn
            ? { backdropMode: "scene" as const }
            : resolveBackdropPayload({
                solidHex: cutoutTransparent ? "#FFFFFF" : backdropColor,
                festivalOn,
              })
          : null;

      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 200_000);
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType,
          mode: useMode,
          placement,
          subject,
          shot,
          framing,
          scene: festivalOn ? "festive_indoor" : scene,
          vibe: festivalOn ? "festive" : vibe,
          format,
          customWidth: customSize?.width,
          customHeight: customSize?.height,
          lookPreset: useMode === "model" && !customPrompt.trim() ? lookPreset : undefined,
          backdropMode: backdrop?.backdropMode,
          backdropColor: backdrop?.backdropColor,
          jewelryShadow:
            useMode === "background"
              ? cutoutTransparent
                ? "off"
                : jewelryShadow
              : undefined,
          transparentBackdrop: useMode === "background" && cutoutTransparent,
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
          themeId: appliedThemeIdRef.current || undefined,
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
      if (data.resultUrl) {
        setResultUrl(data.resultUrl);
        releaseSavedLook();
      }
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
    customSize,
    lookPreset,
    backdropColor,
    cutoutTransparent,
    sceneBackdrop,
    jewelryShadow,
    customPrompt,
    brand,
    releaseSavedLook,
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

      const themeForBatch = appliedThemeIdRef.current;
      batchAbortRef.current = false;
      setBatchRunning(true);
      setLoading(true);
      setError(null);

      setBatchItems((prev) =>
        prev.map((i) => {
          if (!ids.includes(i.id)) return i;
          return {
            ...i,
            status: "queued" as const,
            resultUrl: undefined,
            generationId: undefined,
            error: undefined,
          };
        }),
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

      const festivalOn = festivalSelected(brand);
      const backdrop = resolveBackdropPayload({
        batchMode: batchBackdropMode,
        festivalOn,
      });
      const batchScene = festivalOn ? "festive_indoor" : scene;
      const batchVibe = festivalOn ? "festive" : vibe;

      const pending = [...ids];
      let stopForCredits = false;
      let lastBatchResultUrl: string | undefined;

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
          const timeout = window.setTimeout(() => controller.abort(), 200_000);
          const res = await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageBase64: base64,
              mimeType,
              mode: "background",
              framing,
              scene: batchScene,
              vibe: batchVibe,
              format,
              customWidth: customSize?.width,
              customHeight: customSize?.height,
              backdropMode: backdrop.backdropMode,
              backdropColor: backdrop.backdropColor,
              jewelryShadow,
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
              themeId: themeForBatch || undefined,
              backgroundLockGenerationId: lockId,
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
            lastBatchResultUrl = data.resultUrl;
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

      if (lastBatchResultUrl) {
        setResultUrl(lastBatchResultUrl);
        setResultMime("image/jpeg");
        releaseSavedLook();
      }

      setBatchRunning(false);
      setLoading(false);
    },
    [
      batchItems,
      batchRunning,
      credits,
      framing,
      scene,
      vibe,
      format,
      customSize,
      batchBackdropMode,
      jewelryShadow,
      customPrompt,
      brand,
      releaseSavedLook,
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

  const pickVideoLogo = useCallback((logoFile: File | null) => {
    if (!logoFile) {
      setVideoLogoSrc(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setVideoLogoSrc(String(reader.result ?? ""));
    reader.onerror = () => setError("Could not read that logo. Try another image.");
    reader.readAsDataURL(logoFile);
  }, []);

  const generateVideo = useCallback(async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setLookNotice(null);
    setResultUrl(null);
    setResultMime(null);
    setGenerationId(null);
    setVideoSeconds(null);
    setVideoBrandedFile(false);
    if (brandedUrlRef.current) {
      URL.revokeObjectURL(brandedUrlRef.current);
      brandedUrlRef.current = null;
    }

    try {
      const { base64, mimeType } = await prepareImageForUpload(file);
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 290_000);
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
      const mime =
        typeof data.mimeType === "string" && data.mimeType.startsWith("video/")
          ? data.mimeType
          : "video/mp4";
      const generation =
        typeof data.generationId === "string" ? data.generationId : null;
      if (generation) setGenerationId(generation);
      const wantsBrand = Boolean(videoShopName.trim() || videoLogoSrc);
      const wantsUnbox = videoPurpose === "reveal";
      if (data.resultUrl && (wantsBrand || wantsUnbox)) {
        setLoading(false);
        setBrandingVideo(true);
        try {
          const branded = await renderBrandedVideo({
            src: generation
              ? `/api/generations/${encodeURIComponent(generation)}/file`
              : data.resultUrl,
            name: videoShopName.trim(),
            logoSrc: videoLogoSrc,
            endCard: videoEndCard && wantsBrand,
            unbox: wantsUnbox,
          });
          if (brandedUrlRef.current) URL.revokeObjectURL(brandedUrlRef.current);
          const localUrl = URL.createObjectURL(branded.blob);
          brandedUrlRef.current = localUrl;
          setVideoSeconds(branded.clipSeconds);
          setResultMime(branded.blob.type || "video/webm");
          setResultUrl(localUrl);
          setVideoBrandedFile(true);
          if (generation) {
            const form = new FormData();
            const fileType = branded.blob.type || "video/webm";
            form.append(
              "file",
              branded.blob,
              fileType.includes("webm") ? "finish.webm" : "finish.mp4",
            );
            await fetch(`/api/generations/${encodeURIComponent(generation)}/finish`, {
              method: "POST",
              body: form,
            }).catch(() => undefined);
          }
        } catch {
          setResultUrl(data.resultUrl);
          setResultMime(mime);
          setVideoBrandedFile(false);
          setLookNotice(
            wantsUnbox
              ? "Your video is ready. The lid plays on screen. Download saves the jewelry clip."
              : "Your video is ready. The shop name plays on screen. Download saves the jewelry clip.",
          );
        } finally {
          setBrandingVideo(false);
        }
      } else if (data.resultUrl) {
        setResultUrl(data.resultUrl);
        setResultMime(mime);
        setVideoBrandedFile(false);
      }
    } catch (err) {
      setError(friendlyClientError(err));
    } finally {
      setLoading(false);
      setBrandingVideo(false);
    }
  }, [
    file,
    videoPreset,
    videoAspect,
    videoPurpose,
    videoCast,
    subject,
    lookPreset,
    customPrompt,
    videoShopName,
    videoLogoSrc,
    videoEndCard,
  ]);

  const selectTab = useCallback((next: StudioTab) => {
    if (tabRef.current !== next) releaseSavedLook();
    tabRef.current = next;
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
  }, [releaseSavedLook]);

  function dropLook<T>(setter: (value: T) => void) {
    return (value: T) => {
      releaseSavedLook();
      setter(value);
    };
  }

  const controlsLocked = Boolean(customPrompt.trim()) && !appliedThemeId;

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
          userEmail={userEmail}
          previewUrl={previewUrl}
          fileName={file?.name ?? null}
          resultUrl={resultUrl}
          resultMime={resultMime}
          generationId={generationId}
          loading={loading || batchRunning}
          savingTheme={savingTheme}
          error={error}
          canCustomPrompt={canCustomPrompt}
          canBrand={canBrand}
          canThemes={canThemes}
          canSelfie={canSelfie}
          canVideo={canVideo}
          generationReady={generationReady}
          customPrompt={customPrompt}
          onCustomPrompt={editPrompt}
          onLeaveEditor={leaveEditor}
          lookNotice={lookNotice}
          brand={brand}
          onBrand={setBrand}
          subject={subject}
          onSubject={dropLook(setSubject)}
          lookPreset={lookPreset}
          onLook={dropLook(setLookPreset)}
          shot={shot}
          onShot={dropLook(setShot)}
          placement={placement}
          onPlacement={dropLook(setPlacement)}
          scene={scene}
          onScene={dropLook(setScene)}
          vibe={vibe}
          onVibe={dropLook(setVibe)}
          framing={framing}
          onFraming={dropLook(setFraming)}
          format={format}
          onFormat={(next) => {
            releaseSavedLook();
            setCustomSize(null);
            setFormat(next);
          }}
          customSize={customSize}
          onCustomSize={(size) => {
            releaseSavedLook();
            setCustomSize(size);
            setFormat(nearestOutputFormat(size.width, size.height));
          }}
          onClearCustomSize={() => setCustomSize(null)}
          backdropColor={backdropColor}
          cutoutTransparent={cutoutTransparent}
          sceneBackdrop={sceneBackdrop}
          onClassicBackdrop={(kind) => {
            releaseSavedLook();
            setMode("background");
            setTab("background");
            if (kind === "transparent") {
              setCutoutTransparent(true);
              setSceneBackdrop(false);
              setBackdropColor("#FFFFFF");
              setBackdropHexInput("#FFFFFF");
              setJewelryShadow("off");
              return;
            }
            setCutoutTransparent(false);
            if (kind === "original") {
              setSceneBackdrop(true);
              return;
            }
            setSceneBackdrop(false);
            const hex = kind === "black" ? "#111111" : "#FFFFFF";
            setBackdropColor(hex);
            setBackdropHexInput(hex);
          }}
          reflectionOn={reflectionOn}
          reflectionOpacity={reflectionOpacity}
          onReflectionOn={setReflectionOn}
          onReflectionOpacity={setReflectionOpacity}
          finishedPreviewUrl={finishedUrl}
          onBackdrop={(hex) => {
            releaseSavedLook();
            setCutoutTransparent(false);
            setSceneBackdrop(false);
            setBackdropColor(hex);
            setBackdropHexInput(hex);
            setBatchBackdropMode("white");
          }}
          backdropHexInput={backdropHexInput}
          onBackdropHexInput={setBackdropHexInput}
          onApplyBackdropHex={() => {
            const next = normalizeBackdropHex(backdropHexInput);
            if (!next) {
              setError("Enter a valid hex color like #110707");
              return;
            }
            setError(null);
            setCutoutTransparent(false);
            setSceneBackdrop(false);
            setBackdropColor(next);
            setBackdropHexInput(next);
            setBatchBackdropMode("white");
          }}
          jewelryShadow={jewelryShadow}
          onShadow={dropLook(setJewelryShadow)}
          videoPreset={videoPreset}
          onVideoPreset={setVideoPreset}
          videoAspect={videoAspect}
          onVideoAspect={setVideoAspect}
          videoPurpose={videoPurpose}
          onVideoPurpose={setVideoPurpose}
          videoCast={videoCast}
          onVideoCast={setVideoCast}
          videoShopName={videoShopName}
          onVideoShopName={setVideoShopName}
          videoLogoSrc={videoLogoSrc}
          onPickVideoLogo={pickVideoLogo}
          videoEndCard={videoEndCard}
          onVideoEndCard={setVideoEndCard}
          videoSeconds={videoSeconds}
          onVideoSeconds={setVideoSeconds}
          brandingVideo={brandingVideo}
          videoBrandedFile={videoBrandedFile}
          selfiePreviewUrl={selfiePreviewUrl}
          onPickJewelry={applyFile}
          onPickSelfie={applySelfie}
          onAddBatch={addBatchFiles}
          onSelectJob={(job) => {
            if (job === "video" && !canVideo) {
              setError("Video unlocks on Diamond. See Pricing.");
              return;
            }
            selectTab(job);
          }}
          onGenerate={(job) => {
            const asVideo = job === "video" || (job == null && tab === "video");
            if (asVideo) {
              void generateVideo();
              return;
            }
            const imageMode =
              job === "background" ||
              (job == null && (tab === "background" || tab === "batch"))
                ? "background"
                : "model";
            if (job === "model" || job === "background") selectTab(imageMode);
            void (batchItems.length > 0 ? generateBatch() : generate(imageMode));
          }}
          themeSnapshot={themeSnapshot}
          appliedThemeId={appliedThemeId}
          onApplyTheme={applyTheme}
          onClearTheme={releaseSavedLook}
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
                One jewelry product per photo works best. First photo sets the
                shared backdrop for the rest.
              </span>
            </label>
            {festivalSelected(brand) ? (
              <p className="mt-2 rounded-lg bg-primary/10 px-3 py-2 text-[11px] leading-relaxed text-foreground/70">
                Festival <strong className="font-medium text-foreground/85">{brand.festivalLabel || "selected"}</strong>{" "}
                styles the photo scene. The download is the generated photo.
              </p>
            ) : (
              <p className="mt-2 text-[11px] leading-relaxed text-foreground/50">
                Tip: pick a festival for a festive photo scene.
              </p>
            )}
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
            onClear={releaseSavedLook}
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
                        onChange={dropLook(setSubject)}
                        options={SUBJECTS.map(
                          (k) => [k, SUBJECT_LABELS[k]] as const,
                        )}
                      />
                      <Field
                        label="Campaign look"
                        value={lookPreset}
                        onChange={dropLook(setLookPreset)}
                        options={LOOK_PRESET_IDS.map(
                          (k) => [k, LOOK_PRESET_LABELS[k]] as const,
                        )}
                      />
                      <p className="text-[11px] leading-relaxed text-foreground/55">
                        {VIDEO_PHOTO_LOCK_NOTE}
                      </p>
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
                  <p className="mt-2 text-[11px] text-foreground/55">
                    {VIDEO_PURPOSE_HINTS[videoPurpose]}
                  </p>
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
            <VideoBrandFields
              name={videoShopName}
              onName={setVideoShopName}
              logoSrc={videoLogoSrc}
              onLogoFile={pickVideoLogo}
              endCard={videoEndCard}
              onEndCard={setVideoEndCard}
            />
            {videoSeconds != null && (resultMime?.startsWith("video/") || tab === "video") ? (
              <p className="text-xs font-semibold text-foreground/70">
                {videoLengthLabel(videoSeconds, videoBrandedFile && videoEndCard)}
              </p>
            ) : null}
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
              onChange={(e) => editPrompt(e.target.value.slice(0, 2000))}
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
                {BATCH_BACKDROP_MODES.map((id) => {
                  const festivalLocksScene =
                    festivalSelected(brand) && id !== "scene";
                  const active = festivalSelected(brand)
                    ? id === "scene"
                    : batchBackdropMode === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      disabled={festivalLocksScene}
                      onClick={() => setBatchBackdropMode(id)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-40 ${
                        active
                          ? "bg-primary text-background"
                          : "bg-background/60 text-foreground/70 hover:bg-secondary"
                      }`}
                    >
                      {BATCH_BACKDROP_LABELS[id]}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-[11px] text-foreground/55">
                {festivalSelected(brand)
                  ? "Festival selected — Keep scene is required so festive props can appear (solid white would hide them)."
                  : BATCH_BACKDROP_HINTS[batchBackdropMode]}
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
                    onClick={() => dropLook(setJewelryShadow)(id)}
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
              onChange={dropLook(setFraming)}
              disabled={controlsLocked}
              options={FRAMINGS.map((k) => [k, FRAMING_LABELS[k]] as const)}
            />
          </>
        ) : mode === "model" ? (
          <>
            <Field
              label="Where to show jewelry"
              value={placement}
              onChange={dropLook(setPlacement)}
              disabled={controlsLocked}
              options={PLACEMENTS.map((k) => [k, PLACEMENT_LABELS[k]] as const)}
            />
            {selfieFile ? (
              <p className="rounded-lg bg-primary/10 px-3 py-2 text-[11px] text-foreground/65">
                Selfie uploaded — model type / campaign look / shot are hidden.
                Your photo is the model; only jewelry placement &amp; format matter.
              </p>
            ) : (
              <>
                {appliedThemeId ? (
                  <p className="rounded-lg bg-primary/10 px-3 py-2 text-[11px] text-foreground/65">
                    Saved look is on for the next photo. After Generate it turns off and these options return to normal.
                  </p>
                ) : null}
                <Field
                  label="Model type"
                  value={subject}
                  onChange={dropLook(setSubject)}
                  options={SUBJECTS.map((k) => [k, SUBJECT_LABELS[k]] as const)}
                />
                <Field
                  label="Campaign look"
                  value={lookPreset}
                  onChange={dropLook(setLookPreset)}
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
                  onChange={dropLook(setShot)}
                  disabled={controlsLocked}
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
              onChange={dropLook(setFraming)}
              disabled={controlsLocked}
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
                    onClick={() => dropLook(setJewelryShadow)(id)}
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
                controlsLocked ? "pointer-events-none opacity-40" : undefined
              }
            >
              <div className="mb-3">
                <ClassicBackdropRow
                  active={
                    cutoutTransparent
                      ? "transparent"
                      : sceneBackdrop
                        ? "original"
                        : backdropColor.toUpperCase() === "#111111"
                          ? "black"
                          : backdropColor.toUpperCase() === "#FFFFFF"
                            ? "white"
                            : null
                  }
                  onSelect={(id) => {
                    releaseSavedLook();
                    if (id === "transparent") {
                      setCutoutTransparent(true);
                      setSceneBackdrop(false);
                      setBackdropColor("#FFFFFF");
                      setBackdropHexInput("#FFFFFF");
                      setJewelryShadow("off");
                      return;
                    }
                    setCutoutTransparent(false);
                    if (id === "original") {
                      setSceneBackdrop(true);
                      return;
                    }
                    setSceneBackdrop(false);
                    const hex = id === "black" ? "#111111" : "#FFFFFF";
                    setBackdropColor(hex);
                    setBackdropHexInput(hex);
                  }}
                  customSize={customSize}
                  onCustomSize={(size) => {
                    releaseSavedLook();
                    setCustomSize(size);
                    setFormat(nearestOutputFormat(size.width, size.height));
                  }}
                  onClearCustomSize={() => setCustomSize(null)}
                />
              </div>
              <ReflectionControls
                enabled={reflectionOn}
                opacity={reflectionOpacity}
                onEnabled={setReflectionOn}
                onOpacity={setReflectionOpacity}
              />
              <div className="mt-3">
              <BackdropColorField
                value={backdropColor}
                hexInput={backdropHexInput}
                onSelectPreset={(hex) => {
                  setCutoutTransparent(false);
                  setSceneBackdrop(false);
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
                  setCutoutTransparent(false);
                  setSceneBackdrop(false);
                  setBackdropColor(next);
                  setBackdropHexInput(next);
                }}
              />
              </div>
            </div>
          </>
        )}
        {tab !== "video" ? (
          <>
            <Field
              label="Output format"
              value={format}
              onChange={(next) => {
                releaseSavedLook();
                setCustomSize(null);
                setFormat(next);
              }}
              options={STUDIO_OUTPUT_FORMATS.map(
                (k) => [k, OUTPUT_FORMAT_LABELS[k]] as const,
              )}
            />
            {customSize && mode !== "background" ? (
              <p className="text-[11px] font-semibold text-primary">
                Custom size {customSize.width}×{customSize.height} is on. Change it next to White, Black, Transparent, and Original.
              </p>
            ) : (
              <p className="text-[11px] leading-relaxed text-foreground/55">
                Presets target Instagram and WhatsApp.
              </p>
            )}
            {!selfieFile &&
            (tab === "batch"
              ? festivalSelected(brand) || batchBackdropMode === "scene"
              : true) ? (
              <>
                <Field
                  label="Scene"
                  value={festivalSelected(brand) ? "festive_indoor" : scene}
                  onChange={dropLook(setScene)}
                  disabled={controlsLocked || festivalSelected(brand)}
                  options={SCENES.map((k) => [k, SCENE_LABELS[k]] as const)}
                />
                <Field
                  label="Mood"
                  value={festivalSelected(brand) ? "festive" : vibe}
                  onChange={dropLook(setVibe)}
                  disabled={controlsLocked || festivalSelected(brand)}
                  options={VIBES.map((k) => [k, VIBE_LABELS[k]] as const)}
                />
              </>
            ) : tab === "batch" &&
              batchBackdropMode !== "scene" &&
              !festivalSelected(brand) &&
              !appliedThemeId ? (
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
            brandingVideo ||
            savingTheme ||
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
          {brandingVideo
            ? videoPurpose === "reveal" && !videoShopName.trim() && !videoLogoSrc
              ? "Opening the box…"
              : "Adding your brand…"
            : loading || batchRunning
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
        {lookNotice ? (
          <p className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-foreground" role="status">
            {lookNotice}
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
                        className="block h-full w-full cursor-pointer"
                        aria-label={`View ${item.file.name}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.resultUrl}
                          alt={item.file.name}
                          className="h-full w-full object-contain"
                        />
                      </button>
                    ) : item.status === "failed" ? (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-red-50/80 p-2 text-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.previewUrl}
                          alt=""
                          className="mb-1 h-12 w-12 rounded object-cover opacity-50"
                        />
                        <p className="text-[10px] font-medium text-red-700">
                          Failed
                        </p>
                      </div>
                    ) : (
                      <GenerationPreviewPlaceholder
                        aspectClass="absolute inset-0 !mx-0 h-full w-full !rounded-none"
                        label={
                          item.status === "running"
                            ? "Generating…"
                            : item.status === "queued"
                              ? "Queued…"
                              : "Waiting…"
                        }
                        compact
                      />
                    )}
                  </div>
                  <div className="space-y-1 px-2 py-1.5">
                    <p className="truncate text-[10px] text-foreground/65">
                      {item.file.name}
                    </p>
                    {item.resultUrl ? (
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <DownloadImageButton
                          url={item.resultUrl}
                          generationId={item.generationId}
                          filename={downloadFilename(
                            item.resultUrl,
                            `jwelpixel-batch-${format}`,
                            "image/jpeg",
                          )}
                          className="shrink-0 text-[10px] font-semibold text-primary underline"
                          label="Download"
                        />
                      </div>
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
              <p className="text-center text-[11px] leading-relaxed text-foreground/55">
                {
                  batchItems.filter((i) => i.status === "done" && i.resultUrl)
                    .length
                }{" "}
                of {batchItems.length} ready
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
        ) : (loading || brandingVideo) && tab !== "batch" ? (
          <GenerationPreviewPlaceholder
            aspectClass={
              tab === "video"
                ? VIDEO_ASPECT_CLASS[videoAspect]
                : OUTPUT_FORMAT_ASPECT_CLASS[format]
            }
            label={
              brandingVideo
                ? videoPurpose === "reveal" && !videoShopName.trim() && !videoLogoSrc
                  ? "Opening the box…"
                  : "Adding your brand…"
                : tab === "video"
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
                className={`relative mx-auto w-full overflow-hidden rounded-2xl border border-primary/20 bg-secondary shadow-lg ${VIDEO_ASPECT_CLASS[videoAspect]}`}
              >
                <BrandedVideoStage
                  src={resultUrl}
                  name={videoShopName}
                  logoSrc={videoLogoSrc}
                  endCard={videoEndCard}
                  unbox={videoPurpose === "reveal"}
                  live={!videoBrandedFile}
                  onDuration={videoBrandedFile ? undefined : setVideoSeconds}
                />
              </div>
            ) : (
              <div
                className={`mx-auto w-full overflow-hidden rounded-2xl border border-primary/20 shadow-lg ${customSize ? "max-w-xl" : OUTPUT_FORMAT_ASPECT_CLASS[format]} ${
                  cutoutTransparent && finishedUrl
                    ? "bg-[length:18px_18px] bg-[linear-gradient(45deg,#ddd4ea_25%,transparent_25%),linear-gradient(-45deg,#ddd4ea_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#ddd4ea_75%),linear-gradient(-45deg,transparent_75%,#ddd4ea_75%)] bg-[position:0_0,0_9px,9px_-9px,-9px_0]"
                    : "bg-secondary"
                }`}
                style={
                  customSize
                    ? { aspectRatio: `${customSize.width} / ${customSize.height}` }
                    : undefined
                }
              >
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  className="block h-full w-full cursor-pointer"
                  aria-label="View full size"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={finishedUrl || resultUrl}
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
                  aria-label="Zoom in"
                  title="Zoom in"
                  className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-primary/25 bg-secondary text-xl font-light leading-none text-foreground hover:bg-accent/30"
                >
                  +
                </button>
              ) : null}
              {canThemes &&
              !(resultMime?.startsWith("video/") || tab === "video") &&
              resultUrl ? (
                <button
                  type="button"
                  disabled={savingTheme}
                  onClick={() => void saveCurrentResultAsTheme()}
                  className="rounded-xl border border-primary/40 bg-primary/15 px-4 py-2 text-sm font-semibold text-foreground hover:bg-primary/25 disabled:opacity-40"
                >
                  {savingTheme ? "Saving…" : "Save as look"}
                </button>
              ) : null}
              <DownloadImageButton
                url={finishedUrl || resultUrl}
                generationId={
                  finishedUrl || videoBrandedFile ? undefined : generationId ?? undefined
                }
                filename={
                  finishedUrl
                    ? `jwelpixel-background-${format}.png`
                    : downloadFilename(
                        resultUrl,
                        tab === "video" || resultMime?.startsWith("video/")
                          ? `jwelpixel-video-${videoPurpose}-${videoAspect}`
                          : mode === "background"
                            ? `jwelpixel-background-${format}`
                            : `jwelpixel-model-${format}`,
                        resultMime,
                      )
                }
                exportFormat={
                  customSize ||
                  finishedUrl ||
                  resultMime?.startsWith("video/") ||
                  tab === "video"
                    ? undefined
                    : format
                }
                exportPixels={
                  customSize &&
                  !(resultMime?.startsWith("video/") || tab === "video")
                    ? customSize
                    : undefined
                }
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-background hover:bg-accent hover:text-foreground"
                label={
                  resultMime?.startsWith("video/") || tab === "video"
                    ? "Download video"
                    : "Download image"
                }
              />
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
                url={finishedUrl || resultUrl}
                alt={mode === "background" ? "Background still" : "Model shot"}
                open={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
                filename={
                  finishedUrl
                    ? `jwelpixel-background-${format}.png`
                    : downloadFilename(
                        resultUrl,
                        mode === "background"
                          ? `jwelpixel-background-${format}`
                          : `jwelpixel-model-${format}`,
                        resultMime,
                      )
                }
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

function hexLooksLight(hex: string): boolean {
  const raw = hex.replace("#", "");
  if (raw.length !== 6) return false;
  const n = Number.parseInt(raw, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return r * 0.299 + g * 0.587 + b * 0.114 > 170;
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
          const isLight = hexLooksLight(preset.hex);
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
