"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ProfileActions() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <button
      type="button"
      disabled={loggingOut}
      onClick={() => void logout()}
      className="mt-4 w-full rounded-xl border border-red-200 py-3 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
    >
      {loggingOut ? "Logging out…" : "Log out"}
    </button>
  );
}
