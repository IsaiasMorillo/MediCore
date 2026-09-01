export type InvoiceStatus = "Pendiente" | "Pagada" | "Anulada" | string
export type PaymentMethod = "Efectivo" | "EFTPOS" | "Transferencia" | string
export type InvoiceItemType = "Consulta" | "Examen" | "Medicamento" | string
export type CoverageType = "SinSeguro" | "Basica" | "Premium" | string

export interface InvoiceItemInput {
  type: InvoiceItemType
  description: string
  quantity: number
  unitPrice: number
  appointmentId: string | null
  laboratoryOrderId: string | null
  prescriptionId: string | null
}

export interface CreateInvoiceInput {
  patientId: string
  items: InvoiceItemInput[]
  createdBy: string
}

export interface InvoiceItem {
  type: InvoiceItemType
  description: string
  quantity: number
  unitPrice: number
  subtotal: number
  appointmentId: string | null
  laboratoryOrderId: string | null
  prescriptionId: string | null
}

export interface Payment {
  method: PaymentMethod
  amount: number
  paidAt: string
  paidBy: string | null
}

export interface Invoice {
  id: string
  number: string
  patientId: string
  createdBy: string
  invoiceDate: string
  coverageType: CoverageType
  items: InvoiceItem[]
  subtotal: number
  insuranceCoverage: number
  discount: number
  taxes: number
  total: number
  paidAmount: number
  balance: number
  status: InvoiceStatus
  payments: Payment[]
}

export interface PayInvoiceInput {
  id: string
  method: PaymentMethod
  amount: number
  paidBy: string | null
}

export interface CancelInvoiceInput {
  id: string
  reason: string | null
  cancelledBy: string | null
}
