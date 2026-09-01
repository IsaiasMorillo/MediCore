import { z } from "zod"

export const laboratoryOrderFormSchema = z.object({
  doctorId: z.string().trim().min(1, "Selecciona el médico solicitante."),
  medicalRecordId: z.string().trim(),
  patientId: z.string().trim().min(1, "Selecciona el paciente."),
  testType: z.string().trim().min(1, "Selecciona el tipo de examen."),
})

export type LaboratoryOrderFormValues = z.infer<typeof laboratoryOrderFormSchema>
