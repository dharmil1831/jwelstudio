import { billingChannel, startBillingCheckout } from "@/lib/billing";
import { getCreditPacks } from "@/lib/credit-packs";
import { getSessionUser } from "@/lib/session";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  let body: { packId?: string; channel?: string };
  try {
    body = (await req.json()) as { packId?: string; channel?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const pack = getCreditPacks().find((item) => item.id === body.packId);
  if (!pack) {
    return NextResponse.json({ error: "Unknown pack." }, { status: 400 });
  }

  try {
    const session = await startBillingCheckout({
      channel: billingChannel(body.channel),
      userId: user.id,
      email: user.email,
      packId: pack.id,
    });
    return NextResponse.json(session);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout failed";
    const status = message.includes("not open") ? 503 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
