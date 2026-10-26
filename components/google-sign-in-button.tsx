"use client";

import { Capacitor } from "@capacitor/core";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const subscribeNever = () => () => {};

const WEB_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "";
const GIS_SRC = "https://accounts.google.com/gsi/client";

type GoogleIdApi = {
  initialize: (opts: {
    client_id: string;
    callback: (res: { credential?: string }) => void;
    ux_mode?: "popup";
    use_fedcm_for_prompt?: boolean;
  }) => void;
  renderButton: (
    el: HTMLElement,
    opts: Record<string, string | number>,
  ) => void;
};

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleIdApi } };
  }
}

export function googleSignInAvailable(): boolean {
  return WEB_CLIENT_ID.length > 0;
}

let gisLoading: Promise<GoogleIdApi> | null = null;

function loadGis(): Promise<GoogleIdApi> {
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id);
  if (gisLoading) return gisLoading;
  gisLoading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.onload = () => {
      const api = window.google?.accounts?.id;
      if (api) resolve(api);
      else reject(new Error("Google sign-in did not load."));
    };
    script.onerror = () => {
      gisLoading = null;
      reject(new Error("Google sign-in did not load."));
    };
    document.head.appendChild(script);
  });
  return gisLoading;
}

async function exchangeIdToken(idToken: string): Promise<void> {
  const res = await fetch("/api/auth/google", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new Error(data.error || "Google sign-in failed.");
}

let nativeReady: Promise<void> | null = null;

async function nativeGoogleIdToken(): Promise<string> {
  const { SocialLogin } = await import("@capgo/capacitor-social-login");
  nativeReady ??= SocialLogin.initialize({
    google: { webClientId: WEB_CLIENT_ID, mode: "online" },
  });
  await nativeReady;
  const res = await SocialLogin.login({ provider: "google", options: {} });
  const result = res.result as { idToken?: string | null };
  if (!result.idToken) throw new Error("Google did not return a sign-in token.");
  return result.idToken;
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

/**
 * Continue with Google. Native Android uses Credential Manager (Google blocks OAuth
 * inside WebViews); browsers use Google Identity Services. Both yield an ID token.
 */
export function GoogleSignInButton({
  onSignedIn,
  onError,
}: {
  onSignedIn: () => void;
  onError: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const native = useSyncExternalStore(
    subscribeNever,
    () => Capacitor.isNativePlatform(),
    () => false,
  );
  const gisSlot = useRef<HTMLDivElement>(null);
  const handlers = useRef({ onSignedIn, onError });

  useEffect(() => {
    handlers.current = { onSignedIn, onError };
  }, [onSignedIn, onError]);

  useEffect(() => {
    if (native || !WEB_CLIENT_ID || !gisSlot.current) return;
    let cancelled = false;
    void loadGis()
      .then((api) => {
        if (cancelled || !gisSlot.current) return;
        api.initialize({
          client_id: WEB_CLIENT_ID,
          ux_mode: "popup",
          callback: (res) => {
            if (!res.credential) {
              handlers.current.onError("Google sign-in was cancelled.");
              return;
            }
            setBusy(true);
            exchangeIdToken(res.credential)
              .then(() => handlers.current.onSignedIn())
              .catch((e: unknown) =>
                handlers.current.onError(
                  e instanceof Error ? e.message : "Google sign-in failed.",
                ),
              )
              .finally(() => setBusy(false));
          },
        });
        const width = Math.min(400, gisSlot.current.clientWidth || 320);
        api.renderButton(gisSlot.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "pill",
          text: "continue_with",
          width,
        });
      })
      .catch((e: unknown) =>
        handlers.current.onError(
          e instanceof Error ? e.message : "Google sign-in did not load.",
        ),
      );
    return () => {
      cancelled = true;
    };
  }, [native]);

  if (!WEB_CLIENT_ID) return null;

  if (!native) {
    return (
      <div className="relative min-h-[44px] w-full">
        <div
          ref={gisSlot}
          className={`flex w-full justify-center ${busy ? "invisible" : ""}`}
        />
        {busy ? (
          <div
            role="status"
            className="absolute inset-0 flex items-center justify-center gap-3 rounded-full border border-[#d9cfe8] bg-white text-[15px] font-semibold text-[#2a2140]"
          >
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#d9cfe8] border-t-[#7c5cbf]" />
            Signing in…
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => {
        setBusy(true);
        nativeGoogleIdToken()
          .then(exchangeIdToken)
          .then(() => onSignedIn())
          .catch((e: unknown) => {
            const message = e instanceof Error ? e.message : "";
            if (/cancel/i.test(message)) return;
            if (/not implemented/i.test(message)) {
              onError("Please update the Jwelpixel app to sign in with Google.");
              return;
            }
            onError(message || "Google sign-in failed.");
          })
          .finally(() => setBusy(false));
      }}
      className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-[#d9cfe8] bg-white text-[15px] font-semibold text-[#2a2140] shadow-sm transition active:scale-[0.99] disabled:opacity-60"
    >
      {busy ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#d9cfe8] border-t-[#7c5cbf]" />
      ) : (
        <GoogleMark />
      )}
      {busy ? "Signing in…" : "Continue with Google"}
    </button>
  );
}
