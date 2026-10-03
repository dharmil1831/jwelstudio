"use client";

import { BrandMarketingPanel, type BrandFormState } from "@/components/brand-marketing-panel";
import { GenerationPreviewPlaceholder } from "@/components/generation-preview-placeholder";
import { MarketingPosterButton } from "@/components/marketing-poster-button";
import { DownloadImageButton } from "@/components/download-image-button";
import { ShareImageButton } from "@/components/share-image-button";
import { StudioResultVideo } from "@/components/studio-result-video";
import { VideoIdlePreview } from "@/components/video-idle-preview";
import { ThemesPanel, type ThemeListItem } from "@/components/themes-panel";
import {
  LOOK_PRESET_HINTS,
  LOOK_PRESET_IDS,
  LOOK_PRESET_LABELS,
  type LookPresetId,
} from "@/lib/look-presets";
import {
  BACKDROP_COLOR_PRESETS,
  FRAMINGS,
  FRAMING_LABELS,
  JEWELRY_SHADOW_HINTS,
  JEWELRY_SHADOW_LABELS,
  JEWELRY_SHADOWS,
  normalizeBackdropHex,
  OUTPUT_FORMAT_EXPORT_PX,
  OUTPUT_FORMAT_LABELS,
  PLACEMENTS,
  PLACEMENT_LABELS,
  SCENES,
  SCENE_LABELS,
  SHOTS,
  SHOT_LABELS,
  STUDIO_OUTPUT_FORMATS,
  SUBJECTS,
  SUBJECT_LABELS,
  VIBES,
  VIBE_LABELS,
  type Framing,
  type JewelryShadow,
  type OutputFormat,
  type Placement,
  type Scene,
  type Shot,
  type Subject,
  type Vibe,
} from "@/lib/style-options";
import type { ThemeStyleSnapshot } from "@/lib/themes";
import {
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
import { CREDIT_COST_PER_VIDEO } from "@/lib/video-presets";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

type Screen = "home" | "tools" | "edit" | "profile";
type Feed = "all" | "listing" | "editing" | "marketing";
type Tool =
  | "model"
  | "backdrop"
  | "video"
  | "prompt"
  | "brand"
  | "theme"
  | "selfie"
  | "shadow"
  | "resize";

/** Home browse cards — slightly broader than the edit Resize tool. */
const HOME_SIZES: OutputFormat[] = [
  "whatsapp",
  "catalog",
  "landscape",
  "whatsapp_status",
  "instagram_post",
  "instagram_story",
];

const FORMAT_IMAGE: Record<OutputFormat, string> = {
  whatsapp: "/mobile-looks/product-white.jpg",
  square: "/mobile-looks/product-white.jpg",
  catalog: "/mobile-looks/product-portrait.jpg",
  instagram_post: "/mobile-looks/product-portrait.jpg",
  landscape: "/mobile-looks/product-landscape.jpg",
  // Jewelry product placeholders — not model/girl photos
  whatsapp_status: "/mobile-looks/product-story.jpg",
  instagram_story: "/mobile-looks/product-story.jpg",
};

const TOOL_CARDS: {
  id: Tool;
  label: string;
  job: "model" | "background" | "video";
  image: string;
}[] = [
  { id: "model", label: "Model shot", job: "model", image: "/mobile-looks/look-bridal.jpg" },
  { id: "backdrop", label: "Background", job: "background", image: "/mobile-looks/product-white.jpg" },
  // Jewelry product placeholders for non-model tools (not look/model photos)
  { id: "video", label: "Video", job: "video", image: "/mobile-looks/product-story.jpg" },
  { id: "prompt", label: "Prompt", job: "model", image: "/mobile-looks/product-portrait.jpg" },
  { id: "brand", label: "Brand", job: "model", image: "/mobile-looks/product-gold.jpg" },
  { id: "theme", label: "Theme", job: "model", image: "/mobile-looks/product-navy.jpg" },
];

function profileLabel(email: string | null | undefined): string {
  if (!email?.trim()) return "Guest";
  const local = email.split("@")[0]?.trim() || "User";
  return local.length > 16 ? `${local.slice(0, 14)}…` : local;
}

function profileInitials(email: string | null | undefined): string {
  if (!email?.trim()) return "?";
  const local = email.split("@")[0] || "U";
  const parts = local.replace(/[._-]+/g, " ").split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  return local.slice(0, 2).toUpperCase();
}

const LOOK_IMAGE: Partial<Record<LookPresetId, string>> = {
  bridal_studio: "/mobile-looks/look-bridal.jpg",
  beauty_closeup: "/mobile-looks/look-beauty.jpg",
  glamour_studio: "/mobile-looks/look-glamour.jpg",
  outdoor_bridal: "/mobile-looks/look-outdoor.jpg",
  tuxedo_luxury: "/mobile-looks/look-tuxedo.jpg",
  couple_wedding: "/mobile-looks/look-couple.jpg",
  high_fashion: "/mobile-looks/look-glamour.jpg",
  gujarati_bridal: "/mobile-looks/look-bridal.jpg",
  ethnic_bridal: "/mobile-looks/look-bridal.jpg",
  macro_hand: "/mobile-looks/product-white.jpg",
  side_profile_beauty: "/mobile-looks/look-beauty.jpg",
  western_velvet_city: "/mobile-looks/look-glamour.jpg",
};

const COLOR_IMAGE: Record<string, string> = {
  "#FFFFFF": "/mobile-looks/product-white.jpg",
  "#F5F0E8": "/mobile-looks/product-portrait.jpg",
  "#0A0A0A": "/mobile-looks/product-black.jpg",
  "#2B2B2B": "/mobile-looks/product-black.jpg",
  "#4A0E0E": "/mobile-looks/product-black.jpg",
  "#0F1C3F": "/mobile-looks/product-navy.jpg",
  "#0F2A1F": "/mobile-looks/product-navy.jpg",
  "#F3E4E7": "/mobile-looks/product-blush.jpg",
  "#C9A227": "/mobile-looks/product-gold.jpg",
};

const TOOLS: { id: Tool; label: string }[] = [
  { id: "model", label: "Model" },
  { id: "backdrop", label: "Backdrop" },
  { id: "video", label: "Video" },
  { id: "prompt", label: "Prompt" },
  { id: "brand", label: "Brand" },
  { id: "theme", label: "Theme" },
  { id: "selfie", label: "Selfie" },
  { id: "shadow", label: "Shadow" },
  { id: "resize", label: "Resize" },
];

export type StudioMobileHomeProps = {
  credits: number | null;
  userEmail?: string | null;
  previewUrl: string | null;
  fileName: string | null;
  resultUrl: string | null;
  resultMime: string | null;
  generationId: string | null;
  loading: boolean;
  error: string | null;
  canCustomPrompt: boolean;
  canBrand: boolean;
  canThemes: boolean;
  canSelfie: boolean;
  canVideo: boolean;
  generationReady: boolean | null;
  customPrompt: string;
  onCustomPrompt: (value: string) => void;
  brand: BrandFormState;
  onBrand: (value: BrandFormState) => void;
  subject: Subject;
  onSubject: (value: Subject) => void;
  lookPreset: LookPresetId;
  onLook: (value: LookPresetId) => void;
  shot: Shot;
  onShot: (value: Shot) => void;
  placement: Placement;
  onPlacement: (value: Placement) => void;
  scene: Scene;
  onScene: (value: Scene) => void;
  vibe: Vibe;
  onVibe: (value: Vibe) => void;
  framing: Framing;
  onFraming: (value: Framing) => void;
  format: OutputFormat;
  onFormat: (value: OutputFormat) => void;
  backdropColor: string;
  onBackdrop: (hex: string) => void;
  backdropHexInput: string;
  onBackdropHexInput: (hex: string) => void;
  onApplyBackdropHex: () => void;
  jewelryShadow: JewelryShadow;
  onShadow: (value: JewelryShadow) => void;
  videoPreset: VideoPresetId;
  onVideoPreset: (value: VideoPresetId) => void;
  videoAspect: VideoAspectId;
  onVideoAspect: (value: VideoAspectId) => void;
  videoPurpose: VideoPurposeId;
  onVideoPurpose: (value: VideoPurposeId) => void;
  videoCast: VideoCastId;
  onVideoCast: (value: VideoCastId) => void;
  selfiePreviewUrl: string | null;
  onPickJewelry: (file: File | null) => void;
  onPickSelfie: (file: File | null) => void;
  onAddBatch: (files: FileList | null) => void;
  onSelectJob: (job: "model" | "background" | "video") => void;
  onGenerate: () => void;
  themeSnapshot: () => ThemeStyleSnapshot;
  appliedThemeId: string | null;
  onApplyTheme: (theme: ThemeListItem, style: ThemeStyleSnapshot) => void;
  onClearTheme: () => void;
  onSaveTheme: () => void;
};

function Chip({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
        active
          ? "bg-primary text-white"
          : "bg-white text-foreground ring-1 ring-primary/20"
      }`}
    >
      {children}
    </button>
  );
}

export function StudioMobileHome(props: StudioMobileHomeProps) {
  const [screen, setScreen] = useState<Screen>("home");
  const [feed, setFeed] = useState<Feed>("all");
  const [tool, setTool] = useState<Tool>("model");
  const previewSlotRef = useRef<HTMLElement | null>(null);
  const show = (id: Feed) => feed === "all" || feed === id;
  const isVideoResult =
    Boolean(props.resultMime?.startsWith("video/")) ||
    Boolean(props.resultUrl && /\.(mp4|webm)(\?|$)/i.test(props.resultUrl));
  // Never fall back to the jewelry upload thumbnail for a finished video.
  const piece = isVideoResult ? props.resultUrl : props.resultUrl || props.previewUrl;

  useEffect(() => {
    if (!props.loading || screen !== "edit") return;
    previewSlotRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [props.loading, screen]);

  function openSize(format: OutputFormat) {
    props.onFormat(format);
    props.onSelectJob("model");
    setTool("resize");
    setScreen("edit");
  }

  function openColor(hex: string) {
    props.onBackdrop(hex);
    props.onSelectJob("background");
    setTool("backdrop");
    setScreen("edit");
  }

  function openLook(id: LookPresetId) {
    props.onLook(id);
    props.onSelectJob("model");
    setTool("model");
    setScreen("edit");
  }

  function openTool(next: Tool, job?: "model" | "background" | "video") {
    if (job) props.onSelectJob(job);
    setTool(next);
    setScreen("edit");
  }

  const filters: { id: Feed; label: string }[] = [
    { id: "all", label: "All" },
    { id: "listing", label: "Listing" },
    { id: "editing", label: "Editing" },
    { id: "marketing", label: "Marketing" },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col bg-background font-sans text-foreground">
      <header className="flex items-center gap-3 px-4 pb-2 pt-3">
        <img
          src="/brand/jwelpixel-logo-v4.png"
          alt="Jwelpixel"
          className="h-12 w-auto max-w-[min(52vw,200px)] object-contain object-left"
        />
        <span className="flex-1" />
        <button
          type="button"
          onClick={() => setScreen("profile")}
          className={`flex max-w-[46%] items-center gap-2 rounded-full py-1 pl-3 pr-1 ${
            screen === "profile"
              ? "bg-primary/15 ring-2 ring-primary/40"
              : "bg-white ring-1 ring-primary/15"
          }`}
          aria-label="Profile"
        >
          <span className="min-w-0 truncate text-left text-xs font-semibold text-foreground">
            {profileLabel(props.userEmail)}
          </span>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-bold text-white">
            {profileInitials(props.userEmail)}
          </span>
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-3">
        {screen === "home" ? (
          <>
            <div className="flex gap-2 overflow-x-auto pb-3">
              {filters.map((item) => {
                const active = feed === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFeed(item.id)}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold ${
                      active
                        ? "bg-primary text-white"
                        : "bg-white text-foreground ring-1 ring-primary/20"
                    }`}
                  >
                    <FeedIcon id={item.id} />
                    {item.label}
                  </button>
                );
              })}
            </div>
            {show("listing") ? (
              <>
                <Section title="Sizes">
                  {HOME_SIZES.slice(0, 3).map((id) => (
                    <SizeCard key={id} id={id} src={FORMAT_IMAGE[id]} onClick={() => openSize(id)} />
                  ))}
                </Section>
                <Section title="Listing essentials">
                  {(["whatsapp", "instagram_post", "catalog", "landscape"] as const).map((id) => (
                    <SizeCard key={id} id={id} src={FORMAT_IMAGE[id]} onClick={() => openSize(id)} />
                  ))}
                </Section>
              </>
            ) : null}
            {show("marketing") && feed !== "marketing" ? (
              <Section title="Social essentials">
                {(["whatsapp_status", "instagram_story", "whatsapp"] as const).map((id) => (
                  <SizeCard key={`s-${id}`} id={id} src={FORMAT_IMAGE[id]} onClick={() => openSize(id)} />
                ))}
              </Section>
            ) : null}
            {feed === "marketing" ? (
              <div className="mb-4">
                <h3 className="mb-2 font-[family-name:var(--font-display)] text-xl text-foreground">
                  Brand and festival
                </h3>
                <div className="mt-3">
                  <BrandMarketingPanel
                    value={props.brand}
                    onChange={props.onBrand}
                    locked={!props.canBrand}
                    initialOpen
                  />
                </div>
                <Section title="Social essentials">
                  {(["whatsapp_status", "instagram_story", "whatsapp"] as const).map((id) => (
                    <SizeCard key={`m-${id}`} id={id} src={FORMAT_IMAGE[id]} onClick={() => openSize(id)} />
                  ))}
                </Section>
              </div>
            ) : null}
            {show("editing") || show("listing") ? (
              <Section title="Classic backdrops">
                {BACKDROP_COLOR_PRESETS.map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => openColor(color.hex)}
                    className="w-32 shrink-0 text-left"
                  >
                    <span
                      className="mb-2 grid aspect-square place-items-center overflow-hidden rounded-2xl border border-primary/15"
                      style={{ background: color.hex }}
                    >
                        <img
                          src={COLOR_IMAGE[color.hex.toUpperCase()] ?? "/mobile-looks/product-white.jpg"}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                    </span>
                    <span className="text-xs font-bold">{color.label}</span>
                  </button>
                ))}
              </Section>
            ) : null}
            {show("marketing") || show("editing") ? (
              <Section title="Model looks">
                {LOOK_PRESET_IDS.filter((id) => id !== "auto").map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => openLook(id)}
                    className="w-36 shrink-0 text-left"
                  >
                    <span className="mb-2 block aspect-[4/5] overflow-hidden rounded-2xl bg-white ring-1 ring-primary/15">
                      <img
                        src={LOOK_IMAGE[id] ?? "/mobile-looks/look-bridal.jpg"}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </span>
                    <span className="text-xs font-bold">{LOOK_PRESET_LABELS[id]}</span>
                  </button>
                ))}
              </Section>
            ) : null}
          </>
        ) : null}

        {screen === "tools" ? (
          <div className="grid grid-cols-2 gap-3">
            {TOOL_CARDS.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => openTool(card.id, card.job)}
                className="overflow-hidden rounded-2xl border border-primary/15 bg-white text-left shadow-sm"
              >
                <span className="relative block aspect-[5/4] w-full overflow-hidden bg-secondary/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={card.image}
                    alt=""
                    className="h-full w-full object-cover object-center"
                  />
                  <span className="absolute left-2 top-2 grid h-8 w-8 place-items-center rounded-xl bg-white/95 text-primary shadow-sm">
                    <ToolGlyph id={card.id} />
                  </span>
                </span>
                <span className="block px-3 py-2.5 text-sm font-bold text-foreground">
                  {card.label}
                </span>
              </button>
            ))}
          </div>
        ) : null}

        {screen === "edit" ? (
          <div className="flex flex-col gap-3">
            {(() => {
              const showVideoPlayer = Boolean(
                !props.loading && isVideoResult && props.resultUrl,
              );
              const showVideoIdle =
                !props.loading && !showVideoPlayer && tool === "video";

              // Generating / video player must not sit inside a file <label>.
              if (props.loading) {
                return (
                  <div
                    ref={(node) => {
                      previewSlotRef.current = node;
                    }}
                    className="block overflow-hidden rounded-2xl border border-primary/15 bg-white"
                  >
                    <span className="relative mx-auto block aspect-square w-full max-w-sm bg-secondary/35">
                      <GenerationPreviewPlaceholder
                        aspectClass="absolute inset-0 !mx-0 h-full w-full !rounded-none"
                        label={
                          tool === "video"
                            ? "Creating your jewelry video…"
                            : tool === "backdrop" || tool === "shadow"
                              ? "Creating your background still…"
                              : "Creating your model shot…"
                        }
                      />
                    </span>
                  </div>
                );
              }

              if (showVideoPlayer && props.resultUrl) {
                return (
                  <div
                    ref={(node) => {
                      previewSlotRef.current = node;
                    }}
                    className="block overflow-hidden rounded-2xl border border-primary/15 bg-white"
                  >
                    <span className="relative mx-auto block aspect-square w-full max-w-sm bg-[#1a1224]">
                      <StudioResultVideo
                        src={props.resultUrl}
                        fillClassName="absolute inset-0"
                        className="h-full w-full object-contain"
                        label="Opening your video…"
                      />
                    </span>
                  </div>
                );
              }

              if (showVideoIdle) {
                return (
                  <div
                    ref={(node) => {
                      previewSlotRef.current = node;
                    }}
                    className="block overflow-hidden rounded-2xl border border-primary/15 bg-white"
                  >
                    <span className="relative mx-auto block aspect-square w-full max-w-sm overflow-hidden">
                      <VideoIdlePreview
                        previewUrl={props.previewUrl}
                        onUpload={props.onPickJewelry}
                      />
                    </span>
                  </div>
                );
              }

              return (
                <label
                  ref={(node) => {
                    previewSlotRef.current = node;
                  }}
                  className="block cursor-pointer overflow-hidden rounded-2xl border border-primary/15 bg-white"
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => props.onPickJewelry(e.target.files?.[0] ?? null)}
                  />
                  <span className="relative mx-auto block aspect-square w-full max-w-sm bg-secondary/35">
                    {piece ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={piece}
                        alt=""
                        className="absolute inset-0 h-full w-full object-contain p-2"
                      />
                    ) : (
                      <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/mobile-looks/product-white.jpg"
                          alt=""
                          className="h-28 w-28 rounded-xl object-contain opacity-70"
                        />
                        <span className="text-sm font-semibold text-foreground">
                          Tap to upload jewelry
                        </span>
                        <span className="text-[11px] text-foreground/55">
                          Full piece stays visible — nothing gets cropped
                        </span>
                      </span>
                    )}
                  </span>
                </label>
              );
            })()}
            {props.resultUrl && isVideoResult ? (
              <DownloadImageButton
                url={props.resultUrl}
                filename="jwelpixel-video.mp4"
                label="Download video"
                className="rounded-xl bg-white py-2 text-sm font-semibold ring-1 ring-primary/20"
              />
            ) : null}
            {props.resultUrl && !isVideoResult ? (
              <div className="grid grid-cols-2 gap-2">
                <DownloadImageButton url={props.resultUrl} exportFormat={props.format} className="rounded-xl bg-white py-2 text-sm font-semibold ring-1 ring-primary/20" />
                <ShareImageButton generationId={props.generationId} imageUrl={props.resultUrl} className="rounded-xl bg-white py-2 text-sm font-semibold ring-1 ring-primary/20" />
                <button type="button" onClick={props.onSaveTheme} className="rounded-xl bg-white py-2 text-sm font-semibold ring-1 ring-primary/20">
                  Save theme
                </button>
                <MarketingPosterButton
                  imageUrl={props.resultUrl}
                  brand={props.brand}
                  className="rounded-xl bg-white py-2 text-sm font-semibold ring-1 ring-primary/20"
                />
              </div>
            ) : null}
            <div className="flex gap-2 overflow-x-auto">
              {TOOLS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setTool(item.id);
                    if (item.id === "video") props.onSelectJob("video");
                    else if (item.id === "backdrop" || item.id === "shadow") props.onSelectJob("background");
                    else if (item.id === "model" || item.id === "resize" || item.id === "selfie") props.onSelectJob("model");
                  }}
                  className={`w-[4.75rem] shrink-0 rounded-2xl px-2 py-3 text-xs font-bold ${
                    tool === item.id ? "bg-primary text-white" : "bg-white ring-1 ring-primary/15"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="rounded-2xl border border-primary/15 bg-white p-3">
              {tool === "model" ? (
                <div className="flex flex-col gap-3">
                  {props.selfiePreviewUrl ? (
                    <p className="rounded-xl bg-primary/10 px-3 py-2 text-[11px] text-foreground/70">
                      Selfie uploaded — your photo is the model. Placement, scene, mood, and format still apply.
                    </p>
                  ) : props.appliedThemeId ? (
                    <p className="rounded-xl bg-primary/10 px-3 py-2 text-[11px] text-foreground/70">
                      Theme applied — model / look / scene come from the saved look. Upload new jewelry and Generate.
                    </p>
                  ) : (
                    <>
                      <Chips
                        label="Model type"
                        value={props.subject}
                        options={SUBJECTS}
                        labels={SUBJECT_LABELS}
                        onChange={props.onSubject}
                      />
                      <Chips
                        label="Campaign look"
                        value={props.lookPreset}
                        options={LOOK_PRESET_IDS}
                        labels={LOOK_PRESET_LABELS}
                        onChange={props.onLook}
                      />
                      <p className="text-[11px] text-foreground/55">
                        {LOOK_PRESET_HINTS[props.lookPreset]}
                      </p>
                      <Chips
                        label="Shot type"
                        value={props.shot}
                        options={SHOTS}
                        labels={SHOT_LABELS}
                        onChange={props.onShot}
                        disabled={Boolean(props.customPrompt.trim())}
                      />
                    </>
                  )}
                  <Chips
                    label="Where to show jewelry"
                    value={props.placement}
                    options={PLACEMENTS}
                    labels={PLACEMENT_LABELS}
                    onChange={props.onPlacement}
                    disabled={Boolean(props.customPrompt.trim())}
                  />
                  <Chips
                    label="Scene"
                    value={props.scene}
                    options={SCENES}
                    labels={SCENE_LABELS}
                    onChange={props.onScene}
                    disabled={Boolean(props.customPrompt.trim())}
                  />
                  <Chips
                    label="Mood"
                    value={props.vibe}
                    options={VIBES}
                    labels={VIBE_LABELS}
                    onChange={props.onVibe}
                    disabled={Boolean(props.customPrompt.trim())}
                  />
                  <Chips
                    label="Output format"
                    value={props.format}
                    options={STUDIO_OUTPUT_FORMATS}
                    labels={OUTPUT_FORMAT_LABELS}
                    onChange={props.onFormat}
                  />
                  <p className="text-xs font-bold uppercase tracking-wide text-primary">Batch photos</p>
                  <p className="text-xs text-foreground/60">Every extra photo uses this model look.</p>
                  <label className="block rounded-xl border border-dashed border-primary px-3 py-3 text-center text-sm">
                    Add photos
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="sr-only"
                      onChange={(e) => {
                        props.onSelectJob("model");
                        props.onAddBatch(e.target.files);
                      }}
                    />
                  </label>
                </div>
              ) : null}
              {tool === "backdrop" ? (
                <div className="flex flex-col gap-3">
                  <Chips
                    label="Framing"
                    value={props.framing}
                    options={FRAMINGS}
                    labels={FRAMING_LABELS}
                    onChange={props.onFraming}
                    disabled={Boolean(props.customPrompt.trim())}
                  />
                  <Chips
                    label="Jewelry shadow"
                    value={props.jewelryShadow}
                    options={JEWELRY_SHADOWS}
                    labels={JEWELRY_SHADOW_LABELS}
                    onChange={props.onShadow}
                  />
                  <p className="text-[11px] text-foreground/55">
                    {JEWELRY_SHADOW_HINTS[props.jewelryShadow]}
                  </p>
                  <div className={props.customPrompt.trim() ? "pointer-events-none opacity-40" : undefined}>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-primary">Background color</p>
                    <div className="mb-3 flex flex-wrap gap-2">
                      {BACKDROP_COLOR_PRESETS.map((color) => (
                        <button
                          key={color.id}
                          type="button"
                          title={color.label}
                          aria-label={color.label}
                          onClick={() => {
                            props.onSelectJob("background");
                            props.onBackdrop(color.hex);
                          }}
                          className={`h-8 w-8 rounded-full ring-2 ring-offset-2 ${
                            props.backdropColor.toUpperCase() === color.hex.toUpperCase()
                              ? "ring-primary"
                              : "ring-transparent"
                          }`}
                          style={{ background: color.hex }}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={props.backdropHexInput}
                        onChange={(e) => props.onBackdropHexInput(e.target.value)}
                        placeholder="#FFFFFF"
                        className="min-w-0 flex-1 rounded-xl bg-background px-3 py-2 text-sm outline-none ring-1 ring-primary/20"
                        aria-label="Custom backdrop hex color"
                      />
                      <span
                        className="h-9 w-9 shrink-0 rounded-lg ring-1 ring-primary/20"
                        style={{
                          backgroundColor:
                            normalizeBackdropHex(props.backdropHexInput) ?? "#CCCCCC",
                        }}
                      />
                      <button
                        type="button"
                        onClick={props.onApplyBackdropHex}
                        className="rounded-xl bg-primary px-3 py-2 text-xs font-bold text-white"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                  <Chips
                    label="Scene"
                    value={props.scene}
                    options={SCENES}
                    labels={SCENE_LABELS}
                    onChange={props.onScene}
                    disabled={Boolean(props.customPrompt.trim())}
                  />
                  <Chips
                    label="Mood"
                    value={props.vibe}
                    options={VIBES}
                    labels={VIBE_LABELS}
                    onChange={props.onVibe}
                    disabled={Boolean(props.customPrompt.trim())}
                  />
                  <Chips
                    label="Output format"
                    value={props.format}
                    options={STUDIO_OUTPUT_FORMATS}
                    labels={OUTPUT_FORMAT_LABELS}
                    onChange={props.onFormat}
                  />
                  <p className="text-xs font-bold uppercase tracking-wide text-primary">Batch on this color</p>
                  <p className="text-xs text-foreground/60">Extra photos use this same backdrop.</p>
                  <label className="block rounded-xl border border-dashed border-primary px-3 py-3 text-center text-sm">
                    Add photos
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="sr-only"
                      onChange={(e) => {
                        props.onSelectJob("background");
                        props.onAddBatch(e.target.files);
                      }}
                    />
                  </label>
                </div>
              ) : null}
              {tool === "video" ? (
                <div className="flex flex-col gap-3">
                  {!props.canVideo ? (
                    <p className="text-xs text-foreground/70">
                      Video unlocks on Diamond.{" "}
                      <Link href="/pricing" className="font-semibold text-primary underline">
                        See Pricing
                      </Link>
                      .
                    </p>
                  ) : null}
                  <Chips
                    label="Ratio"
                    value={props.videoAspect}
                    options={VIDEO_ASPECT_IDS}
                    labels={VIDEO_ASPECT_LABELS}
                    onChange={props.onVideoAspect}
                  />
                  <p className="text-[11px] text-foreground/55">
                    {VIDEO_ASPECT_HINTS[props.videoAspect]}
                  </p>
                  <Chips
                    label="Show jewelry as"
                    value={props.videoCast}
                    options={VIDEO_CAST_IDS}
                    labels={VIDEO_CAST_LABELS}
                    onChange={props.onVideoCast}
                  />
                  <p className="text-[11px] text-foreground/55">
                    {VIDEO_CAST_HINTS[props.videoCast]}
                  </p>
                  {props.videoCast === "model" ? (
                    <>
                      <Chips
                        label="Model type"
                        value={props.subject}
                        options={SUBJECTS}
                        labels={SUBJECT_LABELS}
                        onChange={props.onSubject}
                      />
                      <Chips
                        label="Campaign look"
                        value={props.lookPreset}
                        options={LOOK_PRESET_IDS}
                        labels={LOOK_PRESET_LABELS}
                        onChange={props.onLook}
                      />
                    </>
                  ) : null}
                  <Chips
                    label="Video type"
                    value={props.videoPurpose}
                    options={VIDEO_PURPOSE_IDS}
                    labels={VIDEO_PURPOSE_LABELS}
                    onChange={props.onVideoPurpose}
                  />
                  <Chips
                    label="Camera / motion"
                    value={props.videoPreset}
                    options={VIDEO_PRESET_IDS}
                    labels={VIDEO_PRESET_LABELS}
                    onChange={props.onVideoPreset}
                  />
                  <p className="text-[11px] text-foreground/50">
                    Costs {CREDIT_COST_PER_VIDEO} credits · may take a few minutes
                  </p>
                </div>
              ) : null}
              {tool === "prompt" ? (
                props.canCustomPrompt ? (
                  <textarea
                    value={props.customPrompt}
                    onChange={(e) => props.onCustomPrompt(e.target.value)}
                    placeholder="Soft temple light. Keep every stone exact."
                    className="min-h-24 w-full rounded-xl bg-background px-3 py-2 text-sm outline-none ring-1 ring-primary/20"
                  />
                ) : (
                  <p className="text-xs text-foreground/70">Custom prompts unlock on higher plans.</p>
                )
              ) : null}
              {tool === "brand" ? (
                <BrandMarketingPanel value={props.brand} onChange={props.onBrand} locked={!props.canBrand} initialOpen />
              ) : null}
              {tool === "theme" ? (
                <ThemesPanel
                  locked={!props.canThemes}
                  enabled={props.canThemes}
                  currentStyle={props.themeSnapshot()}
                  previewUrl={props.resultUrl && !props.resultMime?.startsWith("video/") ? props.resultUrl : null}
                  appliedThemeId={props.appliedThemeId}
                  onApply={props.onApplyTheme}
                  onClear={props.onClearTheme}
                />
              ) : null}
              {tool === "selfie" ? (
                props.canSelfie ? (
                  <label className="block rounded-xl border border-dashed border-primary p-3 text-sm">
                    {props.selfiePreviewUrl ? "Selfie added. Tap to replace." : "Optional selfie for try-on"}
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => props.onPickSelfie(e.target.files?.[0] ?? null)}
                    />
                  </label>
                ) : (
                  <p className="text-xs text-foreground/70">Selfie try-on unlocks on Platinum and above.</p>
                )
              ) : null}
              {tool === "shadow" ? (
                <div className="flex flex-col gap-2">
                  <Chips
                    label="Jewelry shadow"
                    value={props.jewelryShadow}
                    options={JEWELRY_SHADOWS}
                    labels={JEWELRY_SHADOW_LABELS}
                    onChange={props.onShadow}
                  />
                  <p className="text-[11px] text-foreground/55">
                    {JEWELRY_SHADOW_HINTS[props.jewelryShadow]}
                  </p>
                </div>
              ) : null}
              {tool === "resize" ? (
                <div className="flex flex-col gap-2">
                  <Chips
                    label="Output format"
                    value={props.format}
                    options={STUDIO_OUTPUT_FORMATS}
                    labels={OUTPUT_FORMAT_LABELS}
                    onChange={props.onFormat}
                  />
                  <p className="text-[11px] leading-relaxed text-foreground/55">
                    Targets Instagram / WhatsApp sizes. Download exports exact pixels.
                  </p>
                </div>
              ) : null}
            </div>
            {props.error ? <p className="text-sm text-red-600">{props.error}</p> : null}
            {!props.previewUrl && !props.loading ? (
              <p className="text-center text-xs font-medium text-foreground/60">
                Upload jewelry first — Generate stays locked so credits are not spent.
              </p>
            ) : null}
            <button
              type="button"
              disabled={
                props.loading ||
                props.generationReady === false ||
                !props.previewUrl
              }
              onClick={props.onGenerate}
              className="rounded-full bg-primary py-3 text-sm font-bold text-white disabled:opacity-40"
            >
              {props.loading
                ? tool === "video"
                  ? "Generating video…"
                  : "Generating…"
                : !props.previewUrl
                  ? "Upload jewelry to generate"
                  : tool === "video"
                    ? `Generate video · ${CREDIT_COST_PER_VIDEO} credits`
                    : "Generate · 1 credit"}
            </button>
          </div>
        ) : null}

        {screen === "profile" ? (
          <div className="rounded-2xl border border-primary/15 bg-white p-5">
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-normal">Your profile</h2>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {profileLabel(props.userEmail)}
            </p>
            {props.userEmail ? (
              <p className="mt-0.5 truncate text-xs text-foreground/55">{props.userEmail}</p>
            ) : null}
            <p className="mt-2 text-sm text-foreground/70">
              {props.credits ?? "—"} credits left
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Link href="/profile" className="rounded-xl bg-primary py-3 text-center text-sm font-semibold text-white">
                Profile
              </Link>
              <Link href="/gallery" className="rounded-xl border border-primary/25 py-3 text-center text-sm font-semibold">
                Gallery
              </Link>
              <Link href="/pricing" className="rounded-xl border border-primary/25 py-3 text-center text-sm font-semibold">
                Pricing
              </Link>
            </div>
          </div>
        ) : null}
      </div>

      <nav className="grid grid-cols-4 gap-1 border-t border-primary/15 bg-white px-1 py-1.5 pb-[max(0.4rem,env(safe-area-inset-bottom))]">
        {(
          [
            ["home", "Home"],
            ["tools", "Tools"],
            ["edit", "Edit"],
            ["profile", "Profile"],
          ] as const
        ).map(([id, label]) => {
          const active = screen === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setScreen(id)}
              className={`flex flex-col items-center gap-0.5 rounded-2xl px-1 py-2 text-[10px] font-bold ${
                active ? "bg-primary text-white" : "text-foreground/55"
              }`}
            >
              <NavIcon id={id} active={active} />
              {label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function FeedIcon({ id }: { id: Feed }) {
  const stroke = {
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (id === "all") {
    return (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" aria-hidden>
        <rect fill="currentColor" x="3.5" y="3.5" width="7" height="7" rx="1.5" />
        <rect fill="currentColor" x="13.5" y="3.5" width="7" height="7" rx="1.5" />
        <rect fill="currentColor" x="3.5" y="13.5" width="7" height="7" rx="1.5" />
        <rect fill="currentColor" x="13.5" y="13.5" width="7" height="7" rx="1.5" />
      </svg>
    );
  }
  if (id === "listing") {
    return (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" aria-hidden>
        <rect {...stroke} x="4" y="3" width="16" height="18" rx="2" />
        <path {...stroke} d="M8 8h8M8 12h8M8 16h5" />
      </svg>
    );
  }
  if (id === "editing") {
    return (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" aria-hidden>
        <path {...stroke} d="M12 20h9" />
        <path {...stroke} d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" aria-hidden>
      <path
        fill="currentColor"
        d="M12 2.8 14.6 9l6.9.6-5.2 4.4 1.6 6.7L12 17.2 6.1 20.7 7.7 14 2.5 9.6 9.4 9z"
      />
    </svg>
  );
}

function ToolGlyph({ id }: { id: Tool }) {
  const common = {
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (id === "model") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
        <circle {...common} cx="12" cy="8" r="3" />
        <path {...common} d="M6 19c1.2-3 3.2-4.5 6-4.5s4.8 1.5 6 4.5" />
      </svg>
    );
  }
  if (id === "backdrop") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
        <rect {...common} x="3" y="5" width="18" height="14" rx="2" />
        <circle {...common} cx="9" cy="11" r="2" />
        <path {...common} d="m21 16-5-5-7 7" />
      </svg>
    );
  }
  if (id === "video") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
        <rect {...common} x="3" y="6" width="13" height="12" rx="2" />
        <path {...common} d="m16 10 5-3v10l-5-3v-4z" />
      </svg>
    );
  }
  if (id === "prompt") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
        <path {...common} d="M5 5h14v10H9l-4 3V5z" />
        <path {...common} d="M9 10h6M9 13h4" />
      </svg>
    );
  }
  if (id === "brand") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
        <path {...common} d="M12 3 14.2 8.2 20 9l-4.2 3.8L17 19l-5-2.8L7 19l1.2-6.2L4 9l5.8-.8z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path {...common} d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
      <circle {...common} cx="12" cy="12" r="3.5" />
    </svg>
  );
}

function NavIcon({ id, active }: { id: Screen; active: boolean }) {
  const stroke = active ? "currentColor" : "currentColor";
  const common = {
    fill: "none" as const,
    stroke,
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (id === "home") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <path {...common} d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z" />
      </svg>
    );
  }
  if (id === "tools") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <rect {...common} x="3.5" y="3.5" width="7" height="7" rx="1.5" />
        <rect {...common} x="13.5" y="3.5" width="7" height="7" rx="1.5" />
        <rect {...common} x="3.5" y="13.5" width="7" height="7" rx="1.5" />
        <rect {...common} x="13.5" y="13.5" width="7" height="7" rx="1.5" />
      </svg>
    );
  }
  if (id === "edit") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <path {...common} d="M4 20h4l11-11-4-4L4 16v4z" />
        <path {...common} d="m13 7 4 4" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <circle {...common} cx="12" cy="8" r="3.5" />
      <path {...common} d="M5 19.5c1.5-3.5 4-5 7-5s5.5 1.5 7 5" />
    </svg>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-4">
      <h3 className="mb-2 font-[family-name:var(--font-display)] text-xl font-medium">{title}</h3>
      <div className="flex gap-3 overflow-x-auto pb-1">{children}</div>
    </section>
  );
}

function PieceArt({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 160 200" className={className} aria-hidden>
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f7f3fc" />
          <stop offset="0.55" stopColor="#d5c4f3" />
          <stop offset="1" stopColor="#7c5cbf" />
        </linearGradient>
      </defs>
      <rect width="160" height="200" fill={`url(#${uid})`} />
      <ellipse cx="80" cy="62" rx="28" ry="34" fill="#3d2a55" />
      <ellipse cx="80" cy="66" rx="21" ry="26" fill="#f3d7c3" />
      <path d="M46 200c4-58 20-82 34-82s30 24 34 82" fill="#6d4eaa" />
      <path d="M58 104q22 32 44 0" fill="none" stroke="#c6a15b" strokeWidth="3" />
      <path d="M72 128 80 148 88 128z" fill="#c6a15b" />
      <circle cx="80" cy="150" r="5" fill="#7c5cbf" stroke="#c6a15b" strokeWidth="2" />
    </svg>
  );
}

