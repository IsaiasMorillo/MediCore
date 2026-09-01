import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { Patient } from "@/features/patients/types"
import { VitalsForm } from "@/features/nursing/components/vitals-form"

const patients: Patient[] = [{
  clinicalHistory: { allergies: [], chronicDiseases: [], currentMedications: [], familyHistory: [] },
  contacts: [],
  id: "patient-1",
  isActive: true,
  medicalInsurance: null,
  personalData: {
    dateOfBirth: null,
    documentId: "DOC-001",
    firstName: "Ana",
    gender: "Femenino",
    lastName: "Paciente",
  },
}]

afterEach(() => {
  cleanup()
})

describe("VitalsForm", () => {
  it("does not submit an empty measurement", async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(<VitalsForm onSubmit={onSubmit} patients={patients} />)

    await user.selectOptions(screen.getByLabelText("Paciente"), "patient-1")
    await user.click(screen.getByRole("button", { name: "Registrar signos vitales" }))

    expect(await screen.findByRole("alert")).toHaveTextContent("Registra al menos un signo vital.")
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("submits measured values and notes without asking for recordedBy", async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(<VitalsForm onSubmit={onSubmit} patients={patients} />)

    await user.selectOptions(screen.getByLabelText("Paciente"), "patient-1")
    await user.type(screen.getByLabelText("Frecuencia cardiaca"), "72")
    await user.type(screen.getByLabelText("Notas de enfermería"), "Medición en reposo.")
    await user.click(screen.getByRole("button", { name: "Registrar signos vitales" }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      heartRate: "72",
      notes: "Medición en reposo.",
      patientId: "patient-1",
    }), expect.anything()))
    expect(screen.queryByLabelText(/registrado por/i)).not.toBeInTheDocument()
  })
})
