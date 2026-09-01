import { z } from "zod"

const optionalNumber = z.string().trim().refine(
  (value) => value === "" || Number.isFinite(Number(value)),
  "Ingresa un número válido."
)

const optionalInteger = z.string().trim().refine(
  (value) => value === "" || Number.isInteger(Number(value)),
  "Ingresa un número entero válido."
)

export const medicalRecordFormSchema = z.object({
  appointmentId: z.string().trim(),
  bloodPressure: z.string().trim(),
  diagnosis: z.string().trim().min(1, "Ingresa el diagnóstico."),
  doctorId: z.string().trim().min(1, "Selecciona el médico responsable."),
  heartRate: optionalInteger,
  observations: z.string().trim(),
  patientId: z.string().trim().min(1, "Selecciona el paciente."),
  reviewed: z.boolean().refine((value) => value, "Confirma que verificaste el registro clínico."),
  temperature: optionalNumber,
  treatmentPlan: z.string().trim(),
  weightKg: optionalNumber,
})

export type MedicalRecordFormValues = z.infer<typeof medicalRecordFormSchema>

export function parseOptionalNumber(value: string) {
  const normalizedValue = value.trim()
  return normalizedValue ? Number(normalizedValue) : null
}
