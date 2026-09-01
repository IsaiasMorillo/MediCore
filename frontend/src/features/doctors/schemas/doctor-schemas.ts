import { z } from "zod"

const timeValue = z.string().regex(/^\d{2}:\d{2}$/, "Ingresa una hora válida.")

const scheduleShiftSchema = z
  .object({
    day: z.string().trim().min(1, "Selecciona un día."),
    endTime: timeValue,
    startTime: timeValue,
  })
  .refine((shift) => shift.startTime < shift.endTime, {
    message: "La hora de inicio debe ser anterior a la hora de fin.",
    path: ["endTime"],
  })

export const doctorFormSchema = z.object({
  experienceYears: z.number().int("Ingresa años completos.").min(0, "La experiencia no puede ser negativa."),
  firstName: z.string().trim().min(1, "Ingresa el nombre."),
  isActive: z.boolean(),
  lastName: z.string().trim().min(1, "Ingresa el apellido."),
  licenseNumber: z.string().trim().min(1, "Ingresa el número de licencia médica."),
  office: z.string().trim().min(1, "Ingresa el consultorio."),
  schedule: z.array(scheduleShiftSchema).min(1, "Agrega al menos un turno a la agenda."),
  specialty: z.string().trim().min(1, "Ingresa la especialidad."),
})

export type DoctorFormValues = z.infer<typeof doctorFormSchema>
