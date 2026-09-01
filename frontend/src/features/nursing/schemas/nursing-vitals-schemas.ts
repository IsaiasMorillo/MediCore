import { z } from "zod"

const optionalNumber = z.string().trim().refine(
  (value) => value === "" || Number.isFinite(Number(value)),
  "Ingresa un número válido."
)

const optionalInteger = z.string().trim().refine(
  (value) => value === "" || Number.isInteger(Number(value)),
  "Ingresa un número entero válido."
)

export const nursingVitalsFormSchema = z.object({
  appointmentId: z.string().trim(),
  bloodPressure: z.string().trim(),
  heartRate: optionalInteger,
  notes: z.string().trim(),
  patientId: z.string().trim().min(1, "Selecciona un paciente."),
  temperature: optionalNumber,
  weightKg: optionalNumber,
}).superRefine((values, context) => {
  const hasVitalSign = Boolean(values.bloodPressure || values.heartRate || values.temperature || values.weightKg)

  if (!hasVitalSign) {
    context.addIssue({
      code: "custom",
      message: "Registra al menos un signo vital.",
      path: ["bloodPressure"],
    })
  }
})

export type NursingVitalsFormValues = z.infer<typeof nursingVitalsFormSchema>

export function parseOptionalNumber(value: string) {
  const normalizedValue = value.trim()
  return normalizedValue ? Number(normalizedValue) : null
}
