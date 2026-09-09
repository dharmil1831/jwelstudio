/** User-facing error copy — never expose provider/infra details to clients. */

export const GENERIC_ERROR = "Something went wrong. Please try again.";
export const GENERIC_GENERATION_ERROR =
  "Could not generate right now. Please try again in a moment.";
export const GENERIC_NETWORK_ERROR =
  "Connection issue. Check your internet and try again.";

const SAFE_EXACT = new Set([
  "Please log in.",
  "Please log in first.",
  "Please log in to generate images.",
  "Please log in to generate video.",
  "Please log in to buy credits.",
  "Please log in as admin.",
  "No credits left. Buy a credit pack to continue.",
  "Could not deduct credits",
  "Passwords do not match.",
  "Invalid email or password.",
  "Invalid or expired verification code.",
  "No account found.",
  "Provide a valid email address.",
  "Provide a valid 10-digit mobile number.",
  "Provide a valid email address or mobile number.",
  "An account with this email already exists. Please log in.",
  "An account with this phone already exists. Please log in.",
  "Email and password are required.",
  "Phone and verification code are required.",
  "Verification code is required.",
  "Choose a valid video motion preset.",
  "Photo is too large. Try a smaller JPG.",
  "Photo is too large. Please try a smaller JPG, or crop closer to the jewelry.",
  "Public sharing is temporarily disabled.",
  "Generation not found",
  "Theme not found.",
  "Theme name is required.",
  "Invalid theme style.",
  "Saved themes unlock on Platinum and Diamond.",
  "Saved looks unlock on Platinum and above.",
  "Video unlocks on Diamond. See Pricing.",
  "Razorpay is not configured.",
  "Razorpay failed to load. Check your connection.",
  "Invalid payment signature.",
  "Missing payment fields.",
  "Order not found.",
  "Checkout failed",
  "Payment verify failed",
  "Could not create share link",
  "Could not share",
  "Could not save look",
  "Could not save",
  "Could not delete",
  "Could not send code",
  "Could not create account",
  "Could not reset password",
  "Login failed",
  "Failed to load gallery",
  "Failed to load themes",
  "Update failed",
  "Delete failed",
  "Create failed",
  "Save failed",
  "Request failed",
  "Video failed",
  "Enter a valid hex color like #110707",
  "Please choose a JPG, PNG, or WebP image.",
  "Please choose a JPG, PNG, or WebP selfie.",
  "Generate an image first, then save it as a look.",
  "Enter a valid non-negative number.",
  "Theme was selected but its preview image could not be loaded. Generate used style chips only.",
  "This account is not the super admin.",
  "Super admin already exists. Log in instead.",
  "Cannot delete the super admin account.",
  "Email or phone already in use.",
  "A user with this email already exists.",
  "A user with this phone already exists.",
  "User not found",
  "Forbidden",
  "Unauthorized",
]);

function normalizeMessage(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

function isTechnicalLeak(message: string): boolean {
  return /gemini|openai|google ai|vercel|api[_ ]?key|GEMINI_|OPENAI_|IMAGE_PROVIDER|quota|billing details|resource.?exhausted|ECONN|ENOTFOUND|prisma|supabase|MSG91|RESEND_|stack trace|at Object\.|node_modules|predictLongRunning|generativelanguage|platform\.openai|insufficient.?quota|check your plan|hotspot|jdk-|gradle|capacitor|127\.0\.0\.1|localhost:\d+/i.test(
    message,
  );
}

/**
 * Map any thrown/API error to safe UI copy.
 * Keep short product messages; hide provider/infra details.
 */
export function toUserFacingError(
  err: unknown,
  fallback: string = GENERIC_ERROR,
): string {
  if (err instanceof DOMException && err.name === "AbortError") {
    return "Request timed out. Please try again with a smaller JPG photo.";
  }

  const message = normalizeMessage(
    err instanceof Error ? err.message : typeof err === "string" ? err : "",
  );

  if (!message) return fallback;

  if (
    /did not match the expected pattern|not a valid image|HEIC|HEIF|could not read this photo/i.test(
      message,
    )
  ) {
    return "Could not read this photo. On iPhone, use JPG: Settings → Camera → Formats → Most Compatible, or share as JPG.";
  }

  if (
    /Unexpected token|is not valid JSON|JSON\.parse|FUNCTION_INVOCATION_TIMEOUT|Payload Too Large|413/i.test(
      message,
    )
  ) {
    return "Generation took too long or the photo was too large. Please try a smaller JPG.";
  }

  if (/failed to fetch|networkerror|load failed|net::err/i.test(message)) {
    return GENERIC_NETWORK_ERROR;
  }

  if (/timeout|timed out|deadline/i.test(message)) {
    return "This is taking too long. Please try again with a smaller photo.";
  }

  if (
    /no credits left|buy a credit pack|needs \d+ credits|could not deduct credits/i.test(
      message,
    )
  ) {
    return message.length <= 160 ? message : "No credits left. Buy a credit pack to continue.";
  }

  if (/please log in|unauthorized/i.test(message)) {
    return message.toLowerCase().includes("admin")
      ? "Please log in as admin."
      : "Please log in to continue.";
  }

  if (/unlocks? on|upgrade|platinum|diamond|gold\+/i.test(message) && message.length <= 160) {
    return message;
  }

  if (
    /password|email|phone|verification code|otp|account already|no account|invalid email or password/i.test(
      message,
    ) &&
    message.length <= 180 &&
    !isTechnicalLeak(message)
  ) {
    return message;
  }

  if (SAFE_EXACT.has(message)) {
    return message;
  }

  // Prefix match for dynamic but safe copy (theme limits, credit costs, etc.)
  if (
    /^(Saved themes unlock|Theme limit reached|Video needs|Custom prompt is available|Brand \/ festival|Selfie \/ own-model|Photo is too large|This photo is too large|SMS limit|Please wait a moment|Enter a valid|Provide a valid|An account with|This email|This phone|Cannot |generationId)/i.test(
      message,
    ) &&
    message.length <= 200 &&
    !isTechnicalLeak(message)
  ) {
    return message;
  }

  if (isTechnicalLeak(message) || /:\s*[{\[]/.test(message) || message.length > 220) {
    if (/generat|image|video|veo|provider/i.test(message)) {
      return GENERIC_GENERATION_ERROR;
    }
    return fallback;
  }

  // Short, plain product copy without technical markers — keep it.
  if (
    message.length <= 140 &&
    !/[`{}<>]|Exception|Error:|status\s*\d{3}/i.test(message) &&
    !isTechnicalLeak(message)
  ) {
    return message;
  }

  return fallback;
}
