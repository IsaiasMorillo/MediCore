import { afterEach, describe, expect, it, vi } from "vitest"

import { apiRequest } from "@/lib/api/client"
import {
  adjustMedicationStock,
  createMedication,
  createPrescription,
  dispensePrescription,
  getMedications,
  getPatientPrescriptions,
  updateMedication,
} from "@/features/pharmacy/api/pharmacy-api"
import type { CreateMedicationInput, CreatePrescriptionInput, UpdateMedicationInput } from "@/features/pharmacy/types"

vi.mock("@/lib/api/client", () => ({
  apiRequest: vi.fn(),
}))

const apiRequestMock = vi.mocked(apiRequest)

afterEach(() => {
  vi.clearAllMocks()
})

describe("pharmacy api", () => {
  it("uses the medication search and patient prescription routes", async () => {
    apiRequestMock.mockResolvedValue([])

    await getMedications("Losartán 50")
    await getMedications("")
    await getPatientPrescriptions("patient/1")

    expect(apiRequestMock).toHaveBeenNthCalledWith(1, "/api/pharmacy/medications?search=Losart%C3%A1n%2050")
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, "/api/pharmacy/medications")
    expect(apiRequestMock).toHaveBeenNthCalledWith(3, "/api/pharmacy/prescriptions/patient/patient%2F1")
  })

  it("matches medication, prescription, stock and dispensing commands", async () => {
    const medication: CreateMedicationInput = {
      category: "Cardiología",
      code: "LOS-50",
      expirationDate: null,
      name: "Losartán 50 mg",
      price: 250.5,
      reorderLevel: 10,
      stockQuantity: 100,
    }
    const update: UpdateMedicationInput = { ...medication, isActive: true }
    const prescription: CreatePrescriptionInput = {
      dosage: "1 tableta",
      doctorId: "doctor-1",
      frequency: "Cada 12 horas",
      instructions: "Con las comidas",
      medicalRecordId: "record-1",
      medicationId: "med-1",
      patientId: "patient-1",
      quantity: 30,
    }
    apiRequestMock.mockResolvedValue({ id: "resource-1" })

    await createMedication(medication)
    await updateMedication("med/1", update)
    await adjustMedicationStock({ id: "med/1", quantityChange: -5 })
    await createPrescription(prescription)
    await dispensePrescription({ dispensedBy: "Farmacia Turno A", id: "rx/1" })

    expect(apiRequestMock).toHaveBeenNthCalledWith(1, "/api/pharmacy/medications", { body: JSON.stringify(medication), method: "POST" })
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, "/api/pharmacy/medications/med%2F1", { body: JSON.stringify(update), method: "PUT" })
    expect(apiRequestMock).toHaveBeenNthCalledWith(3, "/api/pharmacy/medications/med%2F1/stock", { body: JSON.stringify({ quantityChange: -5 }), method: "PATCH" })
    expect(apiRequestMock).toHaveBeenNthCalledWith(4, "/api/pharmacy/prescriptions", { body: JSON.stringify(prescription), method: "POST" })
    expect(apiRequestMock).toHaveBeenNthCalledWith(5, "/api/pharmacy/prescriptions/rx%2F1/dispense", { body: JSON.stringify({ dispensedBy: "Farmacia Turno A" }), method: "POST" })
  })
})
