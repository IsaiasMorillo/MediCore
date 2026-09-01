import { z } from "zod"

const optionalText = z.string().trim()

const patientContactSchema = z
  .object({
    name: optionalText,
    phone: optionalText,
    type: z.string().trim().min(1, "Selecciona el tipo de contacto."),
    value: optionalText,
  })
  .superRefine((contact, context) => {
    if (contact.type === "Emergency") {
      if (!contact.name) {
        context.addIssue({
          code: "custom",
          message: "Ingresa el nombre del contacto de emergencia.",
          path: ["name"],
        })
      }

      if (!contact.phone) {
        context.addIssue({
          code: "custom",
          message: "Ingresa el teléfono de emergencia.",
          path: ["phone"],
        })
      }
    } else if (!contact.value) {
      context.addIssue({
        code: "custom",
        message: "Ingresa el valor del contacto.",
        path: ["value"],
      })
    }
  })

export const patientFormSchema = z.object({
  allergies: optionalText,
  chronicDiseases: optionalText,
  contacts: z.array(patientContactSchema),
  currentMedications: optionalText,
  dateOfBirth: z.string().refine(
    (value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value),
    "Ingresa una fecha válida."
  ),
  documentId: z.string().trim().min(1, "Ingresa el documento de identidad."),
  familyHistory: optionalText,
  firstName: z.string().trim().min(1, "Ingresa el nombre."),
  gender: z.string().trim().min(1, "Ingresa el género."),
  insuranceCoverageType: optionalText,
  insuranceEnabled: z.boolean(),
  insurancePolicyNumber: optionalText,
  insuranceProvider: optionalText,
  isActive: z.boolean(),
  lastName: z.string().trim().min(1, "Ingresa el apellido."),
})

export type PatientFormValues = z.infer<typeof patientFormSchema>
