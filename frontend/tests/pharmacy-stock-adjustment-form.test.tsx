import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { StockAdjustmentForm } from "@/features/pharmacy/components/stock-adjustment-form"
import type { Medication } from "@/features/pharmacy/types"

const medication: Medication = {
  category: "Analgésicos",
  code: "IBU-400",
  expirationDate: null,
  id: "med-1",
  isActive: true,
  name: "Ibuprofeno 400 mg",
  price: 85,
  reorderLevel: 5,
  stockQuantity: 10,
}

afterEach(() => {
  cleanup()
})

describe("StockAdjustmentForm", () => {
  it("requires confirmation and submits the selected stock movement", async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(<StockAdjustmentForm medication={medication} onCancel={vi.fn()} onSubmit={onSubmit} />)

    await user.click(screen.getByRole("button", { name: "Confirmar ajuste" }))
    expect(await screen.findByRole("alert")).toHaveTextContent("Confirma el ajuste")
    expect(onSubmit).not.toHaveBeenCalled()

    await user.click(screen.getByRole("radio", { name: /salida/i }))
    await user.clear(screen.getByLabelText("Cantidad de unidades"))
    await user.type(screen.getByLabelText("Cantidad de unidades"), "3")
    await user.click(screen.getByRole("checkbox"))
    await user.click(screen.getByRole("button", { name: "Confirmar ajuste" }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ direction: "salida", quantity: 3 })))
  })
})