function PlatformIcon({ id }: { id: OutputFormat }) {
  const uid = useId().replace(/:/g, "");
  if (id === "whatsapp" || id === "whatsapp_status") {
    return (
      <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden>
        <path
          fill="#25D366"
          d="M12 2.2A9.7 9.7 0 0 0 3.6 16.7L2.4 21.6l5-1.2A9.8 9.8 0 1 0 12 2.2z"
        />
        <path
          fill="#fff"
          d="M16.7 14.3c-.2-.1-1.3-.6-1.5-.7-.2-.1-.4-.1-.5.1l-.6.7c-.1.2-.3.2-.5.1a7.3 7.3 0 0 1-2.1-1.3 8 8 0 0 1-1.5-1.9c-.1-.2 0-.4.1-.5l.4-.5c.1-.1.1-.3.2-.4l-.1-.5c-.1-.3-.5-1.3-.7-1.7-.2-.4-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.3c.1.2 1.6 2.5 3.9 3.4 1.4.6 2 .6 2.7.5.4-.1 1.3-.5 1.5-1 .2-.5.2-.9.1-1 0-.1-.2-.1-.4-.2z"
        />
      </svg>
    );
  }
  if (id === "instagram_post" || id === "instagram_story") {
    return (
      <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden>
        <defs>
          <linearGradient id={uid} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#f9ce34" />
            <stop offset="0.5" stopColor="#ee2a7b" />
            <stop offset="1" stopColor="#6228d7" />
          </linearGradient>
        </defs>
        <rect x="3" y="3" width="18" height="18" rx="5" fill={`url(#${uid})`} />
        <circle cx="12" cy="12" r="4" fill="none" stroke="#fff" strokeWidth="1.6" />
        <circle cx="17" cy="7" r="1" fill="#fff" />
      </svg>
    );
  }
  return null;
}

