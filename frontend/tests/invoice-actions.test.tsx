import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { InvoicePaymentDialog } from "@/features/billing/components/invoice-actions"
import type { Invoice } from "@/features/billing/types"

const invoice: Invoice = {
  balance: 500,
  coverageType: "SinSeguro",
  createdBy: "Recepción",
  discount: 0,
  id: "invoice-1",
  invoiceDate: "2026-09-01T10:00:00Z",
  items: [],
  number: "FAC-001",
  paidAmount: 0,
  payments: [],
  patientId: "patient-1",
  status: "Pendiente",
  subtotal: 500,
  taxes: 90,
  total: 590,
  insuranceCoverage: 0,
}

afterEach(() => {
  cleanup()
})

describe("InvoicePaymentDialog", () => {
  it("submits a valid payment and prevents overpayment in the UI", async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(<InvoicePaymentDialog invoice={invoice} isPending={false} onCancel={vi.fn()} onSubmit={onSubmit} />)

    await user.click(screen.getByRole("button", { name: "Confirmar pago" }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ amount: 500, method: "Efectivo" }))

    cleanup()
    onSubmit.mockClear()
    render(<InvoicePaymentDialog invoice={invoice} isPending={false} onCancel={vi.fn()} onSubmit={onSubmit} />)
    await user.clear(screen.getByLabelText("Monto"))
    await user.type(screen.getByLabelText("Monto"), "501")
    await user.click(screen.getByRole("button", { name: "Confirmar pago" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(/no puede superar el saldo/i)
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
