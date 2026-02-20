import type { RateGuide } from "@/types";

/** Find rate guide entry matching tenor (days) and investment amount. */
export function findMatchingRateGuide(
  guides: RateGuide[],
  tenorDays: number,
  amount: number
): RateGuide | null {
  if (!guides?.length || tenorDays <= 0 || amount <= 0) return null;
  const numAmount = Number(amount);
  return (
    guides.find(
      (g) =>
        Number(g.tenor) === tenorDays &&
        numAmount >= Number(g.minimumAmount) &&
        numAmount <= Number(g.maximumAmount)
    ) ?? null
  );
}
