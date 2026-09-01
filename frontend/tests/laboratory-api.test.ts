import { afterEach, describe, expect, it, vi } from "vitest"

import { apiRequest } from "@/lib/api/client"
import {
  createLaboratoryOrder,
  getLaboratoryOrder,
  getLaboratoryTestTypes,
  getPatientLaboratoryOrders,
  loadLaboratoryResults,
} from "@/features/laboratory/api/laboratory-api"
import type { CreateLaboratoryOrderInput } from "@/features/laboratory/types"

vi.mock("@/lib/api/client", () => ({
  apiRequest: vi.fn(),
}))

const apiRequestMock = vi.mocked(apiRequest)

afterEach(() => {
  vi.clearAllMocks()
})

describe("laboratory api", () => {
  it("uses the supported catalog and patient/order lookup routes", async () => {
    apiRequestMock.mockResolvedValue([])

    await getLaboratoryTestTypes()
    await getPatientLaboratoryOrders("patient/1")
    await getLaboratoryOrder("order/1")

    expect(apiRequestMock).toHaveBeenNthCalledWith(1, "/api/laboratory/test-types")
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, "/api/laboratory/orders/patient/patient%2F1")
    expect(apiRequestMock).toHaveBeenNthCalledWith(3, "/api/laboratory/orders/order%2F1")
  })

  it("matches order creation and structured result loading commands", async () => {
    const input: CreateLaboratoryOrderInput = {
      doctorId: "doctor-1",
      medicalRecordId: "record-1",
      patientId: "patient-1",
      testType: "Hemograma",
    }
    const results = { hemoglobina: 13.2, hematocrito: 41 }
    apiRequestMock.mockResolvedValue({ id: "order-1" })

    await createLaboratoryOrder(input)
    await loadLaboratoryResults({ id: "order/1", results })

    expect(apiRequestMock).toHaveBeenNthCalledWith(1, "/api/laboratory/orders", {
      body: JSON.stringify(input),
      method: "POST",
    })
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, "/api/laboratory/orders/order%2F1/results", {
      body: JSON.stringify(results),
      method: "POST",
    })
  })
})
