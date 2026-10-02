# Mobile app path — Jwelpixel

## Phase A: PWA (included)

The web app ships a [Web App Manifest](app/manifest.ts). Users can **Add to Home Screen** on Android/iOS for an app-like shell.

1. Deploy over **HTTPS** (required for PWA + OTP + Razorpay).
2. Add PNG icons at `public/icons/icon-192.png` and `public/icons/icon-512.png` (jewelry/brand mark).
3. Optional: add a service worker later for offline shell caching.

## Phase B: Capacitor (debug APK / Play Store)

The Android shell loads the **hosted** Next.js site (not a static export):

- App id: `com.jwelpixel.app`
- Config: [`capacitor.config.ts`](capacitor.config.ts)
- Live URL (current): `https://jwelstudio.vercel.app`

### One-time setup

```bash
npm install
npx cap add android   # already done if android/ exists
```

### Build a debug APK (Windows)

Requires **JDK 21** and Android SDK.

```powershell
$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-21.0.12.101-hotspot"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
npx cap sync android
cd android
.\gradlew.bat assembleDebug
```

APK output:

`android/app/build/outputs/apk/debug/app-debug.apk`

Install on a phone (USB debugging) or share the APK for sideload testing.

### Point at a custom domain later

Update `server.url` in `capacitor.config.ts` to `https://jwelpixel.com` (or your test domain), then:

```bash
npx cap sync android
cd android
.\gradlew.bat assembleDebug
```

### Store checklist

App icons, splash screens, privacy policy URL, Razorpay + OTP flows tested in WebView, account deletion policy.

## Phase C: Native rewrite (later)

Only if you need deep native camera/gallery integration beyond the browser — React Native or Flutter calling the same `/api/*` backend.
