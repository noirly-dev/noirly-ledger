import { describe, expect, it } from "vitest";
import {
  convertToBaseMinor,
  formatMinorToMajor,
  formatScaledRate,
  parseMajorToMinor,
  parseRateToScaled,
} from "./index";

describe("money", () => {
  it("parses major units to minor", () => {
    expect(parseMajorToMinor("12.34")).toBe(1234);
    expect(parseMajorToMinor("-0.50")).toBe(-50);
  });

  it("formats minor units to major", () => {
    expect(formatMinorToMajor(1234)).toBe("12.34");
    expect(formatMinorToMajor(-50)).toBe("-0.50");
  });

  it("converts with scaled FX rates", () => {
    const rate = 110_000_000;
    expect(convertToBaseMinor(100, rate)).toBe(110);
  });

  it("parses and formats scaled FX rates", () => {
    expect(parseRateToScaled("1.10")).toBe(110_000_000);
    expect(formatScaledRate(110_000_000)).toBe("1.1");
  });
});
