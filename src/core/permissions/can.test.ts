import { describe, expect, it } from "vitest";
import { can } from "./can";

describe("permissions", () => {
  it("allows members to submit expenses but not approve", () => {
    expect(can("member", "expense.submit")).toBe(true);
    expect(can("member", "expense.decide")).toBe(false);
  });

  it("allows approvers to decide and manage pools", () => {
    expect(can("approver", "expense.decide")).toBe(true);
    expect(can("approver", "pool.manage")).toBe(true);
    expect(can("approver", "members.manage")).toBe(false);
  });

  it("allows owners full control", () => {
    expect(can("owner", "members.manage")).toBe(true);
    expect(can("owner", "workspace.manage")).toBe(true);
  });
});
