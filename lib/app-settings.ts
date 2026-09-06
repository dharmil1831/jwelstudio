import { prisma } from "@/lib/prisma";

export type AppSettingsMap = {
  loginTutorialVideoUrl: string;
  featureVideoEnabled: boolean;
  featureSelfieEnabled: boolean;
  featureThemesEnabled: boolean;
  featureCustomPromptEnabled: boolean;
  featureBrandEnabled: boolean;
  featurePublicShareEnabled: boolean;
  smsEnabled: boolean;
};

const DEFAULTS: AppSettingsMap = {
  loginTutorialVideoUrl: "",
  featureVideoEnabled: true,
  featureSelfieEnabled: true,
  featureThemesEnabled: true,
  featureCustomPromptEnabled: true,
  featureBrandEnabled: true,
  featurePublicShareEnabled: true,
  smsEnabled: true,
};

let cache: { at: number; value: AppSettingsMap } | null = null;
const CACHE_MS = 15_000;

export async function getAppSettings(): Promise<AppSettingsMap> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.value;

  try {
    const rows = await prisma.appSetting.findMany();
    const map = { ...DEFAULTS };
    for (const row of rows) {
      if (row.key === "loginTutorialVideoUrl") {
        map.loginTutorialVideoUrl = row.value;
      } else if (row.key in DEFAULTS) {
        const k = row.key as keyof AppSettingsMap;
        if (typeof DEFAULTS[k] === "boolean") {
          (map as Record<string, unknown>)[k] = row.value === "true";
        } else {
          (map as Record<string, unknown>)[k] = row.value;
        }
      }
    }
    cache = { at: Date.now(), value: map };
    return map;
  } catch {
    return { ...DEFAULTS };
  }
}

export async function setAppSettings(
  partial: Partial<AppSettingsMap>,
): Promise<AppSettingsMap> {
  for (const [key, value] of Object.entries(partial)) {
    if (!(key in DEFAULTS)) continue;
    const stored =
      typeof value === "boolean" ? (value ? "true" : "false") : String(value ?? "");
    await prisma.appSetting.upsert({
      where: { key },
      create: { key, value: stored },
      update: { value: stored },
    });
  }
  cache = null;
  return getAppSettings();
}

export function youtubeEmbedUrl(raw: string): string | null {
  const url = raw.trim();
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace(/^\//, "");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      const parts = u.pathname.split("/");
      const embedIdx = parts.indexOf("embed");
      if (embedIdx >= 0 && parts[embedIdx + 1]) {
        return `https://www.youtube.com/embed/${parts[embedIdx + 1]}`;
      }
    }
    if (/\.(mp4|webm)(\?|$)/i.test(u.pathname)) return url;
  } catch {
    return null;
  }
  return null;
}
