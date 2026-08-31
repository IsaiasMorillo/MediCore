import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"

import { Sidebar } from "@/components/layout/sidebar"
import { getVisibleNavigation } from "@/lib/permissions/navigation"

describe("Sidebar", () => {
  it("renders accessible role-filtered navigation links", () => {
    render(
      <MemoryRouter initialEntries={["/app/patients"]}>
        <Sidebar groups={getVisibleNavigation(["Recepcion"])} />
      </MemoryRouter>
    )

    expect(screen.getByRole("link", { name: "Pacientes" })).toHaveAttribute(
      "aria-current",
      "page"
    )
    expect(screen.queryByRole("link", { name: "Reportes" })).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Facturación" })).toHaveAttribute(
      "href",
      "/app/billing"
    )
  })
})
