import { AppError } from "../../shared/errors/AppError";
import { appointmentRepository } from "./appointment.repository";

// Orario di lavoro di default, usato finche' non e' configurabile per company
// (nella spec e' un dato per azienda: da spostare su Company quando serve
// davvero differenziarlo, per l'MVP un default fisso e' sufficiente).
const WORK_HOURS = { startHour: 8, endHour: 18 };

function isWithinWorkingHours(date: Date, durataMin: number): boolean {
  const start = date.getHours() + date.getMinutes() / 60;
  const end = start + durataMin / 60;
  const day = date.getDay(); // 0 = domenica
  if (day === 0) return false;
  return start >= WORK_HOURS.startHour && end <= WORK_HOURS.endHour;
}

export const appointmentService = {
  list: (companyId: string, from?: Date, to?: Date) => appointmentRepository.list(companyId, from, to),

  async create(companyId: string, input: { clientId: string; titolo: string; dataOra: Date; durataMin: number; note?: string }) {
    if (!isWithinWorkingHours(input.dataOra, input.durataMin)) {
      throw AppError.validation("L'orario richiesto e' fuori dagli orari di lavoro configurati");
    }

    const end = new Date(input.dataOra.getTime() + input.durataMin * 60 * 1000);
    const overlap = await appointmentRepository.findOverlapping(companyId, input.dataOra, end);
    if (overlap) {
      throw AppError.conflict("Esiste gia' un appuntamento in quello slot orario");
    }

    return appointmentRepository.create(companyId, input);
  },

  async updateStatus(companyId: string, id: string, stato: string) {
    const result = await appointmentRepository.updateStatus(companyId, id, stato);
    if (result.count === 0) throw AppError.notFound("Appuntamento non trovato");
  },
};
