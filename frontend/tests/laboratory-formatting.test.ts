import { describe, expect, it } from "vitest"

import type { LaboratoryOrder } from "@/features/laboratory/types"
import {
  formatLaboratoryOrderStatus,
  formatLaboratoryResultLabel,
  formatLaboratoryResultValue,
  formatLaboratoryTestType,
  sortLaboratoryOrders,
} from "@/features/laboratory/utils/laboratory-formatting"

const orders: LaboratoryOrder[] = [
  {
    doctorId: "doctor-1",
    id: "order-1",
    medicalRecordId: null,
    patientId: "patient-1",
    requestedAt: "2026-09-01T09:00:00.000Z",
    results: null,
    resultsLoadedAt: null,
    status: "SolicitudPendiente",
    testType: "Hemograma",
  },
  {
    doctorId: "doctor-1",
    id: "order-2",
    medicalRecordId: "record-1",
    patientId: "patient-1",
    requestedAt: "2026-09-08T09:00:00.000Z",
    results: { hemoglobina: 13.2 },
    resultsLoadedAt: "2026-09-08T10:00:00.000Z",
    status: "ResultadoCargado",
    testType: "Radiografia",
  },
]

describe("laboratory formatting", () => {
  it("centralizes test type/status labels and sorts orders newest first", () => {
    expect(formatLaboratoryTestType("Radiografia")).toBe("Radiografía")
    expect(formatLaboratoryOrderStatus("ResultadoCargado")).toBe("Resultado cargado")
    expect(sortLaboratoryOrders(orders).map((order) => order.id)).toEqual(["order-2", "order-1"])
  })

  it("renders structured result values without falling back to raw JSON", () => {
    expect(formatLaboratoryResultLabel("conContraste")).toBe("Con contraste")
    expect(formatLaboratoryResultValue({ conContraste: true, hallazgos: ["Sin lesión"] })).toMatch(/Con contraste: Sí.*Hallazgos: Sin lesión/)
    expect(formatLaboratoryResultValue(null)).toBe("No registrado")
  })
})
