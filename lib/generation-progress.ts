/** Typical 1K image gen lands around 8–20s; video longer. Cap below 100 until done. */
export function estimatedGenerationPercent(
  elapsedSec: number,
  video: boolean,
): number {
  const halfLife = video ? 28 : 9;
  const raw = 1 - Math.exp(-elapsedSec / halfLife);
  return Math.min(video ? 94 : 96, Math.max(1, Math.round(raw * 100)));
}
