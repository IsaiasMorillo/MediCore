import { afterEach, describe, expect, it, vi } from "vitest"

import { apiRequest } from "@/lib/api/client"
import {
  fetchBillingSummary,
  fetchLaboratoryMostRequested,
  fetchLowStock,
  fetchMedicationsDispensed,
  fetchPatientsMostFrequent,
  reportKeys,
} from "@/features/reports/api/reports-api"

vi.mock("@/lib/api/client", () => ({
  apiRequest: vi.fn(),
}))

const apiRequestMock = vi.mocked(apiRequest)

afterEach(() => {
  vi.clearAllMocks()
})

describe("reports api", () => {
  it("sends the billing date range as date-only query parameters", async () => {
    apiRequestMock.mockResolvedValue([])

    await fetchBillingSummary({ from: "2026-09-01", to: "2026-09-30" })

    expect(apiRequestMock).toHaveBeenCalledWith(
      "/api/reports/invoices-summary?from=2026-09-01&to=2026-09-30"
    )
    expect(reportKeys.billing("2026-09-01", "2026-09-30")).toEqual([
      "reports",
      "billing",
      "2026-09-01",
      "2026-09-30",
    ])
  })

  it("keeps report endpoints and limits aligned with the backend", async () => {
    apiRequestMock.mockResolvedValue([])

    await fetchMedicationsDispensed(10)
    await fetchLaboratoryMostRequested(10)
    await fetchPatientsMostFrequent(10)
    await fetchLowStock()

    expect(apiRequestMock).toHaveBeenNthCalledWith(
      1,
      "/api/reports/medications-dispensed?limit=10"
    )
    expect(apiRequestMock).toHaveBeenNthCalledWith(
      2,
      "/api/reports/laboratory-most-requested?limit=10"
    )
    expect(apiRequestMock).toHaveBeenNthCalledWith(
      3,
      "/api/reports/patients-most-frequent?limit=10"
    )
    expect(apiRequestMock).toHaveBeenNthCalledWith(4, "/api/reports/low-stock")
  })
})
