"use client";

import { toUserFacingError } from "@/lib/user-facing-error";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Settings = {
  loginTutorialVideoUrl: string;
  featureVideoEnabled: boolean;
  featureSelfieEnabled: boolean;
  featureThemesEnabled: boolean;
  featureCustomPromptEnabled: boolean;
  featureBrandEnabled: boolean;
  featurePublicShareEnabled: boolean;
  smsEnabled: boolean;
};

export function AdminSettingsForm() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void fetch("/api/admin/settings")
      .then(async (r) => {
        const data = (await r.json()) as { settings?: Settings; error?: string };
        if (!r.ok) throw new Error(data.error ?? "Failed to load");
        setSettings(data.settings ?? null);
      })
      .catch((e) => setError(toUserFacingError(e, "Failed")))
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    if (!settings) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = (await res.json()) as { error?: string; settings?: Settings };
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      if (data.settings) setSettings(data.settings);
      setSaved(true);
      router.refresh();
    } catch (e) {
      setError(toUserFacingError(e, "Save failed"));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-foreground/55">Loading settings…</p>;
  }
  if (!settings) {
    return <p className="text-sm text-red-600">{error ?? "Unavailable"}</p>;
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-foreground/55">
          Login tutorial video URL
        </label>
        <input
          type="url"
          value={settings.loginTutorialVideoUrl}
          onChange={(e) =>
            setSettings({ ...settings, loginTutorialVideoUrl: e.target.value })
          }
          placeholder="https://www.youtube.com/watch?v=… or .mp4 URL"
          className="mt-2 w-full rounded-lg border border-primary/25 bg-background/40 px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-foreground/50">
          Shown on the login page — how to use the app &amp; features (not how to
          log in).
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-foreground/55">
          Feature kill switches
        </p>
        {(
          [
            ["featureBrandEnabled", "Brand / festival"],
            ["featureCustomPromptEnabled", "Custom prompt"],
            ["featureThemesEnabled", "Saved themes"],
            ["featureSelfieEnabled", "Selfie try-on"],
            ["featureVideoEnabled", "Video generation"],
            ["featurePublicShareEnabled", "Public share links"],
            ["smsEnabled", "MSG91 SMS"],
          ] as const
        ).map(([key, label]) => (
          <label
            key={key}
            className="flex items-center gap-2 text-sm text-foreground/80"
          >
            <input
              type="checkbox"
              checked={settings[key]}
              onChange={(e) =>
                setSettings({ ...settings, [key]: e.target.checked })
              }
            />
            {label}
          </label>
        ))}
      </div>

      <button
        type="button"
        disabled={saving}
        onClick={() => void save()}
        className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-background disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save settings"}
      </button>
      {saved ? (
        <p className="text-sm text-emerald-700">Saved.</p>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
