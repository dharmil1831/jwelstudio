/** MSG91 SMS OTP — https://msg91.com (India DLT templates required in production). */

function getAuthKey(): string | undefined {
  return process.env.MSG91_AUTH_KEY?.trim() || undefined;
}

function getTemplateId(): string | undefined {
  return process.env.MSG91_TEMPLATE_ID?.trim() || undefined;
}

export function isMsg91Configured(): boolean {
  return Boolean(getAuthKey() && getTemplateId());
}

/** Digits only for MSG91 (91XXXXXXXXXX). */
export function msg91Mobile(e164: string): string {
  return e164.replace(/\D/g, "");
}

/**
 * Send a 6-digit OTP SMS via MSG91.
 * Uses OTP API v5; template must include ##OTP## (or your configured variable).
 */
export async function sendMsg91Otp(
  e164Phone: string,
  code: string,
): Promise<void> {
  const authKey = getAuthKey();
  const templateId = getTemplateId();

  if (!authKey || !templateId) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SMS is not configured. Set MSG91_AUTH_KEY and MSG91_TEMPLATE_ID.");
    }
    console.info(`[dev SMS OTP] ${e164Phone}: ${code}`);
    return;
  }

  const mobile = msg91Mobile(e164Phone);
  const sender = process.env.MSG91_SENDER_ID?.trim();

  const url = new URL("https://control.msg91.com/api/v5/otp");
  url.searchParams.set("template_id", templateId);
  url.searchParams.set("mobile", mobile);
  url.searchParams.set("otp", code);
  if (sender) url.searchParams.set("sender", sender);

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      authkey: authKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      template_id: templateId,
      mobile,
      otp: code,
      ...(sender ? { sender } : {}),
    }),
  });

  const text = await res.text();
  let json: { type?: string; message?: string } = {};
  try {
    json = JSON.parse(text) as typeof json;
  } catch {
    /* plain text */
  }

  if (!res.ok || (json.type && json.type !== "success")) {
    const detail = json.message || text.slice(0, 200) || `HTTP ${res.status}`;
    throw new Error(`Could not send SMS: ${detail}`);
  }
}
