import { describe, expect, it } from "vitest"

import {
  toCreatePatientInput,
  toUpdatePatientInput,
} from "@/features/patients/utils/patient-form"
import type { PatientFormValues } from "@/features/patients/schemas/patient-schemas"

const formValues: PatientFormValues = {
  allergies: "Penicilina\nPolvo",
  chronicDiseases: "Hipertensión",
  contacts: [
    { name: "María Pérez", phone: "809-555-9999", type: "Emergency", value: "" },
    { name: "", phone: "", type: "Phone", value: "809-555-1234" },
  ],
  currentMedications: "Losartán 50mg",
  dateOfBirth: "1985-05-15",
  documentId: "402-1234567-8",
  familyHistory: "Diabetes familiar",
  firstName: "Juan",
  gender: "Masculino",
  insuranceCoverageType: "Premium",
  insuranceEnabled: true,
  insurancePolicyNumber: "SEN-987654321",
  insuranceProvider: "Senasa",
  isActive: true,
  lastName: "Pérez",
}

describe("patient form mapping", () => {
  it("maps form fields to the create patient contract", () => {
    expect(toCreatePatientInput(formValues)).toEqual({
      clinicalHistory: {
        allergies: ["Penicilina", "Polvo"],
        chronicDiseases: ["Hipertensión"],
        currentMedications: ["Losartán 50mg"],
        familyHistory: ["Diabetes familiar"],
      },
      contacts: [
        {
          name: "María Pérez",
          phone: "809-555-9999",
          type: "Emergency",
          value: "809-555-9999",
        },
        { name: null, phone: null, type: "Phone", value: "809-555-1234" },
      ],
      dateOfBirth: "1985-05-15",
      documentId: "402-1234567-8",
      firstName: "Juan",
      gender: "Masculino",
      lastName: "Pérez",
      medicalInsurance: {
        coverageType: "Premium",
        policyNumber: "SEN-987654321",
        provider: "Senasa",
      },
    })
  })

  it("keeps update-only active state and clears disabled insurance", () => {
    expect(toUpdatePatientInput({ ...formValues, insuranceEnabled: false, isActive: false })).toMatchObject({
      isActive: false,
      medicalInsurance: null,
    })
  })
})
