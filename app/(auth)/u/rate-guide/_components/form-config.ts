import type { CreateRateGuidePayload } from "@/types";

export type FormState = CreateRateGuidePayload;

export const EMPTY_FORM: FormState = {
  tenor: 0,
  indicativeRate: 0,
  minimumSpread: 0,
  ethicaRatio: 0,
  customerRatio: 0,
  aboveTargetEthicaRatio: 0,
  aboveTargetCustomerRatio: 0,
  minimumAmount: 0,
  maximumAmount: 0,
};

export interface FieldDef {
  key: keyof FormState;
  label: string;
  suffix?: string;
  hint?: string;
  step?: string;
  isAmount?: boolean;
}

/** Regular fields rendered in the main 2-col grid */
export const FIELDS: FieldDef[] = [
  { key: "tenor",         label: "Tenor",          suffix: "days", hint: "e.g. 30, 60, 90, 180, 365", step: "1" },
  { key: "indicativeRate",label: "Indicative Rate", suffix: "%",    step: "0.0001" },
  { key: "minimumSpread", label: "Minimum Spread",  suffix: "%",    step: "0.0001" },
  { key: "minimumAmount", label: "Minimum Amount",  suffix: "₦",    isAmount: true },
  { key: "maximumAmount", label: "Maximum Amount",  suffix: "₦",    isAmount: true },
];

/**
 * Paired ratio fields — each tuple must sum to 100%.
 * The first field in each pair is the "primary" (user types here),
 * and the second is auto-derived as 100 - primary. Both remain editable
 * and update each other bidirectionally.
 */
export const RATIO_PAIRS: [FieldDef, FieldDef][] = [
  [
    { key: "ethicaRatio",    label: "Ethica Ratio",    suffix: "%" },
    { key: "customerRatio",  label: "Customer Ratio",  suffix: "%" },
  ],
  [
    { key: "aboveTargetEthicaRatio",    label: "AT Ethica Ratio",    suffix: "%", hint: "Above-target" },
    { key: "aboveTargetCustomerRatio",  label: "AT Customer Ratio",  suffix: "%", hint: "Above-target" },
  ],
];

/** Reverse-lookup: given a key, which key is it paired with? */
export const RATIO_LINKED: Partial<Record<keyof FormState, keyof FormState>> = {
  ethicaRatio:               "customerRatio",
  customerRatio:             "ethicaRatio",
  aboveTargetEthicaRatio:    "aboveTargetCustomerRatio",
  aboveTargetCustomerRatio:  "aboveTargetEthicaRatio",
};
