import type { OutputFormat } from "@/lib/style-options";
import { OUTPUT_FORMAT_EXPORT_PX } from "@/lib/style-options";

export const CUSTOM_SIZE_MIN = 256;
export const CUSTOM_SIZE_MAX = 4096;

export type CustomSize = {
  width: number;
  height: number;
};

const GEMINI_ASPECTS: { ratio: number; value: string }[] = [
  { ratio: 1, value: "1:1" },
  { ratio: 4 / 5, value: "4:5" },
  { ratio: 5 / 4, value: "5:4" },
  { ratio: 3 / 4, value: "3:4" },
  { ratio: 4 / 3, value: "4:3" },
  { ratio: 2 / 3, value: "2:3" },
  { ratio: 3 / 2, value: "3:2" },
  { ratio: 9 / 16, value: "9:16" },
  { ratio: 16 / 9, value: "16:9" },
];

function asPixels(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  const px = Math.round(n);
  if (px < CUSTOM_SIZE_MIN || px > CUSTOM_SIZE_MAX) return null;
  return px;
}

export function parseCustomSize(width: unknown, height: unknown): CustomSize | null {
  const w = asPixels(width);
  const h = asPixels(height);
  if (w == null || h == null) return null;
  return { width: w, height: h };
}

/** Closest Gemini image aspect for a custom canvas. */
export function nearestGeminiAspect(width: number, height: number): string {
  const target = width / height;
  let best = GEMINI_ASPECTS[0];
  let bestDiff = Math.abs(Math.log(target / best.ratio));
  for (const aspect of GEMINI_ASPECTS) {
    const diff = Math.abs(Math.log(target / aspect.ratio));
    if (diff < bestDiff) {
      best = aspect;
      bestDiff = diff;
    }
  }
  return best.value;
}

/** Closest studio preset, used when a provider only accepts the preset list. */
export function nearestOutputFormat(width: number, height: number): OutputFormat {
  const target = width / height;
  let best: OutputFormat = "square";
  let bestDiff = Number.POSITIVE_INFINITY;
  for (const [format, px] of Object.entries(OUTPUT_FORMAT_EXPORT_PX) as [
    OutputFormat,
    { width: number; height: number },
  ][]) {
    const diff = Math.abs(Math.log(target / (px.width / px.height)));
    if (diff < bestDiff) {
      best = format;
      bestDiff = diff;
    }
  }
  return best;
}
