import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import type { ReactNode } from "react"
import { MemoryRouter } from "react-router-dom"
import { afterEach, describe, expect, it, vi } from "vitest"

import { ReportsPage } from "@/features/reports/pages/reports-page"
import { useReports } from "@/features/reports/hooks/use-reports"
import { useAuthSession } from "@/lib/auth/use-auth-session"
import type { UserRole } from "@/lib/permissions/roles"

vi.mock("@/features/reports/hooks/use-reports", () => ({
  useReports: vi.fn(),
}))

vi.mock("@/lib/auth/use-auth-session", () => ({
  useAuthSession: vi.fn(),
}))

vi.mock("@/components/charts/area", () => ({
  Area: () => null,
}))

vi.mock("@/components/charts/area-chart", () => ({
  AreaChart: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}))

vi.mock("@/components/charts/bar", () => ({
  Bar: () => null,
}))

vi.mock("@/components/charts/bar-chart", () => ({
  BarChart: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}))

vi.mock("@/components/charts/bar-y-axis", () => ({
  BarYAxis: () => null,
}))

vi.mock("@/components/charts/grid", () => ({
  Grid: () => null,
}))

vi.mock("@/components/charts/tooltip/chart-tooltip", () => ({
  ChartTooltip: () => null,
}))

vi.mock("@/components/charts/x-axis", () => ({
  XAxis: () => null,
}))

const useReportsMock = vi.mocked(useReports)
const useAuthSessionMock = vi.mocked(useAuthSession)

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe("ReportsPage", () => {
  it("shows every report supported by an admin session", () => {
    configureSession("Admin")
    configureReports({ admin: true, pharmacy: true, laboratory: true })

    renderPage("/app/reports", "overview")

    expect(screen.getByRole("heading", { name: "Reportes" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Facturación" })).toHaveAttribute("href", "/app/reports/billing")
    expect(screen.getByRole("link", { name: "Farmacia" })).toHaveAttribute("href", "/app/reports/pharmacy")
    expect(screen.getByRole("link", { name: "Laboratorio" })).toHaveAttribute("href", "/app/reports/laboratory")
    expect(screen.getByRole("heading", { name: "Facturación" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Stock bajo" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Pruebas más solicitadas" })).toBeInTheDocument()
    expect(screen.getByLabelText("Desde")).toBeInTheDocument()
  })

  it("limits a pharmacy session to pharmacy reports", () => {
    configureSession("Farmacia")
    configureReports({ admin: false, pharmacy: true, laboratory: false })

    renderPage("/app/reports/pharmacy", "pharmacy")

    expect(screen.getByRole("heading", { name: "Reportes de farmacia" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Medicamentos más dispensados" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Stock bajo" })).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Facturación" })).not.toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Pruebas más solicitadas" })).not.toBeInTheDocument()
  })

  it("rejects an inverted billing range before changing the URL", () => {
    configureSession("Admin")
    configureReports({ admin: true, pharmacy: false, laboratory: false })

    renderPage("/app/reports/billing", "billing")

    fireEvent.change(screen.getByLabelText("Desde"), { target: { value: "2026-09-30" } })
    fireEvent.change(screen.getByLabelText("Hasta"), { target: { value: "2026-09-01" } })
    fireEvent.click(screen.getByRole("button", { name: "Aplicar período" }))

    expect(screen.getByRole("alert")).toHaveTextContent(/inicio no sea posterior/i)
  })
})

function renderPage(path: string, section: "overview" | "billing" | "pharmacy" | "laboratory") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ReportsPage section={section} />
    </MemoryRouter>
  )
}

function configureSession(role: UserRole) {
  const roles = [role]

  useAuthSessionMock.mockReturnValue({
    clearSession: vi.fn(),
    hasAnyRole: (allowedRoles: readonly UserRole[]) => allowedRoles.some((allowedRole) => roles.includes(allowedRole)),
    hasRole: (requestedRole: UserRole) => roles.includes(requestedRole),
    session: {
      expiresAt: "2099-01-01T00:00:00.000Z",
      token: "token",
      user: { email: "user@example.com", fullName: "Usuario MediCore", roles, userId: "user-1" },
    },
    setSession: vi.fn(),
  })
}

function configureReports({ admin, laboratory, pharmacy }: { admin: boolean; laboratory: boolean; pharmacy: boolean }) {
  useReportsMock.mockReturnValue({
    billing: createQueryResult([
      { invoiceCount: 4, month: 8, totalInvoiced: 4000, year: 2026 },
    ]),
    canViewLaboratoryReports: laboratory,
    canViewPharmacyReports: pharmacy,
    isAdmin: admin,
    isFetching: false,
    isLaboratory: laboratory,
    isPharmacy: pharmacy,
    laboratoryMostRequested: createQueryResult([{ count: 8, key: "Hemograma", label: "Hemograma" }]),
    lastUpdatedAt: 0,
    lowStock: createQueryResult([{ medicationId: "med-1", medicationName: "Losartán 50 mg", reorderLevel: 10, stockQuantity: 4 }]),
    medicationsDispensed: createQueryResult([{ medicationId: "med-1", medicationName: "Losartán 50 mg", prescriptionCount: 3, totalQuantity: 12 }]),
    patientsMostFrequent: createQueryResult([{ count: 5, key: "patient-1", label: "Ana Paciente" }]),
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
  }
}
