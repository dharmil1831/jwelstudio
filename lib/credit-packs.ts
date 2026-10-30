export type CreditPack = {
  id: string;
  label: string;
  /** India price in paise. */
  amountPaise: number;
  /** Price outside India, in US cents. Paddle cannot sell a pack under $10. */
  amountCents: number;
  credits: number;
};

const USD_CENTS: Record<string, number> = {
  silver: 1500,
  gold: 3500,
  platinum: 6500,
  diamond: 11900,
};

function withUsd(pack: Omit<CreditPack, "amountCents"> & { amountCents?: number }): CreditPack {
  return {
    ...pack,
    amountCents: pack.amountCents ?? USD_CENTS[pack.id] ?? 0,
  };
}

export function getCreditPacks(): CreditPack[] {
  return [
    { id: "silver", label: "Silver", amountPaise: 119900, amountCents: 1500, credits: 20 },
    { id: "gold", label: "Gold", amountPaise: 279900, amountCents: 3500, credits: 50 },
    { id: "platinum", label: "Platinum", amountPaise: 549900, amountCents: 6500, credits: 100 },
    { id: "diamond", label: "Diamond", amountPaise: 999900, amountCents: 11900, credits: 200 },
  ].map(withUsd);
}
