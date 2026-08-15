export const FX_RATE_SCALE = 100_000_000;

export type MoneyMinor = number;

export type Money = {
  amountMinor: MoneyMinor;
  currency: string;
};

/** Convert a decimal major-unit string (e.g. "12.34") to minor units. */
export function parseMajorToMinor(major: string, fractionDigits = 2): MoneyMinor {
  const normalized = major.trim().replace(/,/g, "");
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) {
    throw new Error("Invalid amount");
  }
  const negative = normalized.startsWith("-");
  const [wholeRaw, fracRaw = ""] = normalized.replace(/^-/, "").split(".");
  const whole = wholeRaw || "0";
  const frac = (fracRaw + "0".repeat(fractionDigits)).slice(0, fractionDigits);
  const minor =
    Number.parseInt(whole, 10) * 10 ** fractionDigits +
    Number.parseInt(frac || "0", 10);
  return negative ? -minor : minor;
}

export function formatMinorToMajor(
  minor: MoneyMinor,
  fractionDigits = 2,
): string {
  const sign = minor < 0 ? "-" : "";
  const abs = Math.abs(minor);
  const whole = Math.floor(abs / 10 ** fractionDigits);
  const frac = String(abs % 10 ** fractionDigits).padStart(fractionDigits, "0");
  return `${sign}${whole}.${frac}`;
}

/**
 * Convert amount in quote currency to base currency minor units.
 * `rateToBaseScaled` is integer fixed-point (1.0 = FX_RATE_SCALE).
 */
export function convertToBaseMinor(
  amountMinor: MoneyMinor,
  rateToBaseScaled: number,
  scale = FX_RATE_SCALE,
): MoneyMinor {
  return Math.round((amountMinor * rateToBaseScaled) / scale);
}

/** Parse a human FX rate like "1.10" (quote → base) into scaled integer. */
export function parseRateToScaled(rate: string, scale = FX_RATE_SCALE): number {
  const normalized = rate.trim();
  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    throw new Error("Invalid rate");
  }
  const [wholeRaw, fracRaw = ""] = normalized.split(".");
  const whole = Number.parseInt(wholeRaw || "0", 10);
  const frac = (fracRaw + "0".repeat(8)).slice(0, 8);
  return whole * scale + Number.parseInt(frac, 10);
}

export function formatScaledRate(scaled: number, scale = FX_RATE_SCALE): string {
  const whole = Math.floor(scaled / scale);
  const frac = String(scaled % scale).padStart(8, "0").replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : String(whole);
}

export const COMMON_CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "INR",
  "AED",
  "JPY",
  "CAD",
  "AUD",
  "SGD",
  "CHF",
] as const;
