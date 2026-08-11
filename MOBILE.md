# Mobile app path — Jewel Studio

## Phase A: PWA (included)

The web app ships a [Web App Manifest](app/manifest.ts). Users can **Add to Home Screen** on Android/iOS for an app-like shell.

1. Deploy over **HTTPS** (required for PWA + OTP + Razorpay).
2. Add PNG icons at `public/icons/icon-192.png` and `public/icons/icon-512.png` (jewelry/brand mark).
3. Optional: add a service worker later for offline shell caching.

## Phase B: Capacitor (App Store / Play Store)

Wrap the hosted site in a native shell without rewriting the UI.

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npx cap init "Jewel Studio" com.jewelstudio.app --web-dir .next
```

Recommended approach for Next.js:

1. Deploy the Next.js app to Vercel (or your server) at e.g. `https://studio.yourdomain.com`.
2. Configure Capacitor to load that URL:

```typescript
// capacitor.config.ts
import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.jewelstudio.app",
  appName: "Jewel Studio",
  server: {
    url: "https://studio.yourdomain.com",
    cleartext: false,
  },
};

export default config;
```

3. Add platforms and open IDE:

```bash
npx cap add android
npx cap add ios
npx cap open android
npx cap open ios
```

4. Store checklist: app icons, splash screens, privacy policy URL, Razorpay + OTP flows tested in WebView, account deletion policy.

## Phase C: Native rewrite (later)

Only if you need deep native camera/gallery integration beyond the browser — React Native or Flutter calling the same `/api/*` backend.
