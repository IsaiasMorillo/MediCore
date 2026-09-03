import { cleanup, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { afterEach, describe, expect, it, vi } from "vitest"

import { usePatientPortal } from "@/features/patient-portal/hooks/use-patient-portal"
import { PatientPortalPage } from "@/features/patient-portal/pages/patient-portal-page"
import type { ActivePrescription, PortalInvoice, PortalLaboratoryResult, UpcomingAppointment } from "@/features/patient-portal/types"
import { useAuthSession } from "@/lib/auth/use-auth-session"

vi.mock("@/features/patient-portal/hooks/use-patient-portal", () => ({
  usePatientPortal: vi.fn(),
}))

vi.mock("@/lib/auth/use-auth-session", () => ({
  useAuthSession: vi.fn(),
}))

const usePatientPortalMock = vi.mocked(usePatientPortal)
const useAuthSessionMock = vi.mocked(useAuthSession)

const appointment: UpcomingAppointment = {
  doctorId: "doctor-1",
  doctorName: "Dra. Ana Médico",
  endDateTime: "2026-09-08T10:45:00.000Z",
  id: "appointment-1",
  notes: "Traer resultados previos.",
  specialty: "Cardiología",
  startDateTime: "2026-09-08T10:00:00.000Z",
  status: "Confirmed",
}

const prescription: ActivePrescription = {
  createdAt: "2026-09-01T12:00:00.000Z",
  doctorId: "doctor-1",
  doctorName: "Dra. Ana Médico",
  dosage: "50 mg",
  frequency: "Una vez al día",
  id: "prescription-1",
  instructions: "Tomar después del desayuno.",
  medicationId: "medication-1",
  medicationName: "Losartán",
  quantity: 30,
}

const invoice: PortalInvoice = {
  balance: 500,
  coverageType: "SinSeguro",
  createdBy: "reception-user",
  discount: 0,
  id: "invoice-1",
  insuranceCoverage: 0,
  invoiceDate: "2026-09-02T12:00:00.000Z",
  items: [{ appointmentId: null, description: "Consulta médica", laboratoryOrderId: null, prescriptionId: null, quantity: 1, subtotal: 500, type: "Consulta", unitPrice: 500 }],
  number: "FAC-001",
  paidAmount: 0,
  payments: [],
  patientId: "patient-1",
  status: "Pendiente",
  subtotal: 500,
  taxes: 0,
  total: 500,
}

const laboratoryResult: PortalLaboratoryResult = {
  doctorId: "doctor-1",
  id: "lab-1",
  medicalRecordId: "record-1",
  patientId: "patient-1",
  requestedAt: "2026-08-30T12:00:00.000Z",
  results: { hemoglobina: 13.5, conclusion: "Resultado informado por laboratorio" },
  resultsLoadedAt: "2026-09-01T12:00:00.000Z",
  status: "ResultadoCargado",
  testType: "Hemograma",
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe("PatientPortalPage", () => {
  it("shows a patient-focused overview without internal metrics", () => {
    configureSession()
    configurePortal()

    renderPage("overview")

    expect(screen.getByRole("heading", { name: "Tu portal de salud" })).toBeInTheDocument()
    expect(screen.getByText("Todo lo importante de tu cuidado, en un solo lugar.")).toBeInTheDocument()
    expect(screen.getAllByText("Dra. Ana Médico")).not.toHaveLength(0)
    expect(screen.getByText("Facturas pendientes")).toBeInTheDocument()
    expect(screen.queryByText(/pacientes frecuentes/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/métricas administrativas/i)).not.toBeInTheDocument()
  })

  it("keeps invoice details read-only in the portal", () => {
    configureSession()
    configurePortal()

    renderPage("invoices")

    expect(screen.getByRole("heading", { name: "Mis facturas" })).toBeInTheDocument()
    expect(screen.getByText("Factura FAC-001")).toBeInTheDocument()
    expect(screen.getByText("Ver detalle de factura")).toBeInTheDocument()
    expect(screen.queryByText("Pagar online")).not.toBeInTheDocument()
    expect(screen.queryByText("Abrir paciente")).not.toBeInTheDocument()
  })

  it("explains when the patient account is not linked", () => {
    configureSession()
    usePatientPortalMock.mockReturnValue({
      appointments: createQueryResult([]),
      invoices: createQueryResult([]),
      isFetching: false,
      isInitialLoading: false,
      isUnlinked: true,
      laboratoryResults: createQueryResult([]),
      lastUpdatedAt: 0,
      prescriptions: createQueryResult([]),
      refresh: vi.fn(),
    } as never)

    renderPage("overview")

    expect(screen.getByRole("alert")).toHaveTextContent("Tu cuenta todavía no está vinculada a un expediente de paciente. Contacta con administración.")
    expect(screen.queryByRole("button", { name: "Actualizar información del portal" })).not.toBeInTheDocument()
  })
})

function renderPage(section: "overview" | "invoices") {
  return render(
    <MemoryRouter initialEntries={[`/portal${section === "overview" ? "" : `/${section}`}`]}>
      <PatientPortalPage section={section} />
    </MemoryRouter>
  )
}

function configureSession() {
  useAuthSessionMock.mockReturnValue({
    clearSession: vi.fn(),
    hasAnyRole: () => true,
    hasRole: () => true,
    session: {
      expiresAt: "2099-01-01T00:00:00.000Z",
      token: "token",
      user: { email: "ana@example.com", fullName: "Ana Paciente", roles: ["Paciente"], userId: "user-1" },
    },
    setSession: vi.fn(),
  })
}

function configurePortal() {
  usePatientPortalMock.mockReturnValue({
    appointments: createQueryResult([appointment]),
    invoices: createQueryResult([invoice]),
    isFetching: false,
    isInitialLoading: false,
    isUnlinked: false,
    laboratoryResults: createQueryResult([laboratoryResult]),
    lastUpdatedAt: 0,
    prescriptions: createQueryResult([prescription]),
    refresh: vi.fn(),
  } as never)
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
