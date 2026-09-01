import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { Doctor } from "@/features/doctors/types"
import { LaboratoryOrderForm } from "@/features/laboratory/components/laboratory-order-form"
import type { Patient } from "@/features/patients/types"

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

const doctors: Doctor[] = [{
  experienceYears: 8,
  firstName: "Laura",
  id: "doctor-1",
  isActive: true,
  lastName: "Médica",
  licenseNumber: "LIC-001",
  office: "Consultorio 204",
  schedule: [],
  specialty: "Cardiología",
}]

afterEach(() => {
  cleanup()
})

describe("LaboratoryOrderForm", () => {
  it("submits a contextual order with the selected test type", async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(<LaboratoryOrderForm doctors={doctors} onSubmit={onSubmit} patients={patients} testTypes={["Hemograma", "Orina"]} />)

    await user.selectOptions(screen.getByLabelText("Paciente"), "patient-1")
    await user.selectOptions(screen.getByLabelText("Médico solicitante"), "doctor-1")
    await user.selectOptions(screen.getByLabelText("Tipo de examen"), "Hemograma")
    await user.click(screen.getByRole("button", { name: "Crear orden de laboratorio" }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      doctorId: "doctor-1",
      medicalRecordId: "",
      patientId: "patient-1",
      testType: "Hemograma",
    }), expect.anything()))
  })

  it("exposes the medical record reference as an accessible optional field", () => {
    render(<LaboratoryOrderForm doctors={doctors} initialMedicalRecordId="record-1" onSubmit={vi.fn()} patients={patients} testTypes={["Hemograma"]} />)

    expect(screen.getByLabelText(/ID del expediente clínico/)).toHaveValue("record-1")
    expect(screen.getByText(/Orden contextual originada desde el expediente/)).toBeInTheDocument()
  })
})
