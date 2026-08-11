import { LoginGate } from "@/components/login-gate";
import Link from "next/link";

export const metadata = {
  title: "Log in — Jewel Studio",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/80 via-stone-50 to-stone-100 px-6 py-16">
      <div className="mx-auto max-w-lg">
        <Link href="/" className="text-sm font-medium text-amber-800 hover:text-amber-900">
          ← Back home
        </Link>
        <h1 className="mt-8 text-3xl font-light text-stone-900">Welcome to Jewel Studio</h1>
        <p className="mt-2 text-stone-600">Sign up or log in with OTP.</p>
        <div className="mt-8">
          <LoginGate />
        </div>
      </div>
    </div>
  );
}
