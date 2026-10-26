import {
  isTemplateCategory,
  type PublicModelTemplate,
} from "@/lib/model-template-categories";
import { prisma } from "@/lib/prisma";
import { extensionForMime, storeGenerationImage } from "@/lib/storage";
import { loadStoredImage } from "@/lib/theme-preview";

export { isTemplateCategory };

export function cleanTemplateDescription(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const text = raw.replace(/\s+/g, " ").trim().slice(0, 140);
  return text || null;
}

export async function listActiveModelTemplates(): Promise<PublicModelTemplate[]> {
  const rows = await prisma.modelTemplate.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    select: { id: true, category: true, description: true, imageUrl: true },
  });
  return rows.map((r) => ({
    ...r,
    category: isTemplateCategory(r.category) ? r.category : "everyday",
  }));
}

/** Copy the generation image so deleting the source user's files never breaks the template. */
export async function copyGenerationToTemplateStorage(resultUrl: string): Promise<string> {
  const res = await fetch(resultUrl, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error("Could not download the source photo.");
  const mime = (res.headers.get("content-type") || "image/png").split(";")[0].trim();
  if (!mime.startsWith("image/")) throw new Error("The source is not a photo.");
  const buffer = Buffer.from(await res.arrayBuffer());
  if (!buffer.length) throw new Error("The source photo is empty.");
  return storeGenerationImage("model-templates", buffer, extensionForMime(mime));
}

/** Load an active template photo as the person/scene reference for generation. */
export async function fetchModelTemplateAsExtra(
  templateId: string,
): Promise<{ data: string; mimeType: string } | null> {
  const row = await prisma.modelTemplate.findFirst({
    where: { id: templateId, active: true },
    select: { imageUrl: true },
  });
  if (!row?.imageUrl) return null;
  return loadStoredImage(row.imageUrl);
}
