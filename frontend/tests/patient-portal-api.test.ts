import { afterEach, describe, expect, it, vi } from "vitest"

import {
  getPortalActivePrescriptions,
  getPortalInvoices,
  getPortalLaboratoryResults,
  getPortalUpcomingAppointments,
  patientPortalKeys,
} from "@/features/patient-portal/api/patient-portal-api"
import { apiRequest } from "@/lib/api/client"

vi.mock("@/lib/api/client", () => ({
  apiRequest: vi.fn(),
}))

const apiRequestMock = vi.mocked(apiRequest)

afterEach(() => {
  vi.clearAllMocks()
})

describe("patient portal API", () => {
  it("uses the authenticated portal endpoints without a patient id", async () => {
    apiRequestMock.mockResolvedValue([])

    await getPortalUpcomingAppointments()
    await getPortalActivePrescriptions()
    await getPortalInvoices()
    await getPortalLaboratoryResults()

    expect(apiRequestMock).toHaveBeenNthCalledWith(1, "/api/patient-portal/upcoming-appointments")
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, "/api/patient-portal/active-prescriptions")
    expect(apiRequestMock).toHaveBeenNthCalledWith(3, "/api/patient-portal/invoices")
    expect(apiRequestMock).toHaveBeenNthCalledWith(4, "/api/patient-portal/laboratory-results")
    expect(apiRequestMock.mock.calls.flat().join(" ")).not.toContain("patientId")
  })

  it("keeps the documented query key namespace", () => {
    expect(patientPortalKeys.all()).toEqual(["patient-portal"])
    expect(patientPortalKeys.appointments()).toEqual(["patient-portal", "appointments"])
    expect(patientPortalKeys.prescriptions()).toEqual(["patient-portal", "prescriptions"])
    expect(patientPortalKeys.invoices()).toEqual(["patient-portal", "invoices"])
    expect(patientPortalKeys.laboratoryResults()).toEqual(["patient-portal", "laboratory-results"])
  })
})
