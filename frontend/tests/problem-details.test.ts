import { describe, expect, it } from "vitest"

import {
  getProblemMessage,
  parseProblemDetails,
} from "@/lib/api/problem-details"

describe("ProblemDetails", () => {
  it("prioritizes detail, error and title in that order", () => {
    const problem = parseProblemDetails({
      detail: "El detalle explica el problema.",
      error: "Mensaje alternativo.",
      title: "Solicitud inválida",
    })

    expect(getProblemMessage(problem, 400)).toBe("El detalle explica el problema.")
  })

  it("returns a safe status message when the response is not a problem document", () => {
    expect(getProblemMessage(undefined, 403)).toBe(
      "No tienes permisos para realizar esta acción."
    )
    expect(getProblemMessage(undefined, 0)).toContain("conectar con MediCore")
  })
})
