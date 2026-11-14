import { beforeEach, describe, expect, it, vi } from "vitest";

const repository = { list: vi.fn(), countForCompany: vi.fn(), create: vi.fn(), updateStatus: vi.fn(), findById: vi.fn() };
const clients = { findById: vi.fn() };
vi.mock("./quote.repository", () => ({ quoteRepository: repository }));
vi.mock("../crm/clients/client.repository", () => ({ clientRepository: clients }));
vi.mock("./quote.pdf", () => ({ generateQuotePdf: vi.fn() }));

import { quoteService } from "./quote.service";

describe("quote tenant boundaries", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects a quote whose client belongs to a different company", async () => {
    clients.findById.mockResolvedValue(null);
    await expect(quoteService.create("company-A", {
      clientId: "client-B", items: [{ descrizione: "Test", quantita: 1, prezzoUnitario: 10 }], taxRate: 22,
    })).rejects.toMatchObject({ statusCode: 404 });
    expect(repository.create).not.toHaveBeenCalled();
  });
});
