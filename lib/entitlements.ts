/** Plan-based feature gates. Server must enforce — never trust the client alone. */

export const PLAN_IDS = [
  "free",
  "silver",
  "gold",
  "platinum",
  "diamond",
] as const;

export type PlanId = (typeof PLAN_IDS)[number];

export const PAID_PLAN_IDS = [
  "silver",
  "gold",
  "platinum",
  "diamond",
] as const;

export type PaidPlanId = (typeof PAID_PLAN_IDS)[number];

export const FEATURES = [
  "modelBackground",
  "expandedStyles",
  "socialFormats",
  "shareLinks",
  "customPrompt",
  "brandOverlay",
  "themes",
  "selfieTryOn",
  "videoGeneration",
] as const;

export type FeatureId = (typeof FEATURES)[number];

const PLAN_RANK: Record<PlanId, number> = {
  free: 0,
  silver: 1,
  gold: 2,
  platinum: 3,
  diamond: 4,
};

/** Minimum plan required for each feature. */
const FEATURE_MIN_PLAN: Record<FeatureId, PlanId> = {
  modelBackground: "free",
  expandedStyles: "free",
  socialFormats: "free",
  shareLinks: "free",
  customPrompt: "gold",
  brandOverlay: "gold",
  themes: "platinum",
  selfieTryOn: "platinum",
  videoGeneration: "diamond",
};

export function normalizePlanId(raw: unknown): PlanId {
  if (typeof raw !== "string") return "free";
  const id = raw.trim().toLowerCase();
  if ((PLAN_IDS as readonly string[]).includes(id)) return id as PlanId;
  // Legacy pack ids → nearest plan
  if (id === "starter") return "silver";
  if (id === "pro") return "gold";
  if (id === "studio") return "platinum";
  return "free";
}

export function isPaidPlanId(raw: string): raw is PaidPlanId {
  return (PAID_PLAN_IDS as readonly string[]).includes(raw);
}

export function planRank(plan: PlanId): number {
  return PLAN_RANK[plan] ?? 0;
}

/** Keep the higher of current vs newly purchased plan. */
export function higherPlan(a: PlanId, b: PlanId): PlanId {
  return planRank(a) >= planRank(b) ? a : b;
}

export function canUseFeature(plan: PlanId, feature: FeatureId): boolean {
  const min = FEATURE_MIN_PLAN[feature];
  return planRank(plan) >= planRank(min);
}

export function featuresForPlan(plan: PlanId): Record<FeatureId, boolean> {
  const out = {} as Record<FeatureId, boolean>;
  for (const f of FEATURES) {
    out[f] = canUseFeature(plan, f);
  }
  return out;
}

export function minPlanForFeature(feature: FeatureId): PlanId {
  return FEATURE_MIN_PLAN[feature];
}

export const PLAN_LABELS: Record<PlanId, string> = {
  free: "Free",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
  diamond: "Diamond",
};

/** Feature bullets for pricing page (paid packs). */
export const PLAN_FEATURE_BULLETS: Record<PaidPlanId, string[]> = {
  silver: [
    "Model shot & background modes",
    "WhatsApp & Instagram formats",
    "Download-ready exports",
    "Expanded model & scene options",
  ],
  gold: [
    "Everything in Silver",
    "Custom prompt (free-text)",
    "Brand name, logo, watermark & grams",
    "Festival marketing presets",
  ],
  platinum: [
    "Everything in Gold",
    "Saved themes (reuse look, new jewelry)",
    "Selfie / own-model try-on",
  ],
  diamond: [
    "Everything in Platinum",
    "AI video generation",
    "Highest limits & full feature set",
  ],
};
