export const SELFIE_CONSENT_STORAGE_KEY = "jwelpixel-selfie-consent-v1";

export const SELFIE_DISCLAIMER =
  "Selfie try-on uses a photo of a real person as the model. Only upload a selfie you own or have clear permission to use. Do not upload someone else’s photo without consent. Generated results may resemble the person in the photo.";

export const SELFIE_CONSENT_LABEL =
  "I agree that I am uploading my own image (or an image I have permission to use), I consent to it being used to generate jewelry try-on results for my account, and I am responsible for that upload and how results are used.";

export const SELFIE_CONSENT_REQUIRED_MESSAGE =
  "Please accept the selfie disclaimer before uploading or generating with a selfie.";

export function readSelfieConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(SELFIE_CONSENT_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeSelfieConsent(accepted: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (accepted) window.localStorage.setItem(SELFIE_CONSENT_STORAGE_KEY, "1");
    else window.localStorage.removeItem(SELFIE_CONSENT_STORAGE_KEY);
  } catch {
    /* ignore quota / private mode */
  }
}
