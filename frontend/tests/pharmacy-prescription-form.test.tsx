import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { Doctor } from "@/features/doctors/types"
import { PrescriptionForm } from "@/features/pharmacy/components/prescription-form"
import type { Medication } from "@/features/pharmacy/types"
import type { Patient } from "@/features/patients/types"

const patients: Patient[] = [{ clinicalHistory: { allergies: [], chronicDiseases: [], currentMedications: [], familyHistory: [] }, contacts: [], id: "patient-1", isActive: true, medicalInsurance: null, personalData: { dateOfBirth: null, documentId: "DOC-001", firstName: "Ana", gender: "Femenino", lastName: "Paciente" }}]
const doctors: Doctor[] = [{ experienceYears: 8, firstName: "Laura", id: "doctor-1", isActive: true, lastName: "Médica", licenseNumber: "LIC-001", office: "Consultorio 204", schedule: [], specialty: "Cardiología" }]
const medications: Medication[] = [{ category: "Cardiología", code: "LOS-50", expirationDate: null, id: "med-1", isActive: true, name: "Losartán 50 mg", price: 250.5, reorderLevel: 10, stockQuantity: 50 }]

afterEach(() => {
  cleanup()
})

describe("PrescriptionForm", () => {
  it("submits a prescription with the medical record context", async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(<PrescriptionForm doctors={doctors} initialMedicalRecordId="record-1" initialPatientId="patient-1" medications={medications} onSubmit={onSubmit} patients={patients} />)

    await user.selectOptions(screen.getByLabelText("Médico prescriptor"), "doctor-1")
    await user.selectOptions(screen.getByLabelText("Medicamento"), "med-1")
    await user.type(screen.getByLabelText("Dosis"), "1 tableta")
    await user.type(screen.getByLabelText("Frecuencia"), "Cada 12 horas")
    await user.clear(screen.getByLabelText("Cantidad"))
    await user.type(screen.getByLabelText("Cantidad"), "30")
    await user.type(screen.getByLabelText("Instrucciones"), "Con las comidas")
    await user.click(screen.getByRole("button", { name: "Emitir receta" }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ doctorId: "doctor-1", medicalRecordId: "record-1", medicationId: "med-1", patientId: "patient-1", quantity: 30 }), expect.anything()))
    expect(screen.queryByLabelText(/dispensado por/i)).not.toBeInTheDocument()
  })
})