function SizeCard({
  id,
  src,
  onClick,
}: {
  id: OutputFormat;
  src: string | null;
  onClick: () => void;
}) {
  const px = OUTPUT_FORMAT_EXPORT_PX[id];
  const tall = px.height > px.width;
  const social =
    id === "whatsapp" ||
    id === "whatsapp_status" ||
    id === "instagram_post" ||
    id === "instagram_story";
  return (
    <button type="button" onClick={onClick} className="w-32 shrink-0 text-left">
      <span
        className={`relative mb-2 block overflow-hidden rounded-2xl border border-primary/15 bg-white ${
          tall ? "aspect-[9/16]" : px.width > px.height ? "aspect-video" : "aspect-square"
        }`}
      >
        <span className="absolute inset-0 bg-secondary/30">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt=""
              className="h-full w-full object-contain p-1.5"
            />
          ) : (
            <PieceArt className="h-full w-full" />
          )}
        </span>
        {social ? (
          <i className="absolute bottom-2 left-2 grid h-8 w-8 place-items-center rounded-lg bg-white shadow-sm">
            <PlatformIcon id={id} />
          </i>
        ) : null}
      </span>
      <span className="flex items-center gap-1 text-xs font-bold">
        {social ? <PlatformIcon id={id} /> : null}
        {OUTPUT_FORMAT_LABELS[id].split("(")[0]}
      </span>
      <span className="block text-[11px] text-foreground/55">
        {px.width}×{px.height}
      </span>
    </button>
  );
}

function Chips<T extends string>({
  label,
  value,
  options,
  labels,
  onChange,
  disabled,
}: {
  label: string;
  value: T;
  options: readonly T[];
  labels: Record<T, string>;
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <div className={disabled ? "pointer-events-none opacity-40" : undefined}>
      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-primary">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((id) => (
          <Chip key={id} active={value === id} onClick={() => onChange(id)}>
            {labels[id]}
          </Chip>
        ))}
      </div>
    </div>
  );
}
