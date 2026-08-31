import { describe, expect, it } from "vitest"

import {
  getVisibleNavigation,
  isNavigationItemActive,
} from "@/lib/permissions/navigation"

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
})
