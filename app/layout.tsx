import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { isAdminEmail } from "@/lib/admin";
import { getSessionUser } from "@/lib/session";
import "./globals.css";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600"],
});

const sans = DM_Sans({
  variable: "--font-sans",
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
  const initialSession = user
    ? {
        authenticated: true as const,
        user: { email: user.email, phone: user.phone },
        credits: user.credits,
        isAdmin: isAdminEmail(user.email),
      }
    : { authenticated: false as const };

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
