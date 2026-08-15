import { describe, expect, it } from "vitest";
import { isoDate, periodWindow } from "./period";

describe("periodWindow", () => {
  it("returns the UTC month for monthly", () => {
    const at = new Date("2026-08-14T12:00:00.000Z");
    const { from, to } = periodWindow("monthly", at);
    expect(isoDate(from)).toBe("2026-08-01");
    expect(isoDate(to)).toBe("2026-08-31");
  });

  it("returns Monday–Sunday for weekly", () => {
    const at = new Date("2026-08-14T12:00:00.000Z"); // Friday
    const { from, to } = periodWindow("weekly", at);
    expect(isoDate(from)).toBe("2026-08-10");
    expect(isoDate(to)).toBe("2026-08-16");
  });
});
