import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { afterEach, describe, expect, it, vi } from "vitest"

import { usePatientVitals } from "@/features/nursing/hooks/use-nursing"
import { NursingPage } from "@/features/nursing/pages/nursing-page"
import type { VitalsRecord } from "@/features/nursing/types"
import { usePatients } from "@/features/patients/hooks/use-patients"
import type { Patient } from "@/features/patients/types"
import { useAuthSession } from "@/lib/auth/use-auth-session"
import type { UserRole } from "@/lib/permissions/roles"

vi.mock("@/features/nursing/hooks/use-nursing", () => ({
  usePatientVitals: vi.fn(),
}))

vi.mock("@/features/patients/hooks/use-patients", () => ({
  usePatients: vi.fn(),
}))

vi.mock("@/lib/auth/use-auth-session", () => ({
  useAuthSession: vi.fn(),
}))

const usePatientVitalsMock = vi.mocked(usePatientVitals)
const usePatientsMock = vi.mocked(usePatients)
const useAuthSessionMock = vi.mocked(useAuthSession)

const patient: Patient = {
  clinicalHistory: { allergies: [], chronicDiseases: [], currentMedications: [], familyHistory: [] },
  contacts: [],
  id: "patient-1",
  isActive: true,
  medicalInsurance: null,
  personalData: {
    dateOfBirth: null,
    documentId: "DOC-001",
    firstName: "Ana",
    gender: "Femenino",
    lastName: "Paciente",
  },
}

const record: VitalsRecord = {
  appointmentId: null,
  id: "vitals-1",
  notes: "Medición en reposo.",
  patientId: "patient-1",
  recordedAt: "2026-09-08T09:00:00.000Z",
  recordedBy: "nurse-1",
  vitalSigns: { bloodPressure: "120/80", heartRate: 72, temperature: 36.7, weightKg: null },
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe("NursingPage", () => {
  it("lets a doctor consult a patient's vitals without exposing creation", async () => {
    configureMocks("Medico")
    const user = userEvent.setup()

    render(<NursingPage />, { wrapper: MemoryRouter })

    await user.selectOptions(screen.getByRole("combobox", { name: "Paciente para signos vitales" }), "patient-1")

    expect(await screen.findByRole("heading", { name: "Historial de signos vitales" })).toBeInTheDocument()
    expect(screen.getByText("Medición en reposo.")).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Registrar signos" })).not.toBeInTheDocument()
  })

  it("exposes creation for a nurse and keeps the patient context in the link", () => {
    configureMocks("Enfermero")

    render(<NursingPage />, { wrapper: MemoryRouter })

    expect(screen.getByRole("link", { name: "Registrar signos" })).toHaveAttribute("href", "/app/nursing/vitals/new")
  })
})

function configureMocks(role: UserRole) {
  useAuthSessionMock.mockReturnValue(createMockAuthSession(role))
  usePatientsMock.mockReturnValue(createQueryResult([patient]))
  usePatientVitalsMock.mockImplementation((patientId) => createQueryResult(patientId ? [record] : undefined))
}

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
