import { describe, expect, it } from "vitest";
import { generateRandomToken, hashPassword, hashToken, verifyPassword } from "./password";

describe("password and token primitives", () => {
  it("hashes and verifies a password without storing plaintext", async () => {
    const hash = await hashPassword("a-long-test-password");
    expect(hash).not.toBe("a-long-test-password");
    expect(await verifyPassword("a-long-test-password", hash)).toBe(true);
    expect(await verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("creates high-entropy random tokens and deterministic hashes", () => {
    const a = generateRandomToken();
    const b = generateRandomToken();
    expect(a).toHaveLength(64);
    expect(a).not.toBe(b);
    expect(hashToken(a)).toHaveLength(64);
    expect(hashToken(a)).toBe(hashToken(a));
    expect(hashToken(a)).not.toBe(a);
  });
});
