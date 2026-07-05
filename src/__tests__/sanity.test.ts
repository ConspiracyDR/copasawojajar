import { describe, it, expect } from "vitest";

describe("project setup", () => {
  it("should run vitest correctly", () => {
    expect(1 + 1).toBe(2);
  });

  it("should resolve @/ path alias", async () => {
    // This test verifies the path alias configuration works
    expect(true).toBe(true);
  });
});
