import type { Metadata } from "next";
import { Manrope, Newsreader } from "next/font/google";
import { GoogleTagManager } from "@/components/google-tag-manager";
import { JsonLd } from "@/components/json-ld";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { hasAdminSession } from "@/lib/admin";
import { getSessionUser } from "@/lib/session";
import {
  defaultDescription,
  defaultTitle,
  googleSiteVerification,
  siteName,
  siteUrl,
} from "@/lib/site-seo";
import "./globals.css";

const display = Newsreader({
  variable: "--font-display-family",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const sans = Manrope({
  variable: "--font-sans-family",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: defaultTitle,
  description: defaultDescription,
  applicationName: siteName,
  openGraph: {
    type: "website",
    siteName,
    locale: "en_IN",
    title: defaultTitle,
    description: defaultDescription,
    images: [{ url: "/brand/jwelpixel-emblem-v4.png", alt: "Jwelpixel" }],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
    images: ["/brand/jwelpixel-emblem-v4.png"],
  },
  robots: { index: true, follow: true },
  ...(googleSiteVerification()
    ? { verification: { google: googleSiteVerification() } }
    : {}),
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    title: "Jwelpixel",
    statusBarStyle: "default",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSessionUser();
  const isAdmin = await hasAdminSession();
  const initialSession = user
    ? {
        authenticated: true as const,
        user: { email: user.email, phone: user.phone },
        credits: user.credits,
        isAdmin,
      }
    : { authenticated: false as const, isAdmin };

  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col overflow-x-hidden bg-background font-sans text-foreground">
        <GoogleTagManager />
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                name: siteName,
                url: siteUrl(),
                logo: `${siteUrl()}/brand/jwelpixel-emblem-v4.png`,
                email: "jwelpixel@gmail.com",
              },
              {
                "@type": "WebSite",
                name: siteName,
                url: siteUrl(),
                description: defaultDescription,
              },
            ],
          }}
        />
        <SiteHeader initialSession={initialSession} />
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
