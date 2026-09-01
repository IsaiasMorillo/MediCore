import { describe, expect, it } from "vitest"

import type { Invoice } from "@/features/billing/types"
import {
  calculateInvoicePreview,
  formatInvoiceStatus,
  normalizeCoverageType,
  sortInvoices,
} from "@/features/billing/utils/billing-formatting"
import type { Patient } from "@/features/patients/types"

const patient: Patient = {
  clinicalHistory: { allergies: [], chronicDiseases: [], currentMedications: [], familyHistory: [] },
  contacts: [],
  id: "patient-1",
  isActive: true,
  medicalInsurance: { coverageType: "Básica", policyNumber: "POL-1", provider: "ARS MediCore" },
  personalData: { dateOfBirth: null, documentId: "DOC-001", firstName: "Ana", gender: "Femenino", lastName: "Paciente" },
}

const invoice = (id: string, invoiceDate: string): Invoice => ({
  balance: 100,
  coverageType: "SinSeguro",
  createdBy: "Recepción",
  discount: 0,
  id,
  invoiceDate,
  items: [],
  number: id,
  paidAmount: 0,
  payments: [],
  patientId: "patient-1",
  status: "Pendiente",
  subtotal: 100,
  taxes: 18,
  total: 118,
  insuranceCoverage: 0,
})

describe("billing formatting", () => {
  it("matches the backend coverage breakdown for the visual estimate", () => {
    const preview = calculateInvoicePreview([
      { quantity: 1, type: "Consulta", unitPrice: 100 },
      { quantity: 2, type: "Medicamento", unitPrice: 25 },
    ], patient)

    expect(preview).toEqual({ coverageType: "Basica", discount: 0, insuranceCoverage: 60, subtotal: 150, taxes: 16.2, total: 106.2 })
    expect(normalizeCoverageType("Básica")).toBe("Basica")
  })

  it("sorts newest invoices first and keeps status labels readable", () => {
    expect(sortInvoices([invoice("old", "2026-01-01T00:00:00Z"), invoice("new", "2026-02-01T00:00:00Z")]).map((item) => item.id)).toEqual(["new", "old"])
    expect(formatInvoiceStatus("Pendiente")).toBe("Pendiente")
  })
})
