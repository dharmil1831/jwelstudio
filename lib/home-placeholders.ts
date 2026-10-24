import { prisma } from "@/lib/prisma";

export const BUILTIN_HOME_IMAGES = [
  "/mobile-looks/look-beauty.jpg",
  "/mobile-looks/look-bridal.jpg",
  "/mobile-looks/look-glamour.jpg",
  "/mobile-looks/look-outdoor.jpg",
  "/mobile-looks/look-couple.jpg",
  "/mobile-looks/look-tuxedo.jpg",
  "/mobile-looks/product-black.jpg",
  "/mobile-looks/product-white.jpg",
  "/mobile-looks/product-gold.jpg",
  "/mobile-looks/product-blush.jpg",
  "/mobile-looks/product-navy.jpg",
  "/mobile-looks/product-portrait.jpg",
  "/mobile-looks/product-landscape.jpg",
  "/mobile-looks/product-story.jpg",
] as const;

const SETTING_KEY = "homePlaceholders";

export type HomePlaceholderSelection = {
  hero: string[];
  before: string;
  after: string;
  stepUpload: string;
  stepModel: string;
  stepBackdrop: string;
  stepDownload: string;
  gallery: string[];
};

export type HomePlaceholderConfig = HomePlaceholderSelection & {
  uploads: string[];
};

export const DEFAULT_HOME_PLACEHOLDERS: HomePlaceholderSelection = {
  hero: [
    "/mobile-looks/look-beauty.jpg",
    "/mobile-looks/look-bridal.jpg",
    "/mobile-looks/product-gold.jpg",
    "/mobile-looks/look-glamour.jpg",
    "/mobile-looks/product-blush.jpg",
    "/mobile-looks/look-outdoor.jpg",
    "/mobile-looks/product-black.jpg",
    "/mobile-looks/look-couple.jpg",
  ],
  before: "/mobile-looks/product-portrait.jpg",
  after: "/mobile-looks/product-gold.jpg",
  stepUpload: "/mobile-looks/product-black.jpg",
  stepModel: "/mobile-looks/look-bridal.jpg",
  stepBackdrop: "/mobile-looks/product-white.jpg",
  stepDownload: "/mobile-looks/look-glamour.jpg",
  gallery: [
    "/mobile-looks/product-black.jpg",
    "/mobile-looks/look-bridal.jpg",
    "/mobile-looks/product-gold.jpg",
    "/mobile-looks/product-navy.jpg",
    "/mobile-looks/product-blush.jpg",
    "/mobile-looks/look-beauty.jpg",
    "/mobile-looks/product-white.jpg",
    "/mobile-looks/product-portrait.jpg",
    "/mobile-looks/look-couple.jpg",
    "/mobile-looks/product-landscape.jpg",
    "/mobile-looks/product-story.jpg",
    "/mobile-looks/look-glamour.jpg",
  ],
};

const SINGLE_KEYS = [
  "before",
  "after",
  "stepUpload",
  "stepModel",
  "stepBackdrop",
  "stepDownload",
] as const;

let cache: { at: number; value: HomePlaceholderConfig } | null = null;
const CACHE_MS = 15_000;

function isBuiltin(src: string): boolean {
  return (BUILTIN_HOME_IMAGES as readonly string[]).includes(src);
}

function isStoredUpload(src: string): boolean {
  if (src.startsWith("/api/uploads/home-placeholders/")) {
    const name = src.slice("/api/uploads/home-placeholders/".length);
    return /^[a-zA-Z0-9_-]+\.(jpg|png|webp)$/.test(name);
  }
  try {
    const url = new URL(src);
    return url.protocol === "https:" && url.pathname.includes("/home-placeholders/");
  } catch {
    return false;
  }
}

function unique(values: string[], allowed: Set<string>, max: number): string[] {
  const out: string[] = [];
  for (const value of values) {
    if (!allowed.has(value) || out.includes(value)) continue;
    out.push(value);
    if (out.length >= max) break;
  }
  return out;
}

export function libraryFor(uploads: string[]): string[] {
  return [...BUILTIN_HOME_IMAGES, ...uploads];
}

