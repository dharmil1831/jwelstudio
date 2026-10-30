import { publicSeoRoutes, siteUrl } from "@/lib/site-seo";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return publicSeoRoutes.map((route) => ({
    url: `${base}${route.path === "/" ? "" : route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
