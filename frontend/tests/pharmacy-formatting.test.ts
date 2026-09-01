import { describe, expect, it } from "vitest"

import type { Medication, Prescription } from "@/features/pharmacy/types"
import {
  formatPharmacyCurrency,
  formatPrescriptionStatus,
  isLowStock,
  isMedicationExpired,
  sortPrescriptions,
} from "@/features/pharmacy/utils/pharmacy-formatting"

const medication: Medication = {
  category: "Cardiología",
  code: "LOS-50",
  expirationDate: "2026-09-01T00:00:00.000Z",
  id: "med-1",
  isActive: true,
  name: "Losartán",
  price: 250.5,
  reorderLevel: 10,
  stockQuantity: 10,
}

const prescriptions: Prescription[] = [
  { dispensedAt: null, dispensedBy: null, dosage: "1 tableta", doctorId: "doctor-1", frequency: "Diaria", id: "rx-2", instructions: "", medicalRecordId: null, medicationId: "med-2", medicationName: "Metformina", patientId: "patient-1", quantity: 30, status: "Despachada" },
  { dispensedAt: null, dispensedBy: null, dosage: "1 tableta", doctorId: "doctor-1", frequency: "Cada 12 horas", id: "rx-1", instructions: "", medicalRecordId: null, medicationId: "med-1", medicationName: "Losartán", patientId: "patient-1", quantity: 20, status: "Emitida" },
]

describe("pharmacy formatting", () => {
  it("centralizes status, currency and stock rules", () => {
    expect(formatPrescriptionStatus("Despachada")).toBe("Despachada")
    expect(formatPharmacyCurrency(250.5)).toContain("250.50")
    expect(isLowStock(medication)).toBe(true)
    expect(isMedicationExpired(medication, Date.parse("2026-09-02T00:00:00.000Z"))).toBe(true)
  })

  it("prioritizes emitted prescriptions before dispensed ones", () => {
    expect(sortPrescriptions(prescriptions).map((prescription) => prescription.id)).toEqual(["rx-1", "rx-2"])
  })
})
