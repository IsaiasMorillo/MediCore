import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { Toast } from "@/components/feedback"
import { PatientSearchCombobox } from "@/components/hospital"
import { ConfirmActionDialog, DataTable, EmptyState, FormField, PaginationPlaceholder, SearchInput, type DataTableColumn } from "@/components/ui"
import type { Patient } from "@/features/patients/types"

afterEach(() => {
  cleanup()
})

describe("transversal data and feedback components", () => {
  it("renders a searchable input and exposes its clear action", async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()

    render(<SearchInput label="Buscar pacientes" onChange={onChange} value="Carlos" />)

    expect(screen.getByRole("searchbox", { name: "Buscar pacientes" })).toHaveValue("Carlos")
    await user.click(screen.getByRole("button", { name: "Limpiar buscar pacientes" }))

    expect(onChange).toHaveBeenCalledWith("")
  })

  it("keeps table rows accessible and delegates pagination changes", async () => {
    type Row = { id: string; name: string }
    const columns: DataTableColumn<Row>[] = [{ header: "Nombre", key: "name", render: (row) => row.name }]
    const onPageChange = vi.fn()
    const user = userEvent.setup()

    render(<><DataTable caption="Pacientes" columns={columns} getRowKey={(row) => row.id} rows={[{ id: "patient-1", name: "Carlos Paciente" }]} /><PaginationPlaceholder page={2} pageCount={3} onPageChange={onPageChange} /></>)

    expect(screen.getByRole("table", { name: "Pacientes" })).toBeInTheDocument()
    expect(screen.getByRole("cell", { name: "Carlos Paciente" })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Página siguiente" }))

    expect(onPageChange).toHaveBeenCalledWith(3)
  })

  it("associates form errors with their field and supports dialog escape", () => {
    const onClose = vi.fn()

    render(<><FormField error="El correo es obligatorio" id="email" label="Correo"><input aria-describedby="email-error" aria-invalid="true" id="email" /></FormField><ConfirmActionDialog description="Confirma la acción." onClose={onClose} onConfirm={vi.fn()} open title="Confirmar" /></>)

    expect(screen.getByLabelText("Correo")).toHaveAttribute("aria-invalid", "true")
    expect(screen.getByText("El correo es obligatorio")).toBeInTheDocument()
    expect(screen.getByRole("dialog", { name: "Confirmar" })).toBeInTheDocument()

    fireEvent.keyDown(document, { key: "Escape" })

    expect(onClose).toHaveBeenCalledOnce()
  })

  it("renders an empty state action and a dismissible toast", async () => {
    const onDismiss = vi.fn()
    const user = userEvent.setup()

    render(<><EmptyState action={<button type="button">Crear registro</button>} description="Añade un registro para comenzar." title="Sin registros" /><Toast message="El registro fue guardado." onDismiss={onDismiss} tone="success" /></>)

    expect(screen.getByText("Sin registros")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Crear registro" })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Cerrar notificación" }))

    expect(onDismiss).toHaveBeenCalledOnce()
  })
})

describe("hospital search components", () => {
  it("selects a patient from the accessible combobox", async () => {
    const user = userEvent.setup()

    render(<PatientSearchHarness />)

    const input = screen.getByRole("combobox", { name: "Paciente" })
    expect(input).toHaveValue("Carlos Paciente")
    await user.click(input)
    await user.click(screen.getByRole("button", { name: /Carlos Paciente/ }))

    expect(input).toHaveValue("Carlos Paciente")
  })
})

function PatientSearchHarness() {
  const [value, setValue] = useState("patient-1")
  const patient: Patient = {
    clinicalHistory: { allergies: [], chronicDiseases: [], currentMedications: [], familyHistory: [] },
    contacts: [{ type: "Phone", value: "809-555-0000" }],
    id: "patient-1",
    isActive: true,
    medicalInsurance: null,
    personalData: { dateOfBirth: "1990-01-01", documentId: "DOC-001", firstName: "Carlos", gender: "Masculino", lastName: "Paciente" },
  }

  return <PatientSearchCombobox onChange={setValue} patients={[patient]} value={value} />
}
