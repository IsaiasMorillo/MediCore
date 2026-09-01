import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { afterEach, describe, expect, it, vi } from "vitest"

import { useDoctors } from "@/features/doctors/hooks/use-doctors"
import { DoctorsPage } from "@/features/doctors/pages/doctors-page"
import type { Doctor } from "@/features/doctors/types"
import { useAuthSession } from "@/lib/auth/use-auth-session"
import type { UserRole } from "@/lib/permissions/roles"

vi.mock("@/features/doctors/hooks/use-doctors", () => ({
  useDoctors: vi.fn(),
}))

vi.mock("@/lib/auth/use-auth-session", () => ({
  useAuthSession: vi.fn(),
}))

const useDoctorsMock = vi.mocked(useDoctors)
const useAuthSessionMock = vi.mocked(useAuthSession)

const doctors: Doctor[] = [
  {
    experienceYears: 6,
    firstName: "Herminia",
    id: "doctor-1",
    isActive: true,
    lastName: "Médico",
    licenseNumber: "LIC-001",
    office: "Consultorio 108",
    schedule: [{ day: "Monday", endTime: "11:00:00", startTime: "08:00:00" }],
    specialty: "Medicina General",
  },
  {
    experienceYears: 10,
    firstName: "Julio",
    id: "doctor-2",
    isActive: false,
    lastName: "Cardiólogo",
    licenseNumber: "LIC-002",
    office: "Consultorio 204",
    schedule: [{ day: "Tuesday", endTime: "16:00:00", startTime: "13:00:00" }],
    specialty: "Cardiología",
  },
]

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

function renderDoctors() {
  return render(
    <MemoryRouter>
      <DoctorsPage />
    </MemoryRouter>
  )
}

describe("DoctorsPage", () => {
  it("renders the directory and exposes management to admins", () => {
    useAuthSessionMock.mockReturnValue(createMockAuthSession("Admin", "Administrador", "admin@example.com", "u-1"))
    useDoctorsMock.mockReturnValue({
      data: doctors,
      error: null,
      isError: false,
      isFetching: false,
      isPending: false,
      refetch: vi.fn(),
    } as never)

    renderDoctors()

    expect(screen.getByRole("heading", { name: "Médicos" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Nuevo médico" })).toHaveAttribute("href", "/app/doctors/new")
    expect(screen.getAllByText("Herminia Médico")).toHaveLength(2)
    expect(screen.getAllByText("Julio Cardiólogo")).toHaveLength(2)
  })

  it("filters inactive specialists locally", async () => {
    useAuthSessionMock.mockReturnValue(createMockAuthSession("Medico", "Médico", "doctor@example.com", "u-2"))
    useDoctorsMock.mockReturnValue({
      data: doctors,
      error: null,
      isError: false,
      isFetching: false,
      isPending: false,
      refetch: vi.fn(),
    } as never)
    const user = userEvent.setup()
    renderDoctors()

    await user.selectOptions(screen.getByLabelText("Filtrar por estado"), "inactive")

    expect(screen.queryAllByText("Herminia Médico")).toHaveLength(0)
    expect(screen.getAllByText("Julio Cardiólogo")).toHaveLength(2)
    expect(screen.queryByRole("link", { name: "Nuevo médico" })).not.toBeInTheDocument()
  })
})

function createMockAuthSession(role: UserRole, fullName: string, email: string, userId: string) {
  const roles = [role]

  return {
    clearSession: vi.fn(),
    hasAnyRole: (allowedRoles: readonly UserRole[]) => allowedRoles.some((allowedRole) => roles.includes(allowedRole)),
    hasRole: (requestedRole: UserRole) => roles.includes(requestedRole),
    session: {
      expiresAt: "2099-01-01T00:00:00.000Z",
      token: "token",
      user: { email, fullName, roles, userId },
    },
    setSession: vi.fn(),
  }
}
