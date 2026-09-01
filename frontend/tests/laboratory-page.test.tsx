import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { afterEach, describe, expect, it, vi } from "vitest"

import { useLaboratoryTestTypes, usePatientLaboratoryOrders } from "@/features/laboratory/hooks/use-laboratory"
import { LaboratoryPage } from "@/features/laboratory/pages/laboratory-page"
import type { LaboratoryOrder } from "@/features/laboratory/types"
import type { Patient } from "@/features/patients/types"
import { usePatients } from "@/features/patients/hooks/use-patients"
import { useAuthSession } from "@/lib/auth/use-auth-session"
import type { UserRole } from "@/lib/permissions/roles"

vi.mock("@/features/laboratory/hooks/use-laboratory", () => ({
  useLaboratoryTestTypes: vi.fn(),
  usePatientLaboratoryOrders: vi.fn(),
}))

vi.mock("@/features/patients/hooks/use-patients", () => ({
  usePatients: vi.fn(),
}))

vi.mock("@/lib/auth/use-auth-session", () => ({
  useAuthSession: vi.fn(),
}))

const useLaboratoryTestTypesMock = vi.mocked(useLaboratoryTestTypes)
const usePatientLaboratoryOrdersMock = vi.mocked(usePatientLaboratoryOrders)
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

const order: LaboratoryOrder = {
  doctorId: "doctor-1",
  id: "order-1",
  medicalRecordId: "record-1",
  patientId: "patient-1",
  requestedAt: "2026-09-08T09:00:00.000Z",
  results: null,
  resultsLoadedAt: null,
  status: "SolicitudPendiente",
  testType: "Hemograma",
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe("LaboratoryPage", () => {
  it("keeps the global queue explicit and lets laboratory users open patient orders", async () => {
    configureMocks("Laboratorio")
    const user = userEvent.setup()

    render(<LaboratoryPage />, { wrapper: MemoryRouter })

    expect(screen.getByText(/no simula una bandeja global/i)).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Crear orden" })).not.toBeInTheDocument()
    await user.selectOptions(screen.getByRole("combobox", { name: "Paciente para órdenes de laboratorio" }), "patient-1")

    expect(await screen.findByRole("heading", { name: "Órdenes del paciente" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Hemograma" })).toBeInTheDocument()
    expect(screen.getByText("Solicitud pendiente")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Abrir orden/ })).toHaveAttribute("href", "/app/laboratory/orders/order-1")
    expect(screen.getByRole("link", { name: "Cargar resultados" })).toBeInTheDocument()
  })

  it("exposes order creation to doctors", () => {
    configureMocks("Medico")

    render(<LaboratoryPage />, { wrapper: MemoryRouter })

    expect(screen.getByRole("link", { name: "Crear orden" })).toHaveAttribute("href", "/app/laboratory/orders/new")
  })
})

function configureMocks(role: UserRole) {
  useAuthSessionMock.mockReturnValue(createMockAuthSession(role))
  usePatientsMock.mockReturnValue(createQueryResult([patient]))
  useLaboratoryTestTypesMock.mockReturnValue(createQueryResult({ supported: ["Hemograma", "Orina"], templates: ["Hemograma", "Orina"] }))
  usePatientLaboratoryOrdersMock.mockImplementation((patientId) => createQueryResult(patientId ? [order] : undefined))
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
