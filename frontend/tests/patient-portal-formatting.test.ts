import { describe, expect, it } from "vitest"

import { countPendingPortalInvoices, formatPortalAppointmentTimeRange, getPortalFirstName } from "@/features/patient-portal/utils/patient-portal-formatting"

describe("patient portal formatting", () => {
  it("gets a concise greeting name", () => {
    expect(getPortalFirstName("  Ana María Paciente ")).toBe("Ana")
    expect(getPortalFirstName(" ")).toBe("paciente")
  })

  it("formats the appointment time range from the UTC API values", () => {
    expect(formatPortalAppointmentTimeRange({ endDateTime: "2026-09-08T10:45:00.000Z", startDateTime: "2026-09-08T10:00:00.000Z" })).toBe("10:00 - 10:45")
  })

  it("counts only pending invoices with a balance", () => {
    expect(countPendingPortalInvoices([
      createInvoice("Pendiente", 300),
      createInvoice("Pendiente", 0),
      createInvoice("Pagada", 0),
    ])).toBe(1)
  })
})

function createInvoice(status: string, balance: number) {
  return { balance, status } as never
}
