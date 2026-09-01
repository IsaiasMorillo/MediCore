import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { useDoctorAvailability } from "@/features/appointments/hooks/use-appointments"
import { AppointmentForm } from "@/features/appointments/components/appointment-form"
import type { Doctor } from "@/features/doctors/types"
import type { Patient } from "@/features/patients/types"

vi.mock("@/features/appointments/hooks/use-appointments", () => ({
  useDoctorAvailability: vi.fn(),
}))

const useDoctorAvailabilityMock = vi.mocked(useDoctorAvailability)

const patients: Patient[] = [
  {
    clinicalHistory: { allergies: [], chronicDiseases: [], currentMedications: [], familyHistory: [] },
    contacts: [{ type: "Phone", value: "809-555-0000" }],
    id: "patient-1",
    isActive: true,
    medicalInsurance: null,
    personalData: {
      dateOfBirth: null,
      documentId: "DOC-001",
      firstName: "Carlos",
      gender: "Masculino",
      lastName: "Paciente",
    },
  },
]

const doctors: Doctor[] = [
  {
    experienceYears: 8,
    firstName: "Laura",
    id: "doctor-1",
    isActive: true,
    lastName: "Médica",
    licenseNumber: "LIC-001",
    office: "Consultorio 204",
    schedule: [{ day: "Monday", endTime: "12:00", startTime: "09:00" }],
    specialty: "Cardiología",
  },
]

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe("AppointmentForm", () => {
  it("requires a free slot and submits the selected appointment values", async () => {
    useDoctorAvailabilityMock.mockReturnValue({
      data: {
        date: "2026-09-07",
        doctorId: "doctor-1",
        doctorName: "Laura Médica",
        freeSlots: ["2026-09-07T09:00:00.000Z", "2026-09-07T09:30:00.000Z"],
        specialty: "Cardiología",
      },
      error: null,
      isError: false,
      isPending: false,
    } as never)
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(
      <AppointmentForm
        doctors={doctors}
        initialDate="2026-09-07"
        initialDoctorId="doctor-1"
        onSubmit={onSubmit}
        patients={patients}
      />
    )

    await user.selectOptions(screen.getByLabelText("Paciente"), "patient-1")
    await user.click(screen.getByRole("button", { name: "09:00" }))
    await user.click(screen.getByRole("button", { name: "Programar cita" }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      appointmentDate: "2026-09-07",
      doctorId: "doctor-1",
      durationMinutes: 30,
      patientId: "patient-1",
      startTime: "09:00",
    }), expect.anything()))
  })

  it("exposes a meaningful validation message when no slot is selected", async () => {
    useDoctorAvailabilityMock.mockReturnValue({
      data: {
        date: "2026-09-07",
        doctorId: "doctor-1",
        doctorName: "Laura Médica",
        freeSlots: ["2026-09-07T09:00:00.000Z"],
        specialty: "Cardiología",
      },
      error: null,
      isError: false,
      isPending: false,
    } as never)
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(
      <AppointmentForm
        doctors={doctors}
        initialDate="2026-09-07"
        initialDoctorId="doctor-1"
        onSubmit={onSubmit}
        patients={patients}
      />
    )

    await user.selectOptions(screen.getByLabelText("Paciente"), "patient-1")
    await user.click(screen.getByRole("button", { name: "Programar cita" }))

    expect(await screen.findByRole("alert")).toHaveTextContent("Selecciona un horario disponible.")
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
