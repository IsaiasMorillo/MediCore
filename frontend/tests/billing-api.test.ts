import { afterEach, describe, expect, it, vi } from "vitest"

import { apiRequest } from "@/lib/api/client"
import {
  cancelInvoice,
  createInvoice,
  getInvoice,
  getPatientInvoices,
  payInvoice,
} from "@/features/billing/api/billing-api"
import type { CreateInvoiceInput } from "@/features/billing/types"

vi.mock("@/lib/api/client", () => ({
  apiRequest: vi.fn(),
}))

const apiRequestMock = vi.mocked(apiRequest)

afterEach(() => {
  vi.clearAllMocks()
})

describe("billing api", () => {
  it("uses invoice detail and patient routes", async () => {
    apiRequestMock.mockResolvedValue([])

    await getInvoice("invoice/1")
    await getPatientInvoices("patient/1")

    expect(apiRequestMock).toHaveBeenNthCalledWith(1, "/api/invoices/invoice%2F1")
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, "/api/invoices/patient/patient%2F1")
  })

  it("matches invoice creation, payment and cancellation commands", async () => {
    const input: CreateInvoiceInput = {
      createdBy: "Recepción Turno A",
      items: [{ appointmentId: "appointment-1", description: "Consulta general", laboratoryOrderId: null, prescriptionId: null, quantity: 1, type: "Consulta", unitPrice: 850 }],
      patientId: "patient-1",
    }
    apiRequestMock.mockResolvedValue(undefined)

    await createInvoice(input)
    await payInvoice({ amount: 500, id: "invoice/1", method: "Transferencia", paidBy: "Recepción Turno A" })
    await cancelInvoice({ cancelledBy: "Recepción Turno A", id: "invoice/1", reason: "Duplicada" })

    expect(apiRequestMock).toHaveBeenNthCalledWith(1, "/api/invoices", { body: JSON.stringify(input), method: "POST" })
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, "/api/invoices/invoice%2F1/pay", { body: JSON.stringify({ amount: 500, method: "Transferencia", paidBy: "Recepción Turno A" }), method: "POST" })
    expect(apiRequestMock).toHaveBeenNthCalledWith(3, "/api/invoices/invoice%2F1/cancel", { body: JSON.stringify({ cancelledBy: "Recepción Turno A", reason: "Duplicada" }), method: "POST" })
  })
})
