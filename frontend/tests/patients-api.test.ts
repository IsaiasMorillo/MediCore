import { afterEach, describe, expect, it, vi } from "vitest"

import { apiRequest } from "@/lib/api/client"
import {
  createPatient,
  deletePatient,
  searchPatients,
  updatePatient,
} from "@/features/patients/api/patients-api"
import type { CreatePatientInput, UpdatePatientInput } from "@/features/patients/types"

vi.mock("@/lib/api/client", () => ({
  apiRequest: vi.fn(),
}))

const apiRequestMock = vi.mocked(apiRequest)

afterEach(() => {
  vi.clearAllMocks()
})

describe("patients api", () => {
  it("encodes server-side patient searches", async () => {
    apiRequestMock.mockResolvedValue([])

    await searchPatients("Ana / 402")

    expect(apiRequestMock).toHaveBeenCalledWith("/api/patients?search=Ana%20%2F%20402")
  })

  it("uses the backend patient commands without sending form-only fields", async () => {
    const input: CreatePatientInput = {
      clinicalHistory: {
        allergies: [],
        chronicDiseases: [],
        currentMedications: [],
        familyHistory: [],
      },
      contacts: [],
      dateOfBirth: null,
      documentId: "402-1234567-8",
      firstName: "Ana",
      gender: "Femenino",
      lastName: "López",
      medicalInsurance: null,
    }
    const updateInput: UpdatePatientInput = { ...input, isActive: false }
    apiRequestMock.mockResolvedValue({ id: "patient-1" })

    await createPatient(input)
    await updatePatient("patient/1", updateInput)
    await deletePatient("patient/1")

    expect(apiRequestMock).toHaveBeenNthCalledWith(1, "/api/patients", {
      body: JSON.stringify(input),
      method: "POST",
    })
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, "/api/patients/patient%2F1", {
      body: JSON.stringify(updateInput),
      method: "PUT",
    })
    expect(apiRequestMock).toHaveBeenNthCalledWith(3, "/api/patients/patient%2F1", {
      method: "DELETE",
    })
  })
})
