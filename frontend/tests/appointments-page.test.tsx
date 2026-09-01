import { cleanup, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { afterEach, describe, expect, it, vi } from "vitest"

import { AppointmentsPage } from "@/features/appointments/pages/appointments-page"
import {
  useDoctorAvailability,
  useGlobalAvailability,
} from "@/features/appointments/hooks/use-appointments"
import { useDoctors } from "@/features/doctors/hooks/use-doctors"
import type { Doctor } from "@/features/doctors/types"
import { useAuthSession } from "@/lib/auth/use-auth-session"
import type { UserRole } from "@/lib/permissions/roles"

vi.mock("@/features/appointments/hooks/use-appointments", () => ({
  useDoctorAvailability: vi.fn(),
  useGlobalAvailability: vi.fn(),
}))

vi.mock("@/features/doctors/hooks/use-doctors", () => ({
  useDoctors: vi.fn(),
}))

vi.mock("@/lib/auth/use-auth-session", () => ({
  useAuthSession: vi.fn(),
}))

const useDoctorAvailabilityMock = vi.mocked(useDoctorAvailability)
const useGlobalAvailabilityMock = vi.mocked(useGlobalAvailability)
const useDoctorsMock = vi.mocked(useDoctors)
const useAuthSessionMock = vi.mocked(useAuthSession)

const doctors: Doctor[] = [{
  experienceYears: 8,
  firstName: "Laura",
  id: "doctor-1",
  isActive: true,
  lastName: "Médica",
  licenseNumber: "LIC-001",
  office: "Consultorio 204",
  schedule: [{ day: "Monday", endTime: "12:00", startTime: "09:00" }],
  specialty: "Cardiología",
}]

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

function renderPage() {
  return render(
    <MemoryRouter>
      <AppointmentsPage />
    </MemoryRouter>
  )
}

describe("AppointmentsPage", () => {
  it("shows global slots and booking access to reception", () => {
    useAuthSessionMock.mockReturnValue(createMockAuthSession("Recepcion"))
    useDoctorsMock.mockReturnValue(createQueryResult(doctors))
    useGlobalAvailabilityMock.mockReturnValue(createQueryResult([{
      date: "2026-09-07",
      doctorId: "doctor-1",
      doctorName: "Laura Médica",
      freeSlots: ["2026-09-07T09:00:00.000Z"],
      specialty: "Cardiología",
    }]))
    useDoctorAvailabilityMock.mockReturnValue(createQueryResult(undefined))

    renderPage()

    expect(screen.getByRole("heading", { name: "Citas" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Programar cita" })).toHaveAttribute("href", "/app/appointments/new")
    expect(screen.getByRole("link", { name: /09:00.*agendar/i })).toBeInTheDocument()
  })

  it("keeps booking hidden for clinical readers and asks for a doctor", () => {
    useAuthSessionMock.mockReturnValue(createMockAuthSession("Medico"))
    useDoctorsMock.mockReturnValue(createQueryResult(doctors))
    useGlobalAvailabilityMock.mockReturnValue(createQueryResult([]))
    useDoctorAvailabilityMock.mockReturnValue(createQueryResult(undefined))

    renderPage()

    expect(screen.queryByRole("link", { name: "Programar cita" })).not.toBeInTheDocument()
    expect(screen.getByText("Elige un médico")).toBeInTheDocument()
    expect(screen.getByLabelText("Médico")).toBeInTheDocument()
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
