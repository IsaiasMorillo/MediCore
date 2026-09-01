import { z } from "zod"

const optionalDate = z.string().trim().refine((value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value), "Ingresa una fecha válida.")

export const medicationFormSchema = z.object({
  category: z.string().trim().max(80, "La categoría es demasiado larga."),
  code: z.string().trim().min(1, "Ingresa el código del medicamento.").max(40, "El código es demasiado largo."),
  expirationDate: optionalDate,
  isActive: z.boolean(),
  name: z.string().trim().min(1, "Ingresa el nombre del medicamento.").max(160, "El nombre es demasiado largo."),
  price: z.number({ error: "Ingresa un precio válido." }).finite().min(0, "El precio no puede ser negativo."),
  reorderLevel: z.number({ error: "Ingresa un nivel de reposición válido." }).int("Usa unidades enteras.").min(0, "El nivel no puede ser negativo."),
  stockQuantity: z.number({ error: "Ingresa una cantidad válida." }).int("Usa unidades enteras.").min(0, "El stock no puede ser negativo."),
})

export type MedicationFormValues = z.infer<typeof medicationFormSchema>

export const stockAdjustmentFormSchema = z.object({
  confirmed: z.boolean().refine((value) => value, "Confirma el ajuste antes de continuar."),
  direction: z.enum(["entrada", "salida"], { error: "Selecciona el tipo de movimiento." }),
  quantity: z.number({ error: "Ingresa una cantidad válida." }).int("Usa unidades enteras.").min(1, "La cantidad debe ser mayor que cero."),
})

export type StockAdjustmentFormValues = z.infer<typeof stockAdjustmentFormSchema>

export const prescriptionFormSchema = z.object({
  dosage: z.string().trim().min(1, "Ingresa la dosis indicada.").max(120, "La dosis es demasiado larga."),
  doctorId: z.string().trim().min(1, "Selecciona el médico prescriptor."),
  frequency: z.string().trim().min(1, "Ingresa la frecuencia indicada.").max(120, "La frecuencia es demasiado larga."),
  instructions: z.string().trim().max(1000, "Las instrucciones son demasiado largas."),
  medicalRecordId: z.string().trim(),
  medicationId: z.string().trim().min(1, "Selecciona el medicamento."),
  patientId: z.string().trim().min(1, "Selecciona el paciente."),
  quantity: z.number({ error: "Ingresa una cantidad válida." }).int("Usa unidades enteras.").min(1, "La cantidad debe ser mayor que cero."),
})

export type PrescriptionFormValues = z.infer<typeof prescriptionFormSchema>
