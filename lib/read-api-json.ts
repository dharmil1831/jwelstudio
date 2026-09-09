import { toUserFacingError } from "@/lib/user-facing-error";

export async function readApiJson<T extends Record<string, unknown>>(
  res: Response,
): Promise<T> {
  const text = await res.text();
  if (!text) {
    throw new Error(
      "Could not generate right now. Please try again in a moment.",
    );
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    if (
      /timeout|timed out|FUNCTION_INVOCATION_TIMEOUT|error occurred|Payload Too Large|413/i.test(
        text,
      ) ||
      res.status >= 500
    ) {
      throw new Error(
        "Generation took too long or the photo was too large. Please try a smaller JPG.",
      );
    }
    throw new Error(
      "Could not generate right now. Please try again in a moment.",
    );
  }
}

/** Map any client-side catch value to safe UI copy. */
export function friendlyClientError(err: unknown): string {
  return toUserFacingError(err);
}
