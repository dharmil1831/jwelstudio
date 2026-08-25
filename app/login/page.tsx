import { LoginGate } from "@/components/login-gate";
import Link from "next/link";

export const metadata = {
  title: "Log in — Jewel Studio",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background px-6 py-16 text-foreground">
      <div className="mx-auto max-w-lg">
        <Link href="/" className="text-sm font-medium text-primary hover:text-accent">
          ← Back home
        </Link>
        <h1 className="mt-8 font-[family-name:var(--font-display)] text-3xl font-light text-foreground">
          Welcome to Jewel Studio
        </h1>
        <p className="mt-2 text-foreground/70">Sign up or log in with OTP.</p>
        <div className="mt-8">
          <LoginGate />
        </div>
      </div>
    </div>
  );
}
