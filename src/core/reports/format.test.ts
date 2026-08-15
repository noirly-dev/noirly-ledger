import { describe, expect, it } from "vitest";
import { crossedThreshold, csvEscape, csvLine } from "./format";

describe("crossedThreshold", () => {
  it("fires once when spend crosses the alert line", () => {
    expect(
      crossedThreshold({
        previousSpentMinor: 7900,
        nextSpentMinor: 8100,
        limitAmountMinor: 10_000,
        alertThresholdPct: 80,
      }),
    ).toBe(true);
    expect(
      crossedThreshold({
        previousSpentMinor: 8100,
        nextSpentMinor: 9000,
        limitAmountMinor: 10_000,
        alertThresholdPct: 80,
      }),
    ).toBe(false);
  });
});

describe("csvEscape", () => {
  it("quotes commas and doubles quotes", () => {
    expect(csvEscape("Lunch, cafe")).toBe('"Lunch, cafe"');
    expect(csvEscape('He said "hi"')).toBe('"He said ""hi"""');
    expect(csvLine(["2026-01-01", "expense", 12.5])).toBe("2026-01-01,expense,12.5");
  });
});
