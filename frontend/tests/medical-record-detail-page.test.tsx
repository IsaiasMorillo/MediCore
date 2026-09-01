import { cleanup, render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { afterEach, describe, expect, it, vi } from "vitest"

import { useDoctor } from "@/features/doctors/hooks/use-doctors"
import type { Doctor } from "@/features/doctors/types"
import { MedicalRecordDetailPage } from "@/features/medical-records/pages/medical-record-detail-page"
import { useMedicalRecord } from "@/features/medical-records/hooks/use-medical-records"
import type { MedicalRecord } from "@/features/medical-records/types"
import { usePatient } from "@/features/patients/hooks/use-patients"
import type { Patient } from "@/features/patients/types"
import { useAuthSession } from "@/lib/auth/use-auth-session"
import type { UserRole } from "@/lib/permissions/roles"

vi.mock("@/features/medical-records/hooks/use-medical-records", () => ({
  useMedicalRecord: vi.fn(),
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

const useMedicalRecordMock = vi.mocked(useMedicalRecord)
const useDoctorMock = vi.mocked(useDoctor)
const usePatientMock = vi.mocked(usePatient)
const useAuthSessionMock = vi.mocked(useAuthSession)

const record: MedicalRecord = {
  appointmentId: "appointment-1",
  consultationDate: "2026-09-08T09:00:00.000Z",
  diagnosis: "Hipertensión controlada",
  doctorId: "doctor-1",
  id: "record-1",
  laboratoryOrderIds: [],
  observations: "Paciente estable.",
  patientId: "patient-1",
  prescriptionIds: [],
  treatmentPlan: "Continuar seguimiento.",
  vitalSigns: { bloodPressure: "120/80", heartRate: 72, temperature: 36.7, weightKg: null },
}

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

const doctor: Doctor = {
  experienceYears: 8,
  firstName: "Laura",
  id: "doctor-1",
  isActive: true,
  lastName: "Médica",
  licenseNumber: "LIC-001",
  office: "Consultorio 204",
  schedule: [],
  specialty: "Cardiología",
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe("MedicalRecordDetailPage", () => {
  it("shows the immutable clinical record without exposing an edit action", () => {
    useMedicalRecordMock.mockReturnValue(createQueryResult(record))
    usePatientMock.mockReturnValue(createQueryResult(patient))
    useDoctorMock.mockReturnValue(createQueryResult(doctor))
    useAuthSessionMock.mockReturnValue(createMockAuthSession("Medico"))

    render(
      <MemoryRouter initialEntries={["/app/medical-records/record-1"]}>
        <Routes>
          <Route element={<MedicalRecordDetailPage />} path="/app/medical-records/:recordId" />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByRole("heading", { name: "Hipertensión controlada" })).toBeInTheDocument()
    expect(screen.getByText("Registro clínico protegido")).toBeInTheDocument()
    expect(screen.getByText("Paciente estable.")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Editar/i })).not.toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /Editar/i })).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Abrir cita/ })).toHaveAttribute("href", "/app/appointments/appointment-1")
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
      user: { email: "doctor@example.com", fullName: "Laura Médica", roles, userId: "doctor-1" },
    },
    setSession: vi.fn(),
  }
}
