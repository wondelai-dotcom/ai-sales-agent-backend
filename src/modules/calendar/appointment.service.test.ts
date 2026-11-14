import { beforeEach, describe, expect, it, vi } from "vitest";

const repository = { list: vi.fn(), findOverlapping: vi.fn(), create: vi.fn(), updateStatus: vi.fn() };
const clients = { findById: vi.fn() };
vi.mock("./appointment.repository", () => ({ appointmentRepository: repository }));
vi.mock("../crm/clients/client.repository", () => ({ clientRepository: clients }));

import { appointmentService } from "./appointment.service";

describe("appointment tenant boundaries", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects appointments for clients outside the authenticated company", async () => {
    clients.findById.mockResolvedValue(null);
    await expect(appointmentService.create("company-A", {
      clientId: "client-B", titolo: "Intervento", dataOra: new Date(Date.now() + 86400000), durataMin: 60,
    })).rejects.toMatchObject({ statusCode: 404 });
    expect(repository.create).not.toHaveBeenCalled();
  });
});
