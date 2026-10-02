import {
  FESTIVAL_PRESETS,
  festivalById,
  type FestivalPreset,
} from "@/lib/brand-options";
import { getGoogleCalendarApiKey } from "@/lib/env";

export type FestivalChoice = {
  id: string;
  label: string;
  date: string | null;
  country: string | null;
  prompt: string;
};

/** Public Google holiday calendars. IDs are the documented `en.*#holiday` feeds. */
const HOLIDAY_CALENDARS: { country: string; id: string }[] = [
  { country: "India", id: "en.indian#holiday@group.v.calendar.google.com" },
  { country: "United States", id: "en.usa#holiday@group.v.calendar.google.com" },
  { country: "United Kingdom", id: "en.uk#holiday@group.v.calendar.google.com" },
  { country: "United Arab Emirates", id: "en.ae#holiday@group.v.calendar.google.com" },
  { country: "Saudi Arabia", id: "en.saudiarabian#holiday@group.v.calendar.google.com" },
  { country: "Singapore", id: "en.singapore#holiday@group.v.calendar.google.com" },
  { country: "Malaysia", id: "en.malaysia#holiday@group.v.calendar.google.com" },
  { country: "Indonesia", id: "en.indonesian#holiday@group.v.calendar.google.com" },
  { country: "Japan", id: "en.japanese#holiday@group.v.calendar.google.com" },
  { country: "China", id: "en.china#holiday@group.v.calendar.google.com" },
  { country: "Hong Kong", id: "en.hong_kong#holiday@group.v.calendar.google.com" },
  { country: "South Korea", id: "en.south_korea#holiday@group.v.calendar.google.com" },
  { country: "Australia", id: "en.australian#holiday@group.v.calendar.google.com" },
  { country: "Canada", id: "en.canadian#holiday@group.v.calendar.google.com" },
  { country: "Germany", id: "en.german#holiday@group.v.calendar.google.com" },
  { country: "France", id: "en.french#holiday@group.v.calendar.google.com" },
  { country: "Italy", id: "en.italian#holiday@group.v.calendar.google.com" },
  { country: "Spain", id: "en.spanish#holiday@group.v.calendar.google.com" },
  { country: "Brazil", id: "en.brazilian#holiday@group.v.calendar.google.com" },
  { country: "Mexico", id: "en.mexican#holiday@group.v.calendar.google.com" },
  { country: "South Africa", id: "en.sa#holiday@group.v.calendar.google.com" },
  { country: "Pakistan", id: "en.pk#holiday@group.v.calendar.google.com" },
  { country: "Bangladesh", id: "en.bd#holiday@group.v.calendar.google.com" },
  { country: "Sri Lanka", id: "en.lk#holiday@group.v.calendar.google.com" },
  { country: "Nepal", id: "en.np#holiday@group.v.calendar.google.com" },
  { country: "Thailand", id: "en.th#holiday@group.v.calendar.google.com" },
  { country: "Philippines", id: "en.philippines#holiday@group.v.calendar.google.com" },
  { country: "New Zealand", id: "en.new_zealand#holiday@group.v.calendar.google.com" },
  { country: "Ireland", id: "en.irish#holiday@group.v.calendar.google.com" },
  { country: "Netherlands", id: "en.dutch#holiday@group.v.calendar.google.com" },
  { country: "Turkey", id: "en.turkish#holiday@group.v.calendar.google.com" },
  { country: "Egypt", id: "en.eg#holiday@group.v.calendar.google.com" },
];

type GoogleEvent = {
  summary?: string;
  start?: { date?: string; dateTime?: string };
};

const CACHE_MS = 24 * 60 * 60 * 1000;
let cache: { at: number; festivals: FestivalChoice[] } | null = null;

