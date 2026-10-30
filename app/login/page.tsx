import { LoginTutorial } from "@/components/login-tutorial";
import { LoginGate } from "@/components/login-gate";
import { getAppSettings, youtubeEmbedUrl } from "@/lib/app-settings";
import Link from "next/link";

export const metadata = {
  title: "Log in — Jwelpixel",
  description:
    "Sign in to Jwelpixel with your phone number, Gmail, or email. New accounts start with a phone code.",
  alternates: { canonical: "/login" },
};

export default async function LoginPage() {
  const settings = await getAppSettings();
  const tutorialUrl = youtubeEmbedUrl(settings.loginTutorialVideoUrl);

  return (
    <div className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm font-medium text-primary hover:text-accent">
          ← Back home
        </Link>
        <h1 className="mt-8 font-[family-name:var(--font-display)] text-3xl font-normal text-foreground">
          Welcome to Jwelpixel
        </h1>
        <p className="mt-2 text-foreground/70">
          See how the app works, then sign up or log in.
        </p>

        <div className="mt-8 grid items-start gap-6 md:grid-cols-2 md:gap-8">
          <LoginTutorial embedUrl={tutorialUrl} rawUrl={settings.loginTutorialVideoUrl} />
          <LoginGate />
        </div>
      </div>
    </div>
  );
}
