"use client";

import { ONBOARDING_DONE_KEY } from "@/components/mobile-onboarding";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ProfileActions() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  async function deleteAccount() {
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: confirmText.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not delete account");
      try {
        window.localStorage.removeItem(ONBOARDING_DONE_KEY);
      } catch {
        /* private mode */
      }
      window.dispatchEvent(new Event("jewel-auth-changed"));
      router.push("/");
      router.refresh();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Could not delete account");
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        disabled={loggingOut}
        onClick={() => void logout()}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-red-300 bg-white py-3 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50 active:scale-[0.99] disabled:opacity-50"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
          <path
            d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3M16 16l4-4-4-4M20 12H10"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {loggingOut ? "Logging out…" : "Log out"}
      </button>

      <div className="mt-6">
        {!deleteOpen ? (
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="flex w-full items-center justify-between gap-3 rounded-xl border border-primary/15 bg-white/50 px-4 py-3 text-left transition hover:border-red-200 hover:bg-red-50/60"
          >
            <span>
              <span className="block text-sm font-medium text-foreground/75">Delete account</span>
              <span className="block text-xs text-foreground/50">
                Permanently remove your account and gallery
              </span>
            </span>
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-foreground/40" aria-hidden>
              <path
                d="m9 6 6 6-6 6"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ) : (
          <div className="rounded-xl border border-red-200 bg-red-50/60 p-4">
            <p className="text-sm font-semibold text-red-800">Delete your account?</p>
            <p className="mt-1 text-xs leading-relaxed text-red-800/80">
              This permanently removes your account, gallery, saved looks, and remaining
              credits. It cannot be undone. Type <strong>DELETE</strong> to confirm.
            </p>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              autoCapitalize="characters"
              className="mt-3 w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-300"
            />
            {deleteError ? (
              <p className="mt-2 text-xs text-red-700" role="alert">
                {deleteError}
              </p>
            ) : null}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => {
                  setDeleteOpen(false);
                  setConfirmText("");
                  setDeleteError(null);
                }}
                className="rounded-lg border border-primary/20 bg-white py-2 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting || confirmText.trim() !== "DELETE"}
                onClick={() => void deleteAccount()}
                className="rounded-lg bg-red-600 py-2 text-sm font-semibold text-white disabled:opacity-40"
              >
                {deleting ? "Deleting…" : "Delete forever"}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
