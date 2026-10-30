import { appBaseUrl } from "@/lib/app-url";
import type { Metadata } from "next";

export function siteUrl(): string {
  return appBaseUrl();
}

export const siteName = "Jwelpixel";

export const defaultTitle = "Jwelpixel — AI model shots for jewelry";

export const defaultDescription =
  "Turn one jewelry photo into model shots and catalog pictures. Jwelpixel is an AI studio for jewelry brands. New accounts get 5 free generations.";

/** Pages search engines should list. Account and admin screens stay out. */
export const publicSeoRoutes = [
  { path: "/", changeFrequency: "weekly" as const, priority: 1 },
  { path: "/pricing", changeFrequency: "monthly" as const, priority: 0.8 },
  { path: "/login", changeFrequency: "monthly" as const, priority: 0.5 },
  { path: "/contact", changeFrequency: "yearly" as const, priority: 0.4 },
  { path: "/terms", changeFrequency: "yearly" as const, priority: 0.3 },
  { path: "/privacy", changeFrequency: "yearly" as const, priority: 0.3 },
  { path: "/refund", changeFrequency: "yearly" as const, priority: 0.3 },
];

export const noIndex: Metadata["robots"] = { index: false, follow: false };

const DEFAULT_GTM_ID = "GTM-NLK5JK4W";

export function googleTagManagerId(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_GTM_ID?.trim() || DEFAULT_GTM_ID;
  if (!raw || raw === "off" || !/^GTM-[A-Z0-9]+$/.test(raw)) return undefined;
  return raw;
}

export function googleSiteVerification(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();
  if (!raw || !/^[A-Za-z0-9_-]{10,}$/.test(raw)) return undefined;
  return raw;
}

export const homeFaqs = [
  {
    question: "What does Jwelpixel do?",
    answer:
      "Jwelpixel turns one photo of a jewelry piece into model shots and clean catalog pictures you can post where you sell.",
  },
  {
    question: "Do I need a photoshoot?",
    answer:
      "No. Upload a plain photo of the piece, pick a model look or a clean backdrop, and download the result.",
  },
  {
    question: "Is there a free trial?",
    answer: "New accounts get 5 free generations. You do not need a card to start.",
  },
  {
    question: "Can I use the pictures in my shop?",
    answer: "Yes. Download the shots and use them on your store, catalog, or social posts.",
  },
  {
    question: "Does it work on a phone?",
    answer: "Yes. Use jwelpixel.xyz in the phone browser, or the Jwelpixel Android app.",
  },
] as const;
