import { cleanup, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { afterEach, describe, expect, it, vi } from "vitest"

import { PharmacyMedicationsPage } from "@/features/pharmacy/pages/pharmacy-medications-page"
import { useAdjustMedicationStock, useMedications } from "@/features/pharmacy/hooks/use-pharmacy"
import type { Medication } from "@/features/pharmacy/types"
import { useAuthSession } from "@/lib/auth/use-auth-session"

vi.mock("@/features/pharmacy/hooks/use-pharmacy", () => ({
  useAdjustMedicationStock: vi.fn(),
  useMedications: vi.fn(),
}))

vi.mock("@/lib/auth/use-auth-session", () => ({
  useAuthSession: vi.fn(),
}))

const useAdjustMedicationStockMock = vi.mocked(useAdjustMedicationStock)
const useMedicationsMock = vi.mocked(useMedications)
const useAuthSessionMock = vi.mocked(useAuthSession)

const medication: Medication = {
  category: "Cardiología",
  code: "LOS-50",
  expirationDate: null,
  id: "med-1",
  isActive: true,
  name: "Losartán 50 mg",
  price: 250.5,
  reorderLevel: 10,
  stockQuantity: 30,
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe("PharmacyMedicationsPage", () => {
  it("exposes inventory management to pharmacy users", () => {
    configureMocks("Farmacia")

    render(<PharmacyMedicationsPage />, { wrapper: MemoryRouter })

    expect(screen.getByRole("link", { name: "Nuevo medicamento" })).toHaveAttribute("href", "/app/pharmacy/medications/new")
    expect(screen.getAllByText("Losartán 50 mg").length).toBeGreaterThan(0)
    expect(screen.getByRole("button", { name: "Ajustar stock de Losartán 50 mg" })).toBeInTheDocument()
  })

  it("keeps medication mutations hidden from doctors", () => {
    configureMocks("Medico")

    render(<PharmacyMedicationsPage />, { wrapper: MemoryRouter })

    expect(screen.queryByRole("link", { name: "Nuevo medicamento" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Ajustar stock de Losartán 50 mg" })).not.toBeInTheDocument()
    expect(screen.getAllByText("Losartán 50 mg").length).toBeGreaterThan(0)
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
  useMedicationsMock.mockReturnValue({ data: [medication], error: null, isError: false, isFetching: false, isPending: false, refetch: vi.fn() } as never)
  useAdjustMedicationStockMock.mockReturnValue({ reset: vi.fn(), isError: false, isPending: false } as never)
}
