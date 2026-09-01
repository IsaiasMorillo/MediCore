import { afterEach, describe, expect, it, vi } from "vitest"

import { apiRequest } from "@/lib/api/client"
import {
  createDoctor,
  deleteDoctor,
  searchDoctors,
  updateDoctor,
} from "@/features/doctors/api/doctors-api"
import type { CreateDoctorInput, UpdateDoctorInput } from "@/features/doctors/types"

vi.mock("@/lib/api/client", () => ({
  apiRequest: vi.fn(),
}))

const apiRequestMock = vi.mocked(apiRequest)

afterEach(() => {
  vi.clearAllMocks()
})

describe("doctors api", () => {
  it("sends the supported specialty and search query parameters", async () => {
    apiRequestMock.mockResolvedValue([])

    await searchDoctors({ searchTerm: "Ana/1", specialty: "Medicina General" })

    expect(apiRequestMock).toHaveBeenCalledWith(
      "/api/doctors?specialty=Medicina+General&search=Ana%2F1"
    )
  })

  it("uses the doctor command contracts for create, update and delete", async () => {
    const input: CreateDoctorInput = {
      experienceYears: 6,
      firstName: "Herminia",
      lastName: "Médico",
      licenseNumber: "LIC-001",
      office: "Consultorio 108",
      schedule: [{ day: "Monday", endTime: "11:00", startTime: "08:00" }],
      specialty: "Medicina General",
    }
    const updateInput: UpdateDoctorInput = { ...input, isActive: false }
    apiRequestMock.mockResolvedValue({ id: "doctor-1" })

    await createDoctor(input)
    await updateDoctor("doctor/1", updateInput)
    await deleteDoctor("doctor/1")

    expect(apiRequestMock).toHaveBeenNthCalledWith(1, "/api/doctors", {
      body: JSON.stringify(input),
      method: "POST",
    })
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, "/api/doctors/doctor%2F1", {
      body: JSON.stringify(updateInput),
      method: "PUT",
    })
    expect(apiRequestMock).toHaveBeenNthCalledWith(3, "/api/doctors/doctor%2F1", {
      method: "DELETE",
    })
  })
})
