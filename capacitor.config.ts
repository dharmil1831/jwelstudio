import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Native shell loads the live Next.js site (not a static export).
 * Debug APK → production Vercel until jwelpixel.com is attached.
 */
const config: CapacitorConfig = {
  appId: "com.jwelpixel.app",
  appName: "Jwelpixel",
  webDir: "www",
  server: {
    url: "https://jwel-pixel.vercel.app",
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
