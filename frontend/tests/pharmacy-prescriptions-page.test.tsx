import { cleanup, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { afterEach, describe, expect, it, vi } from "vitest"

import { usePatientPrescriptions, useDispensePrescription, useMedications, useCreatePrescription } from "@/features/pharmacy/hooks/use-pharmacy"
import { PharmacyPrescriptionsPage } from "@/features/pharmacy/pages/pharmacy-prescriptions-page"
import type { Prescription } from "@/features/pharmacy/types"
import { usePatients } from "@/features/patients/hooks/use-patients"
import { useAuthSession } from "@/lib/auth/use-auth-session"

vi.mock("@/features/pharmacy/hooks/use-pharmacy", () => ({
  useAdjustMedicationStock: vi.fn(),
  useCreateMedication: vi.fn(),
  useCreatePrescription: vi.fn(),
  useDispensePrescription: vi.fn(),
  useMedications: vi.fn(),
  usePatientPrescriptions: vi.fn(),
  useUpdateMedication: vi.fn(),
}))

vi.mock("@/features/patients/hooks/use-patients", () => ({
  usePatients: vi.fn(),
}))

vi.mock("@/lib/auth/use-auth-session", () => ({
  useAuthSession: vi.fn(),
}))

const usePatientPrescriptionsMock = vi.mocked(usePatientPrescriptions)
const useDispensePrescriptionMock = vi.mocked(useDispensePrescription)
const useMedicationsMock = vi.mocked(useMedications)
const useCreatePrescriptionMock = vi.mocked(useCreatePrescription)
const usePatientsMock = vi.mocked(usePatients)
const useAuthSessionMock = vi.mocked(useAuthSession)

const patient = {
  clinicalHistory: { allergies: [], chronicDiseases: [], currentMedications: [], familyHistory: [] },
  contacts: [],
  id: "patient-1",
  isActive: true,
  medicalInsurance: null,
  personalData: { dateOfBirth: null, documentId: "DOC-001", firstName: "Ana", gender: "Femenino", lastName: "Paciente" },
}

const prescription: Prescription = {
  dispensedAt: null,
  dispensedBy: null,
  dosage: "1 tableta",
  doctorId: "doctor-1",
  frequency: "Cada 12 horas",
  id: "rx-1",
  instructions: "Con las comidas",
  medicalRecordId: "record-1",
  medicationId: "med-1",
  medicationName: "Metformina 850 mg",
  patientId: "patient-1",
  quantity: 30,
  status: "Emitida",
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe("PharmacyPrescriptionsPage", () => {
  it("keeps the patient context explicit and exposes dispensing to pharmacy", () => {
    configureMocks("Farmacia")

    render(<PharmacyPrescriptionsPage />, { wrapper: ({ children }) => <MemoryRouter initialEntries={["/app/pharmacy/prescriptions?patientId=patient-1"]}>{children}</MemoryRouter> })

    expect(screen.getByText(/no simula una cola global/i)).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Recetas del paciente" })).toBeInTheDocument()
    expect(screen.getByText("Metformina 850 mg")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Dispensar" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Nueva receta" })).not.toBeInTheDocument()
  })

  it("exposes prescription creation to doctors without exposing dispensing", () => {
    configureMocks("Medico")

    render(<PharmacyPrescriptionsPage />, { wrapper: ({ children }) => <MemoryRouter initialEntries={["/app/pharmacy/prescriptions?patientId=patient-1"]}>{children}</MemoryRouter> })

    expect(screen.getByRole("button", { name: "Nueva receta" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Dispensar" })).not.toBeInTheDocument()
  })
})

function configureMocks(role: "Farmacia" | "Medico") {
  useAuthSessionMock.mockReturnValue({
    clearSession: vi.fn(),
    hasAnyRole: (allowedRoles) => allowedRoles.includes(role),
    hasRole: (requestedRole) => requestedRole === role,
    session: { expiresAt: "2099-01-01T00:00:00.000Z", token: "token", user: { email: "user@example.com", fullName: "Usuario MediCore", roles: [role], userId: "user-1" } },
    setSession: vi.fn(),
  })
  usePatientsMock.mockReturnValue({ data: [patient], error: null, isError: false, isFetching: false, isPending: false, refetch: vi.fn() } as never)
  usePatientPrescriptionsMock.mockReturnValue({ data: [prescription], error: null, isError: false, isFetching: false, isPending: false, refetch: vi.fn() } as never)
  useDispensePrescriptionMock.mockReturnValue({ reset: vi.fn(), isError: false, isPending: false } as never)
  useMedicationsMock.mockReturnValue({ data: [], error: null, isError: false, isFetching: false, isPending: false, refetch: vi.fn() } as never)
  useCreatePrescriptionMock.mockReturnValue({ reset: vi.fn(), isError: false, isPending: false, mutateAsync: vi.fn() } as never)
}
