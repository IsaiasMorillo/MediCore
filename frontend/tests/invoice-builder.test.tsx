import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { InvoiceBuilder } from "@/features/billing/components/invoice-builder"
import type { Patient } from "@/features/patients/types"

const patients: Patient[] = [{
  clinicalHistory: { allergies: [], chronicDiseases: [], currentMedications: [], familyHistory: [] },
  contacts: [],
  id: "patient-1",
  isActive: true,
  medicalInsurance: null,
  personalData: { dateOfBirth: null, documentId: "DOC-001", firstName: "Ana", gender: "Femenino", lastName: "Paciente" },
}]

afterEach(() => {
  cleanup()
})

describe("InvoiceBuilder", () => {
  it("builds repeatable items and submits the patient context", async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(<InvoiceBuilder initialPatientId="patient-1" isSubmitting={false} onSubmit={onSubmit} patients={patients} />)

    await user.type(screen.getByLabelText("Descripción"), "Consulta general")
    await user.clear(screen.getByLabelText("Precio unitario"))
    await user.type(screen.getByLabelText("Precio unitario"), "850")
    await user.click(screen.getByRole("button", { name: "Agregar item" }))

    expect(screen.getByText("Consulta general")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Crear factura" }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({
      items: [{ appointmentId: null, description: "Consulta general", laboratoryOrderId: null, prescriptionId: null, quantity: 1, type: "Consulta", unitPrice: 850 }],
      patientId: "patient-1",
    }))
  })

  it("requires a patient and at least one item", async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(<InvoiceBuilder isSubmitting={false} onSubmit={onSubmit} patients={patients} />)

    await user.click(screen.getByRole("button", { name: "Crear factura" }))

    expect(screen.getByText("Selecciona un paciente antes de crear la factura.")).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
