import { beforeEach, describe, expect, it, vi } from "vitest";

const repository = { create: vi.fn(), listByCompany: vi.fn(), updateStage: vi.fn(), countByStage: vi.fn() };
const clients = { findById: vi.fn() };
vi.mock("./lead.repository", () => ({ leadRepository: repository }));
vi.mock("../clients/client.repository", () => ({ clientRepository: clients }));

import { leadService } from "./lead.service";

describe("lead tenant boundaries", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does not create a lead for a client outside the authenticated company", async () => {
    clients.findById.mockResolvedValue(null);
    await expect(leadService.create("company-A", "client-from-B")).rejects.toMatchObject({ statusCode: 404 });
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("creates a lead only after confirming client ownership", async () => {
    clients.findById.mockResolvedValue({ id: "client-A", companyId: "company-A" });
    repository.create.mockResolvedValue({ id: "lead-A" });
    await expect(leadService.create("company-A", "client-A")).resolves.toEqual({ id: "lead-A" });
    expect(repository.create).toHaveBeenCalledWith("company-A", "client-A", undefined, undefined);
  });
});
