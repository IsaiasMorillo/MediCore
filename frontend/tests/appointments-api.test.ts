import { afterEach, describe, expect, it, vi } from "vitest"

import {
  apiRequest,
} from "@/lib/api/client"
import {
  cancelAppointment,
  confirmAppointment,
  createAppointment,
  getAppointment,
  getDoctorAvailability,
  getGlobalAvailability,
  rescheduleAppointment,
} from "@/features/appointments/api/appointments-api"
import type { CreateAppointmentInput } from "@/features/appointments/types"

vi.mock("@/lib/api/client", () => ({
  apiRequest: vi.fn(),
}))

const apiRequestMock = vi.mocked(apiRequest)

afterEach(() => {
  vi.clearAllMocks()
})

describe("appointments api", () => {
  it("sends the supported availability routes and date query", async () => {
    apiRequestMock.mockResolvedValue([])

    await getDoctorAvailability("doctor/1", "2026-09-07")
    await getGlobalAvailability("2026-09-07")
    await getAppointment("appointment/1")

    expect(apiRequestMock).toHaveBeenNthCalledWith(
      1,
      "/api/appointments/availability/doctor%2F1?date=2026-09-07"
    )
    expect(apiRequestMock).toHaveBeenNthCalledWith(
      2,
      "/api/appointments/availability?date=2026-09-07"
    )
    expect(apiRequestMock).toHaveBeenNthCalledWith(
      3,
      "/api/appointments/appointment%2F1"
    )
  })

  it("matches the appointment lifecycle command contracts", async () => {
    const input: CreateAppointmentInput = {
      doctorId: "doctor-1",
      durationMinutes: 30,
      notes: "Consulta inicial",
      patientId: "patient-1",
      startDateTime: "2026-09-07T09:00:00.000Z",
    }
    apiRequestMock.mockResolvedValue({ id: "appointment-1" })

    await createAppointment(input)
    await rescheduleAppointment("appointment/1", { newStartDateTime: input.startDateTime })
    await confirmAppointment("appointment/1")
    await cancelAppointment("appointment/1")

    expect(apiRequestMock).toHaveBeenNthCalledWith(1, "/api/appointments", {
      body: JSON.stringify(input),
      method: "POST",
    })
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, "/api/appointments/appointment%2F1/reschedule", {
      body: JSON.stringify({ newStartDateTime: input.startDateTime }),
      method: "PUT",
    })
    expect(apiRequestMock).toHaveBeenNthCalledWith(3, "/api/appointments/appointment%2F1/confirm", {
      method: "POST",
    })
    expect(apiRequestMock).toHaveBeenNthCalledWith(4, "/api/appointments/appointment%2F1/cancel", {
      method: "POST",
    })
  })
})
