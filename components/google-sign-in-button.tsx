"use client";

import { Capacitor } from "@capacitor/core";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const subscribeNever = () => () => {};

const WEB_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "";
const GIS_SRC = "https://accounts.google.com/gsi/client";

type TokenClient = {
  requestAccessToken: (override?: { prompt?: "select_account" }) => void;
};

type TokenResponse = {
  access_token?: string;
  id_token?: string;
  error?: string;
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (opts: {
            client_id: string;
            scope: string;
            callback: (res: TokenResponse) => void;
            error_callback?: (err: { type?: string }) => void;
          }) => TokenClient;
        };
      };
    };
  }
}

export function googleSignInAvailable(): boolean {
  return WEB_CLIENT_ID.length > 0;
}

type Oauth2Api = NonNullable<
  NonNullable<NonNullable<Window["google"]>["accounts"]>["oauth2"]
>;

let gisLoading: Promise<Oauth2Api> | null = null;

function loadGis(): Promise<Oauth2Api> {
  const ready = window.google?.accounts?.oauth2;
  if (ready) return Promise.resolve(ready);
  if (gisLoading) return gisLoading;
  gisLoading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.onload = () => {
      const api = window.google?.accounts?.oauth2;
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

async function exchangeGoogle(body: { idToken?: string; accessToken?: string }): Promise<void> {
  const res = await fetch("/api/auth/google", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
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

function googleFailure(type?: string): string | null {
  if (type === "popup_closed" || type === "popup_failed_to_open") return null;
  return "Google sign-in was cancelled.";
}

function googlePopupFeatures(): string {
  const width = 480;
  const height = 640;
  const left = Math.max(0, Math.round((window.screen.width - width) / 2));
  const top = Math.max(0, Math.round((window.screen.height - height) / 2));
  return [
    "toolbar=no",
    "location=no",
    "status=no",
    "menubar=no",
    "scrollbars=yes",
    "resizable=yes",
    `width=${width}`,
    `height=${height}`,
    `left=${left}`,
    `top=${top}`,
  ].join(",");
}

/** Read Google's sign-in address while keeping its reply listener on this page. */
function captureGoogleUrl(client: TokenClient): string | null {
  let url: string | null = null;
  const original = window.open;
  const hold = { closed: false, focus() {}, close() {} } as Window;
  window.open = ((next?: string | URL) => {
    const value =
      typeof next === "string" ? next : next instanceof URL ? next.href : String(next ?? "");
    if (value.startsWith("https://accounts.google.com/")) url = value;
    return hold;
  }) as typeof window.open;
  try {
    client.requestAccessToken({ prompt: "select_account" });
  } finally {
    window.open = original;
  }
  return url;
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
 * Continue with Google. Native Android uses Credential Manager. Browsers open
 * Google's own sign-in window.
 */
export function GoogleSignInButton({
  onSignedIn,
  onError,
}: {
  onSignedIn: () => void;
  onError: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const native = useSyncExternalStore(
    subscribeNever,
    () => Capacitor.isNativePlatform(),
    () => false,
  );
  const clientRef = useRef<TokenClient | null>(null);
  const settledRef = useRef(false);
  const waitRef = useRef<number | null>(null);
  const handlers = useRef({ onSignedIn, onError });

  useEffect(() => {
    handlers.current = { onSignedIn, onError };
  }, [onSignedIn, onError]);

  useEffect(() => {
    return () => {
      if (waitRef.current) window.clearTimeout(waitRef.current);
    };
  }, []);

  useEffect(() => {
    if (native || !WEB_CLIENT_ID) return;
    let cancelled = false;
    void loadGis()
      .then((api) => {
        if (cancelled || !api) return;
        clientRef.current = api.initTokenClient({
          client_id: WEB_CLIENT_ID,
          scope: "openid email profile",
          callback: (res) => {
            if (settledRef.current) return;
            if (!res.access_token && !res.id_token) {
              const message = googleFailure(res.error);
              if (message) handlers.current.onError(message);
              setBusy(false);
              return;
            }
            settledRef.current = true;
            if (waitRef.current) window.clearTimeout(waitRef.current);
            exchangeGoogle({
              accessToken: res.access_token,
              idToken: res.id_token,
            })
              .then(() => handlers.current.onSignedIn())
              .catch((e: unknown) =>
                handlers.current.onError(
                  e instanceof Error ? e.message : "Google sign-in failed.",
                ),
              )
              .finally(() => setBusy(false));
          },
          error_callback: (err) => {
            if (err.type === "popup_closed" || err.type === "popup_failed_to_open") return;
            const message = googleFailure(err.type);
            if (message) handlers.current.onError(message);
            setBusy(false);
          },
        });
        setReady(true);
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

  useEffect(() => {
    if (native) return;
    function onMessage(event: MessageEvent) {
      if (settledRef.current || event.origin !== "https://accounts.google.com") return;
      let payload: unknown = event.data;
      if (typeof payload === "string") {
        try {
          payload = JSON.parse(payload);
        } catch {
          return;
        }
      }
      if (!payload || typeof payload !== "object") return;
      const params = (payload as { params?: { authResult?: TokenResponse } }).params;
      const result = params?.authResult;
      if (!result?.access_token && !result?.id_token) return;
      settledRef.current = true;
      if (waitRef.current) window.clearTimeout(waitRef.current);
      setBusy(true);
      exchangeGoogle({ accessToken: result.access_token, idToken: result.id_token })
        .then(() => handlers.current.onSignedIn())
        .catch((e: unknown) =>
          handlers.current.onError(e instanceof Error ? e.message : "Google sign-in failed."),
        )
        .finally(() => setBusy(false));
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [native]);

  if (!WEB_CLIENT_ID) return null;

  if (!native) {
    return (
      <a
        href="#google-sign-in"
        target="_blank"
        rel="opener"
        aria-disabled={!ready || undefined}
        onClick={(event) => {
          if (!ready || !clientRef.current) {
            event.preventDefault();
            return;
          }
          const url = captureGoogleUrl(clientRef.current);
          if (!url) {
            event.preventDefault();
            onError("Google sign-in didn't start. Try again.");
            return;
          }
          settledRef.current = false;
          const popup = window.open(url, `jwelpixel_google_${Date.now()}`, googlePopupFeatures());
          const link = event.currentTarget;
          if (popup && popup.closed !== true) {
            event.preventDefault();
            popup.focus();
          } else {
            link.href = url;
            link.target = "_blank";
            link.rel = "opener";
          }
          if (waitRef.current) window.clearTimeout(waitRef.current);
          waitRef.current = window.setTimeout(() => {
            if (!settledRef.current) setBusy(false);
          }, 180_000);
          window.setTimeout(() => setBusy(true), 0);
        }}
        className="flex h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-full border border-[#d9cfe8] bg-white text-[15px] font-semibold text-[#2a2140] no-underline shadow-sm transition active:scale-[0.99] aria-disabled:pointer-events-none aria-disabled:opacity-60"
      >
        {busy ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#d9cfe8] border-t-[#7c5cbf]" />
        ) : (
          <GoogleMark />
        )}
        {busy ? "Signing in…" : "Continue with Google"}
      </a>
    );
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => {
        setBusy(true);
        nativeGoogleIdToken()
          .then((idToken) => exchangeGoogle({ idToken }))
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