function normName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function slug(country: string, name: string, date: string): string {
  const raw = `${country}-${name}-${date}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return raw.slice(0, 80) || "festival";
}

function genericPrompt(label: string): string {
  return `Festive jewelry campaign mood for "${label}": celebratory styling in the set and lighting only. Do not alter the jewelry piece.`;
}

function presetPrompt(name: string): string {
  const n = normName(name);
  if (/\b(dussehra|dushera|dasara|vijayadashami|vijaya dashami)\b/.test(n)) {
    return (
      FESTIVAL_PRESETS.find((p) => p.id === "dussehra")?.prompt ||
      genericPrompt(name)
    );
  }
  const hit = FESTIVAL_PRESETS.find(
    (p) => p.id !== "none" && (n.includes(normName(p.label)) || normName(p.label).includes(n)),
  );
  return hit?.prompt || genericPrompt(name);
}

export function fallbackFestivals(): FestivalChoice[] {
  return FESTIVAL_PRESETS.map((p) => ({
    id: p.id,
    label: p.label,
    date: null,
    country: p.id === "none" ? null : "Jewelry calendar",
    prompt: p.prompt,
  }));
}

async function fetchCalendar(
  calendarId: string,
  country: string,
  timeMin: string,
  timeMax: string,
  apiKey: string,
): Promise<FestivalChoice[]> {
  const url = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
  );
  url.searchParams.set("key", apiKey);
  url.searchParams.set("timeMin", timeMin);
  url.searchParams.set("timeMax", timeMax);
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("maxResults", "40");

  const res = await fetch(url, { signal: AbortSignal.timeout(12_000) });
  if (!res.ok) return [];
  const json = (await res.json()) as { items?: GoogleEvent[] };
  const out: FestivalChoice[] = [];
  for (const item of json.items ?? []) {
    const name = item.summary?.trim();
    const date = item.start?.date || item.start?.dateTime?.slice(0, 10);
    if (!name || !date) continue;
    out.push({
      id: slug(country, name, date),
      label: name,
      date,
      country,
      prompt: presetPrompt(name),
    });
  }
  return out;
}

function mergePresets(events: FestivalChoice[]): FestivalChoice[] {
  const names = new Set(events.map((e) => normName(e.label)));
  const extra: FestivalChoice[] = [];
  for (const preset of FESTIVAL_PRESETS) {
    if (preset.id === "none") continue;
    if ([...names].some((n) => n.includes(normName(preset.label)) || normName(preset.label).includes(n))) {
      continue;
    }
    extra.push({
      id: preset.id,
      label: preset.label,
      date: null,
      country: "Jewelry calendar",
      prompt: preset.prompt,
    });
  }
  return [...events, ...extra];
}

export async function listFestivals(): Promise<FestivalChoice[]> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.festivals;

  const apiKey = getGoogleCalendarApiKey();
  if (!apiKey) return fallbackFestivals();

  const start = new Date();
  const end = new Date();
  end.setMonth(end.getMonth() + 10);
  const timeMin = start.toISOString();
  const timeMax = end.toISOString();

  const batches = await Promise.all(
    HOLIDAY_CALENDARS.map((cal) =>
      fetchCalendar(cal.id, cal.country, timeMin, timeMax, apiKey).catch(() => []),
    ),
  );

  const byName = new Map<string, FestivalChoice>();
  for (const event of batches.flat()) {
    const key = normName(event.label);
    const prev = byName.get(key);
    if (!prev || (event.date && prev.date && event.date < prev.date)) {
      byName.set(key, event);
    }
  }

  const merged = mergePresets([...byName.values()]);
  merged.sort((a, b) => {
    if (a.date && b.date) return a.date.localeCompare(b.date);
    if (a.date) return -1;
    if (b.date) return 1;
    return a.label.localeCompare(b.label);
  });

  const festivals: FestivalChoice[] = [
    {
      id: "none",
      label: "None",
      date: null,
      country: null,
      prompt: "",
    },
    ...merged.slice(0, 160),
  ];

  if (merged.length === 0) return fallbackFestivals();
  cache = { at: Date.now(), festivals };
  return festivals;
}

export function promptForFestival(
  id: string,
  label: string | null | undefined,
): string {
  const known: FestivalPreset | null = festivalById(id);
  if (known?.prompt) return known.prompt;
  const name = label?.trim();
  if (!name || id === "none") return "";
  return genericPrompt(name);
}
