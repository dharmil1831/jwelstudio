function parseResendErrorMessage(body: string): string {
  try {
    const parsed = JSON.parse(body) as { message?: string };
    if (parsed.message) return parsed.message;
  } catch {
    // not JSON
  }
  return body.slice(0, 200);
}

export async function sendEmailOtp(email: string, code: string, purpose: "signup" | "reset"): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const subject =
    purpose === "reset"
      ? "Reset your Jewel Studio password"
      : "Your Jewel Studio verification code";
  const text =
    purpose === "reset"
      ? `Your password reset code is ${code}. It expires in 10 minutes. If you did not request this, ignore this email.`
      : `Your verification code is ${code}. It expires in 10 minutes.`;

  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Email is not configured. Set RESEND_API_KEY.");
    }
    console.info(`[dev email OTP] ${purpose} ${email}: ${code}`);
    return;
  }

  const from =
    process.env.RESEND_FROM?.trim() || "Jewel Studio <onboarding@resend.dev>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: email, subject, text }),
  });

  if (res.ok) return;

  const body = await res.text();
  const detail = parseResendErrorMessage(body);

  if (res.status === 403 && body.includes("testing emails")) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[dev email OTP] Resend blocked ${email}: ${detail}`);
      console.info(`[dev email OTP] ${purpose} ${email}: ${code}`);
      return;
    }
    throw new Error(
      "Email can only be sent to the Resend account address until you verify a domain and set RESEND_FROM.",
    );
  }

  throw new Error(`Could not send email: ${detail}`);
}
