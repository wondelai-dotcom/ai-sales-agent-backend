import { describe, expect, it, vi } from "vitest";
import { asyncHandler } from "./asyncHandler";

describe("asyncHandler", () => {
  it("forwards rejected async handlers to Express next", async () => {
    const error = new Error("expected");
    const next = vi.fn();
    const handler = asyncHandler(async () => { throw error; });
    handler({} as never, {} as never, next);
    await new Promise((resolve) => setImmediate(resolve));
    expect(next).toHaveBeenCalledWith(error);
  });
});
