import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  useAppointment,
  useCancelAppointment,
  useConfirmAppointment,
  useDoctorAvailability,
  useRescheduleAppointment,
} from "@/features/appointments/hooks/use-appointments"
import { AppointmentDetailPage } from "@/features/appointments/pages/appointment-detail-page"
import type { Appointment } from "@/features/appointments/types"
import { useDoctor } from "@/features/doctors/hooks/use-doctors"
import { usePatient } from "@/features/patients/hooks/use-patients"
import { useAuthSession } from "@/lib/auth/use-auth-session"
import type { UserRole } from "@/lib/permissions/roles"

vi.mock("@/features/appointments/hooks/use-appointments", () => ({
  useAppointment: vi.fn(),
  useCancelAppointment: vi.fn(),
  useConfirmAppointment: vi.fn(),
  useDoctorAvailability: vi.fn(),
  useRescheduleAppointment: vi.fn(),
}))

vi.mock("@/features/doctors/hooks/use-doctors", () => ({
  useDoctor: vi.fn(),
}))

vi.mock("@/features/patients/hooks/use-patients", () => ({
  usePatient: vi.fn(),
}))

vi.mock("@/lib/auth/use-auth-session", () => ({
  useAuthSession: vi.fn(),
}))

const useAppointmentMock = vi.mocked(useAppointment)
const useCancelAppointmentMock = vi.mocked(useCancelAppointment)
const useConfirmAppointmentMock = vi.mocked(useConfirmAppointment)
const useDoctorAvailabilityMock = vi.mocked(useDoctorAvailability)
const useRescheduleAppointmentMock = vi.mocked(useRescheduleAppointment)
const useDoctorMock = vi.mocked(useDoctor)
const usePatientMock = vi.mocked(usePatient)
const useAuthSessionMock = vi.mocked(useAuthSession)

const appointment: Appointment = {
  doctorId: "doctor-1",
  durationMinutes: 30,
  id: "appointment-1",
  notes: "Consulta inicial",
  patientId: "patient-1",
  startDateTime: "2026-09-07T09:00:00.000Z",
  status: "Scheduled",
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/app/appointments/appointment-1"]}>
      <Routes>
        <Route element={<AppointmentDetailPage />} path="/app/appointments/:appointmentId" />
      </Routes>
    </MemoryRouter>
  )
}

function configureMocks(role: UserRole, data: Appointment = appointment) {
  useAuthSessionMock.mockReturnValue(createMockAuthSession(role))
  useAppointmentMock.mockReturnValue(createQueryResult(data))
  usePatientMock.mockReturnValue(createQueryResult(undefined))
  useDoctorMock.mockReturnValue(createQueryResult(undefined))
  useDoctorAvailabilityMock.mockReturnValue(createQueryResult({
    date: "2026-09-07",
    doctorId: "doctor-1",
    doctorName: "Laura Médica",
    freeSlots: ["2026-09-07T09:30:00.000Z"],
    specialty: "Cardiología",
  }))
  useConfirmAppointmentMock.mockReturnValue(createMutationResult())
  useCancelAppointmentMock.mockReturnValue(createMutationResult())
  useRescheduleAppointmentMock.mockReturnValue(createMutationResult())
}

describe("AppointmentDetailPage", () => {
  it("exposes valid admin actions and asks for confirmation before cancelling", async () => {
    configureMocks("Admin")
    const user = userEvent.setup()

    renderPage()

    expect(screen.getByRole("heading", { name: "Detalle de la cita" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Confirmar cita" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Guardar reprogramación" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Cancelar cita" })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Cancelar cita" }))

    expect(screen.getByRole("alertdialog")).toHaveTextContent("¿Cancelar esta cita?")
    expect(screen.getByRole("button", { name: "Sí, cancelar" })).toBeInTheDocument()
  })

  it("keeps lifecycle actions hidden for a clinical reader", () => {
    configureMocks("Medico")

    renderPage()

    expect(screen.getByText("Tu rol puede consultar esta cita, pero no modificar su estado.")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Confirmar cita" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Cancelar cita" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Guardar reprogramación" })).not.toBeInTheDocument()
  })

  it("does not expose rescheduling or cancellation for a completed appointment", () => {
    configureMocks("Recepcion", { ...appointment, status: "Completed" })

    renderPage()

    expect(screen.getByText("Esta cita no tiene acciones pendientes para su estado actual.")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Cancelar cita" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Guardar reprogramación" })).not.toBeInTheDocument()
  })
})

function createQueryResult<T>(data: T) {
  return {
    data,
    error: null,
    isError: false,
    isFetching: false,
    isPending: false,
    refetch: vi.fn(),
  } as never
}

function createMutationResult() {
  return {
    error: null,
    isError: false,
    isPending: false,
    isSuccess: false,
    mutateAsync: vi.fn(),
    reset: vi.fn(),
  } as never
}

function createMockAuthSession(role: UserRole) {
  const roles = [role]

  return {
    clearSession: vi.fn(),
    hasAnyRole: (allowedRoles: readonly UserRole[]) => allowedRoles.some((allowedRole) => roles.includes(allowedRole)),
    hasRole: (requestedRole: UserRole) => roles.includes(requestedRole),
    session: {
      expiresAt: "2099-01-01T00:00:00.000Z",
      token: "token",
      user: { email: "user@example.com", fullName: "Usuario MediCore", roles, userId: "u-1" },
    },
    setSession: vi.fn(),
  }
}
