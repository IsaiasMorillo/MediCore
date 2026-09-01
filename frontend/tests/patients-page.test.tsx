import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { afterEach, describe, expect, it, vi } from "vitest"

import { PatientsPage } from "@/features/patients/pages/patients-page"
import { usePatients } from "@/features/patients/hooks/use-patients"
import type { Patient } from "@/features/patients/types"
import { useAuthSession } from "@/lib/auth/use-auth-session"
import type { UserRole } from "@/lib/permissions/roles"

vi.mock("@/features/patients/hooks/use-patients", () => ({
  usePatients: vi.fn(),
}))

vi.mock("@/lib/auth/use-auth-session", () => ({
  useAuthSession: vi.fn(),
}))

const usePatientsMock = vi.mocked(usePatients)
const useAuthSessionMock = vi.mocked(useAuthSession)

const patients: Patient[] = [
  {
    clinicalHistory: {
      allergies: [],
      chronicDiseases: [],
      currentMedications: [],
      familyHistory: [],
    },
    contacts: [{ type: "Phone", value: "809-555-0000" }],
    id: "patient-1",
    isActive: true,
    medicalInsurance: null,
    personalData: {
      dateOfBirth: null,
      documentId: "DOC-001",
      firstName: "Ana",
      gender: "Femenino",
      lastName: "López",
    },
  },
  {
    clinicalHistory: {
      allergies: [],
      chronicDiseases: [],
      currentMedications: [],
      familyHistory: [],
    },
    contacts: [],
    id: "patient-2",
    isActive: false,
    medicalInsurance: null,
    personalData: {
      dateOfBirth: null,
      documentId: "DOC-002",
      firstName: "Bruno",
      gender: "Masculino",
      lastName: "Díaz",
    },
  },
]

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

function renderPatients() {
  return render(
    <MemoryRouter>
      <PatientsPage />
    </MemoryRouter>
  )
}

describe("PatientsPage", () => {
  it("renders the patient list and exposes write actions to reception", () => {
    useAuthSessionMock.mockReturnValue(createMockAuthSession("Recepcion", "Recepción", "reception@example.com", "u-1"))
    usePatientsMock.mockReturnValue({
      data: patients,
      error: null,
      isError: false,
      isFetching: false,
      isPending: false,
      refetch: vi.fn(),
    } as never)

    renderPatients()

    expect(screen.getByRole("heading", { name: "Pacientes" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Nuevo paciente" })).toHaveAttribute("href", "/app/patients/new")
    expect(screen.getAllByText("Ana López")).toHaveLength(2)
    expect(screen.getAllByText("Bruno Díaz")).toHaveLength(2)
  })

  it("filters inactive patients without changing the server result", async () => {
    useAuthSessionMock.mockReturnValue(createMockAuthSession("Medico", "Médico", "doctor@example.com", "u-2"))
    usePatientsMock.mockReturnValue({
      data: patients,
      error: null,
      isError: false,
      isFetching: false,
      isPending: false,
      refetch: vi.fn(),
    } as never)
    const user = userEvent.setup()
    renderPatients()

    await user.selectOptions(screen.getByLabelText("Filtrar por estado"), "inactive")

    expect(screen.queryAllByText("Ana López")).toHaveLength(0)
    expect(screen.getAllByText("Bruno Díaz")).toHaveLength(2)
    expect(screen.queryByRole("link", { name: "Nuevo paciente" })).not.toBeInTheDocument()
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
