import { z } from "zod"

const dateValue = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Selecciona una fecha válida.")
const timeValue = z.string().regex(/^\d{2}:\d{2}$/, "Selecciona un horario disponible.")

export const appointmentFormSchema = z.object({
  appointmentDate: dateValue,
  doctorId: z.string().trim().min(1, "Selecciona un médico."),
  durationMinutes: z.number().int("Ingresa una duración válida.").min(1, "La duración debe ser mayor a cero."),
  notes: z.string().trim().max(1000, "Las notas no pueden superar 1000 caracteres."),
  patientId: z.string().trim().min(1, "Selecciona un paciente."),
  startTime: timeValue,
})

export type AppointmentFormValues = z.infer<typeof appointmentFormSchema>
