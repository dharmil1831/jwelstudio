import type { Metadata } from "next";
import { Manrope, Newsreader } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { hasAdminSession } from "@/lib/admin";
import { getSessionUser } from "@/lib/session";
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
  title: "Jewel Studio — AI model shots for jewelry",
  description:
    "Upload jewelry, pick your style, and generate model shots. 5 free generations for new accounts.",
  appleWebApp: {
    capable: true,
    title: "Jewel Studio",
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
        <SiteHeader initialSession={initialSession} />
        {children}
      </body>
    </html>
  );
}
