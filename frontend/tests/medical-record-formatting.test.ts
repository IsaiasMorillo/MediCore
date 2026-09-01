import { describe, expect, it } from "vitest"

import {
  formatMedicalRecordDate,
  formatVitalSignsSummary,
  sortMedicalRecords,
} from "@/features/medical-records/utils/medical-record-formatting"
import type { MedicalRecord } from "@/features/medical-records/types"

const records: MedicalRecord[] = [
  {
    appointmentId: null,
    consultationDate: "2026-09-01T09:00:00.000Z",
    diagnosis: "Registro anterior",
    doctorId: "doctor-1",
    id: "record-1",
    laboratoryOrderIds: [],
    observations: "",
    patientId: "patient-1",
    prescriptionIds: [],
    treatmentPlan: "",
    vitalSigns: { bloodPressure: "", heartRate: null, temperature: null, weightKg: null },
  },
  {
    appointmentId: "appointment-2",
    consultationDate: "2026-09-08T09:00:00.000Z",
    diagnosis: "Registro reciente",
    doctorId: "doctor-1",
    id: "record-2",
    laboratoryOrderIds: [],
    observations: "",
    patientId: "patient-1",
    prescriptionIds: [],
    treatmentPlan: "",
    vitalSigns: { bloodPressure: "120/80", heartRate: 72, temperature: 36.7, weightKg: null },
  },
]

describe("medical record formatting", () => {
  it("sorts records newest first and formats dates in UTC", () => {
    expect(sortMedicalRecords(records).map((record) => record.id)).toEqual(["record-2", "record-1"])
    expect(formatMedicalRecordDate("2026-09-08T09:00:00.000Z")).toMatch(/2026|septiembre|mar/i)
  })

  it("summarizes only the vital signs that were recorded", () => {
    expect(formatVitalSignsSummary(records[1].vitalSigns)).toMatch(/120\/80 mmHg · 72 bpm · 36[,.]7 °C/)
    expect(formatVitalSignsSummary(records[0].vitalSigns)).toBe("Presión no registrada")
  })
})
