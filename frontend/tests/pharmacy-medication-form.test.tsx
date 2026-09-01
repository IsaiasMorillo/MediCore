import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { MedicationForm } from "@/features/pharmacy/components/medication-form"

afterEach(() => {
  cleanup()
})

describe("MedicationForm", () => {
  it("submits numeric inventory values without allowing a negative stock", async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(<MedicationForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText("Nombre"), "Metformina 850 mg")
    await user.type(screen.getByLabelText("Código"), "MET-850")
    await user.type(screen.getByLabelText("Categoría"), "Antidiabéticos")
    await user.clear(screen.getByLabelText("Stock inicial"))
    await user.type(screen.getByLabelText("Stock inicial"), "50")
    await user.clear(screen.getByLabelText("Precio unitario"))
    await user.type(screen.getByLabelText("Precio unitario"), "120.50")
    await user.click(screen.getByRole("button", { name: "Registrar medicamento" }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ code: "MET-850", price: 120.5, stockQuantity: 50 }), expect.anything()))
  })

  it("keeps stock read-only during metadata edits", () => {
    render(<MedicationForm initialValues={{ name: "Losartán", stockQuantity: 12 }} isEditing onSubmit={vi.fn()} />)

    expect(screen.getByLabelText("Stock inicial")).toHaveAttribute("readonly")
    expect(screen.getByText(/stock actual se conserva/i)).toBeInTheDocument()
  })
})
