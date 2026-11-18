export type ClientSession = {
  authenticated?: boolean;
  isAdmin?: boolean;
  credits?: number;
  plan?: string;
  generationConfigured?: boolean;
  user?: { email?: string | null; phone?: string | null; plan?: string };
  features?: {
    customPrompt?: boolean;
    brandOverlay?: boolean;
    themes?: boolean;
    selfieTryOn?: boolean;
    videoGeneration?: boolean;
    modelTemplates?: boolean;
  };
};

let inflight: Promise<ClientSession> | null = null;

export function fetchClientSession(): Promise<ClientSession> {
  if (!inflight) {
    inflight = fetch("/api/session", {
      credentials: "same-origin",
      cache: "no-store",
    })
      .then(async (response) => {
        const data = (await response.json()) as ClientSession;
        if (!response.ok) throw new Error("session failed");
        return data;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}
