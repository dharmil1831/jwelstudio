"use client";

import { useState } from "react";

type ShareImageButtonProps = {
  generationId: string | null;
  imageUrl: string;
  className?: string;
};

export function ShareImageButton({
  generationId,
  imageUrl,
  className,
}: ShareImageButtonProps) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function ensureShareUrl(): Promise<string | null> {
    if (!generationId) return null;
    const res = await fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ generationId }),
    });
    const data = (await res.json()) as { shareUrl?: string; error?: string };
    if (!res.ok) throw new Error(data.error ?? "Could not create share link");
    return data.shareUrl ?? null;
  }

  async function handleShare() {
    setBusy(true);
    setCopied(false);
    try {
      const shareUrl = (await ensureShareUrl()) ?? imageUrl;
      const title = "Jwelpixel creation";
      const text = "Check out this jewelry look from Jwelpixel";

      if (typeof navigator !== "undefined" && navigator.share) {
        try {
          await navigator.share({ title, text, url: shareUrl });
          return;
        } catch (e) {
          if (e instanceof Error && e.name === "AbortError") return;
        }
      }

      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Could not share");
    } finally {
      setBusy(false);
    }
  }

  function openWhatsApp() {
    void (async () => {
      setBusy(true);
      try {
        const shareUrl = (await ensureShareUrl()) ?? imageUrl;
        const text = encodeURIComponent(
          `Check out this jewelry look from Jwelpixel: ${shareUrl}`,
        );
        window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
      } catch (e) {
        window.alert(e instanceof Error ? e.message : "Could not share");
      } finally {
        setBusy(false);
      }
    })();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={busy || !generationId}
        onClick={() => void handleShare()}
        title={
          generationId
            ? "Share link or system share sheet"
            : "Generate again to enable sharing"
        }
        className={
          className ??
          "rounded-xl border border-primary/25 bg-secondary px-4 py-2 text-sm font-medium text-foreground hover:bg-accent/30 disabled:opacity-40"
        }
      >
        {busy ? "…" : copied ? "Link copied" : "Share"}
      </button>
      <button
        type="button"
        disabled={busy || !generationId}
        onClick={openWhatsApp}
        className="rounded-xl border border-primary/25 bg-secondary px-4 py-2 text-sm font-medium text-foreground hover:bg-accent/30 disabled:opacity-40"
      >
        WhatsApp
      </button>
    </div>
  );
}
