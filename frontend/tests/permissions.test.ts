import { describe, expect, it } from "vitest"

import {
  getVisibleNavigation,
  isNavigationItemActive,
} from "@/lib/permissions/navigation"
import { APPOINTMENT_WRITE_ROLES, BILLING_ROLES, CLINICAL_ROLES, LABORATORY_ORDER_WRITE_ROLES, LABORATORY_RESULT_WRITE_ROLES, LABORATORY_ROLES, NURSING_ROLES, NURSING_WRITE_ROLES, PHARMACY_MANAGE_ROLES, PHARMACY_ROLES, PRESCRIPTION_WRITE_ROLES } from "@/lib/permissions/route-roles"

describe("navigation permissions", () => {
  it("shows only the sections available to a reception user", () => {
    const groups = getVisibleNavigation(["Recepcion"])
    const labels = groups.flatMap((group) => group.items.map((item) => item.label))

    expect(labels).toEqual(["Dashboard", "Pacientes", "Citas", "Médicos", "Facturación"])
    expect(groups.every((group) => group.items.length > 0)).toBe(true)
  })

  it("does not expose administrative reports to clinical-only roles", () => {
    const groups = getVisibleNavigation(["Medico"])
    const labels = groups.flatMap((group) => group.items.map((item) => item.label))

    expect(labels).not.toContain("Reportes")
    expect(labels).not.toContain("Cuentas")
    expect(isNavigationItemActive("/app", "/app")).toBe(true)
    expect(isNavigationItemActive("/app/patients", "/app")).toBe(false)
  })

  it("limits appointment mutations to reception and administration", () => {
    expect(APPOINTMENT_WRITE_ROLES).toEqual(["Admin", "Recepcion"])
  })

  it("exposes clinical records only to doctor and administration roles", () => {
    const clinicalLabels = getVisibleNavigation(["Medico"]).flatMap((group) => group.items.map((item) => item.label))
    const receptionLabels = getVisibleNavigation(["Recepcion"]).flatMap((group) => group.items.map((item) => item.label))

    expect(CLINICAL_ROLES).toEqual(["Admin", "Medico"])
    expect(clinicalLabels).toContain("Expedientes")
    expect(receptionLabels).not.toContain("Expedientes")
  })

  it("keeps nursing creation narrower than nursing history access", () => {
    expect(NURSING_ROLES).toEqual(["Admin", "Medico", "Enfermero"])
    expect(NURSING_WRITE_ROLES).toEqual(["Admin", "Enfermero"])
  })

  it("separates laboratory order creation from result loading", () => {
    expect(LABORATORY_ROLES).toEqual(["Admin", "Medico", "Laboratorio"])
    expect(LABORATORY_ORDER_WRITE_ROLES).toEqual(["Admin", "Medico"])
    expect(LABORATORY_RESULT_WRITE_ROLES).toEqual(["Admin", "Laboratorio"])
  })

  it("separates pharmacy visibility, inventory management and prescription creation", () => {
    expect(PHARMACY_ROLES).toEqual(["Admin", "Medico", "Farmacia"])
    expect(PHARMACY_MANAGE_ROLES).toEqual(["Admin", "Farmacia"])
    expect(PRESCRIPTION_WRITE_ROLES).toEqual(["Admin", "Medico"])
  })

  it("limits billing access to reception and administration", () => {
    expect(BILLING_ROLES).toEqual(["Admin", "Recepcion"])
    expect(getVisibleNavigation(["Recepcion"]).flatMap((group) => group.items.map((item) => item.label))).toContain("Facturación")
    expect(getVisibleNavigation(["Medico"]).flatMap((group) => group.items.map((item) => item.label))).not.toContain("Facturación")
  })
})
