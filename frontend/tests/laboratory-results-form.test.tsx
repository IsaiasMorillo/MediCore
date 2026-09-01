import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { LaboratoryResultsForm } from "@/features/laboratory/components/laboratory-results-form"
import { getLaboratoryResultTemplate } from "@/features/laboratory/utils/laboratory-result-templates"

afterEach(() => {
  cleanup()
})

describe("LaboratoryResultsForm", () => {
  it("builds a typed result dictionary from the test template", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(<LaboratoryResultsForm fields={getLaboratoryResultTemplate("Hemograma")} onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText("Hemoglobina"), "13.2")
    await user.type(screen.getByLabelText("Hematocrito"), "41")
    await user.click(screen.getByRole("button", { name: "Guardar resultados" }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ hemoglobina: 13.2, hematocrito: 41 }))
  })

  it("rejects an empty structured result submission", async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(<LaboratoryResultsForm fields={getLaboratoryResultTemplate("Orina")} onSubmit={onSubmit} />)

    await user.click(screen.getByRole("button", { name: "Guardar resultados" }))

    expect(await screen.findByRole("alert")).toHaveTextContent("Ingresa al menos un resultado antes de guardar.")
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
