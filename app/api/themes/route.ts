import { getAppSettings } from "@/lib/app-settings";
import { canUseFeature } from "@/lib/entitlements";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import {
  normalizeThemePreviewUrl,
  normalizeThemeStyle,
  serializeThemeStyle,
  themeLimitForPlan,
} from "@/lib/themes";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Please log in." }, { status: 401 });
  }

  if (!canUseFeature(user.plan, "themes")) {
    return NextResponse.json(
      {
        error: "Saved themes unlock on Platinum and Diamond.",
        themes: [],
        limit: 0,
      },
      { status: 403 },
    );
  }

  const limit = themeLimitForPlan(user.plan);
  const themes = await prisma.theme.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      styleJson: true,
      previewUrl: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    themes: themes.map((t) => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
    })),
    limit,
    count: themes.length,
  });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Please log in." }, { status: 401 });
  }

  const settings = await getAppSettings();
  if (!canUseFeature(user.plan, "themes") || !settings.featureThemesEnabled) {
    return NextResponse.json(
      { error: "Saved themes unlock on Platinum and Diamond." },
      { status: 403 },
    );
  }

  let json: Record<string, unknown>;
  try {
    json = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name =
    typeof json.name === "string" ? json.name.trim().slice(0, 80) : "";
  if (!name) {
    return NextResponse.json({ error: "Theme name is required." }, { status: 400 });
  }

  const styleBody =
    json.style && typeof json.style === "object" && !Array.isArray(json.style)
      ? (json.style as Record<string, unknown>)
      : json;
  const style = normalizeThemeStyle(styleBody);
  if (!style) {
    return NextResponse.json({ error: "Invalid theme style." }, { status: 400 });
  }

  const previewUrl = normalizeThemePreviewUrl(json.previewUrl);

  const limit = themeLimitForPlan(user.plan);
  const count = await prisma.theme.count({ where: { userId: user.id } });
  if (count >= limit) {
    return NextResponse.json(
      {
        error: `Theme limit reached (${limit}). Delete a theme or upgrade to Diamond for more.`,
        limit,
        count,
      },
      { status: 403 },
    );
  }

  const theme = await prisma.theme.create({
    data: {
      userId: user.id,
      name,
      styleJson: serializeThemeStyle(style),
      previewUrl,
    },
    select: {
      id: true,
      name: true,
      styleJson: true,
      previewUrl: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    theme: { ...theme, createdAt: theme.createdAt.toISOString() },
  });
}
