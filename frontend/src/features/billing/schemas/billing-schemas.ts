import { z } from "zod"

export const invoiceItemFormSchema = z.object({
  appointmentId: z.string().trim(),
  description: z.string().trim().min(1, "Ingresa la descripción del item.").max(240, "La descripción es demasiado larga."),
  laboratoryOrderId: z.string().trim(),
  prescriptionId: z.string().trim(),
  quantity: z.number({ error: "Ingresa una cantidad válida." }).int("Usa cantidades enteras.").min(1, "La cantidad debe ser mayor que cero."),
  type: z.enum(["Consulta", "Examen", "Medicamento"], { error: "Selecciona el tipo de item." }),
  unitPrice: z.number({ error: "Ingresa un precio válido." }).finite().min(0, "El precio no puede ser negativo."),
})

export type InvoiceItemFormValues = z.infer<typeof invoiceItemFormSchema>

export const paymentFormSchema = z.object({
  amount: z.number({ error: "Ingresa un monto válido." }).finite().positive("El monto debe ser mayor que cero."),
  method: z.enum(["Efectivo", "EFTPOS", "Transferencia"], { error: "Selecciona el método de pago." }),
})

export type PaymentFormValues = z.infer<typeof paymentFormSchema>

export const cancelInvoiceFormSchema = z.object({
  reason: z.string().trim().max(500, "La razón es demasiado larga."),
})

export type CancelInvoiceFormValues = z.infer<typeof cancelInvoiceFormSchema>