export function normalizeHomePlaceholders(
  raw: unknown,
  uploads: string[],
): HomePlaceholderSelection {
  const allowed = new Set(libraryFor(uploads));
  const source =
    raw && typeof raw === "object" ? (raw as Partial<HomePlaceholderSelection>) : {};
  const hero = unique(
    Array.isArray(source.hero) ? source.hero.filter((v) => typeof v === "string") : [],
    allowed,
    12,
  );
  const gallery = unique(
    Array.isArray(source.gallery) ? source.gallery.filter((v) => typeof v === "string") : [],
    allowed,
    16,
  );
  const next: HomePlaceholderSelection = {
    hero: hero.length >= 2 ? hero : DEFAULT_HOME_PLACEHOLDERS.hero,
    before: DEFAULT_HOME_PLACEHOLDERS.before,
    after: DEFAULT_HOME_PLACEHOLDERS.after,
    stepUpload: DEFAULT_HOME_PLACEHOLDERS.stepUpload,
    stepModel: DEFAULT_HOME_PLACEHOLDERS.stepModel,
    stepBackdrop: DEFAULT_HOME_PLACEHOLDERS.stepBackdrop,
    stepDownload: DEFAULT_HOME_PLACEHOLDERS.stepDownload,
    gallery: gallery.length >= 4 ? gallery : DEFAULT_HOME_PLACEHOLDERS.gallery,
  };
  for (const key of SINGLE_KEYS) {
    const value = source[key];
    if (typeof value === "string" && allowed.has(value)) next[key] = value;
  }
  return next;
}

function emptyConfig(): HomePlaceholderConfig {
  return { ...DEFAULT_HOME_PLACEHOLDERS, uploads: [] };
}

export async function getHomePlaceholders(): Promise<HomePlaceholderConfig> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.value;
  try {
    const row = await prisma.appSetting.findUnique({ where: { key: SETTING_KEY } });
    if (!row?.value) {
      const value = emptyConfig();
      cache = { at: Date.now(), value };
      return value;
    }
    const parsed = JSON.parse(row.value) as Partial<HomePlaceholderConfig>;
    const uploads = unique(
      Array.isArray(parsed.uploads) ? parsed.uploads.filter((v) => typeof v === "string") : [],
      new Set(
        (Array.isArray(parsed.uploads) ? parsed.uploads : []).filter(
          (v): v is string => typeof v === "string" && isStoredUpload(v),
        ),
      ),
      40,
    );
    const value: HomePlaceholderConfig = {
      ...normalizeHomePlaceholders(parsed, uploads),
      uploads,
    };
    cache = { at: Date.now(), value };
    return value;
  } catch {
    return emptyConfig();
  }
}

export async function saveHomePlaceholders(
  selection: HomePlaceholderSelection,
): Promise<HomePlaceholderConfig> {
  const current = await getHomePlaceholders();
  const next: HomePlaceholderConfig = {
    ...normalizeHomePlaceholders(selection, current.uploads),
    uploads: current.uploads,
  };
  await prisma.appSetting.upsert({
    where: { key: SETTING_KEY },
    create: { key: SETTING_KEY, value: JSON.stringify(next) },
    update: { value: JSON.stringify(next) },
  });
  cache = { at: Date.now(), value: next };
  return next;
}

export function publicSrcFromStoredUrl(url: string): string | null {
  const idx = url.indexOf("/api/uploads/home-placeholders/");
  if (idx >= 0) {
    const src = url.slice(idx);
    return isStoredUpload(src) ? src : null;
  }
  if (isStoredUpload(url) && url.startsWith("https://")) return url;
  return null;
}

export async function addHomePlaceholderUpload(src: string): Promise<HomePlaceholderConfig> {
  if (!isStoredUpload(src) || isBuiltin(src)) {
    throw new Error("That photo cannot be added.");
  }
  const current = await getHomePlaceholders();
  if (current.uploads.includes(src)) return current;
  const next: HomePlaceholderConfig = {
    ...current,
    uploads: [...current.uploads, src].slice(0, 40),
  };
  await prisma.appSetting.upsert({
    where: { key: SETTING_KEY },
    create: { key: SETTING_KEY, value: JSON.stringify(next) },
    update: { value: JSON.stringify(next) },
  });
  cache = { at: Date.now(), value: next };
  return next;
}
