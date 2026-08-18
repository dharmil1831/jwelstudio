export async function readApiJson<T extends Record<string, unknown>>(
  res: Response,
): Promise<T> {
  const text = await res.text();
  if (!text) {
    throw new Error(
      "Generation failed. Please try again with a smaller JPG photo.",
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
    throw new Error("Could not generate. Please try again with a smaller JPG photo.");
  }
}

export function friendlyClientError(err: unknown): string {
  if (err instanceof DOMException && err.name === "AbortError") {
    return "Generation timed out. Please try again with a smaller JPG photo.";
  }
  const message = err instanceof Error ? err.message : "Something went wrong";
  if (
    /did not match the expected pattern|not a valid image|HEIC|HEIF|could not read this/i.test(
      message,
    )
  ) {
    return "Could not read this photo. On iPhone, use JPG: Settings → Camera → Formats → Most Compatible, or share as JPG.";
  }
  if (/Unexpected token|is not valid JSON|JSON\.parse/i.test(message)) {
    return "Generation took too long or the photo was too large. Please try a smaller JPG.";
  }
  return message;
}
