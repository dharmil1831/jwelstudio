import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Jewel Studio",
    short_name: "JewelStudio",
    description: "AI model shots for jewelry — upload, style, generate.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf8f5",
    theme_color: "#d97706",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
