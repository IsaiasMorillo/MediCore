import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { afterEach, describe, expect, it, vi } from "vitest"

import { MedicalRecordSearchPage } from "@/features/medical-records/pages/medical-record-search-page"
import { useClinicalHistorySearch } from "@/features/medical-records/hooks/use-medical-records"
import type { PatientClinicalHistoryResult } from "@/features/medical-records/types"

vi.mock("@/features/medical-records/hooks/use-medical-records", () => ({
  useClinicalHistorySearch: vi.fn(),
}))

const useClinicalHistorySearchMock = vi.mocked(useClinicalHistorySearch)
const searchResult: PatientClinicalHistoryResult = {
  clinicalHistory: {
    allergies: ["Penicilina"],
    chronicDiseases: [],
    currentMedications: [],
    familyHistory: [],
  },
  documentId: "DOC-001",
  medicalRecords: [{
    appointmentId: null,
    consultationDate: "2026-09-08T09:00:00.000Z",
    diagnosis: "Consulta de seguimiento",
    doctorId: "doctor-1",
    id: "record-1",
    laboratoryOrderIds: [],
    observations: "Paciente estable.",
    patientId: "patient-1",
    prescriptionIds: [],
    treatmentPlan: "Continuar seguimiento.",
    vitalSigns: { bloodPressure: "120/80", heartRate: 72, temperature: 36.7, weightKg: null },
  }],
  patientId: "patient-1",
  patientName: "Ana Paciente",
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe("MedicalRecordSearchPage", () => {
  it("searches first and exposes patient, history and record links", async () => {
    useClinicalHistorySearchMock.mockImplementation((term) => term
      ? createQueryResult([searchResult])
      : createQueryResult(undefined))
    const user = userEvent.setup()

    render(<MedicalRecordSearchPage />, { wrapper: MemoryRouter })

    expect(screen.getByText("Busca un paciente para comenzar")).toBeInTheDocument()
    await user.type(screen.getByRole("searchbox", { name: "Buscar historial clínico" }), "Ana")
    await user.click(screen.getByRole("button", { name: "Buscar historial" }))

    await waitFor(() => expect(useClinicalHistorySearchMock).toHaveBeenLastCalledWith("Ana"))
    expect(screen.getByRole("heading", { name: "Pacientes encontrados" })).toBeInTheDocument()
    expect(screen.getByText("Ana Paciente")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Ver historial" })).toHaveAttribute("href", "/app/medical-records/patient/patient-1")
    expect(screen.getByRole("link", { name: "Abrir registro record-1" })).toHaveAttribute("href", "/app/medical-records/record-1")
  })

  it("does not submit an empty clinical search", async () => {
    useClinicalHistorySearchMock.mockReturnValue(createQueryResult(undefined))
    const user = userEvent.setup()

    render(<MedicalRecordSearchPage />, { wrapper: MemoryRouter })

    await user.click(screen.getByRole("button", { name: "Buscar historial" }))

    expect(screen.getByRole("alert")).toHaveTextContent("Ingresa un nombre, documento o ID de paciente.")
    expect(useClinicalHistorySearchMock).toHaveBeenCalledWith("")
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
