import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { MedicalRecordForm } from "@/features/medical-records/components/medical-record-form"
import type { Doctor } from "@/features/doctors/types"
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

describe("MedicalRecordForm", () => {
  it("requires the review confirmation before submitting clinical data", async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(<MedicalRecordForm doctors={doctors} onSubmit={onSubmit} patients={patients} />)

    expect(screen.getByText(/Los expedientes clínicos son registros médicos y deben verificarse antes de su creación/)).toBeInTheDocument()
    await fillRequiredFields(user)
    await user.click(screen.getByRole("button", { name: "Crear expediente clínico" }))

    expect(await screen.findByRole("alert")).toHaveTextContent("Confirma que verificaste el registro clínico.")
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("submits the separated clinical sections after confirmation", async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(<MedicalRecordForm doctors={doctors} onSubmit={onSubmit} patients={patients} />)

    await fillRequiredFields(user)
    await user.click(screen.getByRole("checkbox", { name: /He verificado/i }))
    await user.click(screen.getByRole("button", { name: "Crear expediente clínico" }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      bloodPressure: "120/80",
      diagnosis: "Consulta de seguimiento",
      doctorId: "doctor-1",
      observations: "Paciente estable.",
      patientId: "patient-1",
      treatmentPlan: "Continuar seguimiento.",
    }), expect.anything()))
  })
})

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.selectOptions(screen.getByLabelText("Paciente"), "patient-1")
  await user.selectOptions(screen.getByLabelText("Médico responsable"), "doctor-1")
  await user.type(screen.getByLabelText("Presión arterial"), "120/80")
  await user.type(screen.getByLabelText("Diagnóstico"), "Consulta de seguimiento")
  await user.type(screen.getByLabelText("Observaciones clínicas"), "Paciente estable.")
  await user.type(screen.getByLabelText("Plan de tratamiento"), "Continuar seguimiento.")
}
