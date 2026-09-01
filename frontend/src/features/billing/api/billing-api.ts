import { apiRequest } from "@/lib/api/client"

import type { CancelInvoiceInput, CreateInvoiceInput, Invoice, PayInvoiceInput } from "@/features/billing/types"

export const billingKeys = {
  all: () => ["billing"] as const,
  invoice: (invoiceId: string) => ["billing", "invoice", invoiceId] as const,
  invoiceLists: () => ["billing", "invoices"] as const,
  patientInvoices: (patientId: string) => ["billing", "invoices", "patient", patientId] as const,
}

export function createInvoice(input: CreateInvoiceInput) {
  return apiRequest<Invoice>("/api/invoices", {
    body: JSON.stringify(input),
    method: "POST",
  })
}

export function getInvoice(invoiceId: string) {
  return apiRequest<Invoice>(`/api/invoices/${encodeURIComponent(invoiceId)}`)
}

export function getPatientInvoices(patientId: string) {
  return apiRequest<Invoice[]>(`/api/invoices/patient/${encodeURIComponent(patientId)}`)
}

export function payInvoice({ amount, id, method, paidBy }: PayInvoiceInput) {
  return apiRequest<void>(`/api/invoices/${encodeURIComponent(id)}/pay`, {
    body: JSON.stringify({ amount, method, paidBy }),
    method: "POST",
  })
}

export function cancelInvoice({ cancelledBy, id, reason }: CancelInvoiceInput) {
  return apiRequest<void>(`/api/invoices/${encodeURIComponent(id)}/cancel`, {
    body: JSON.stringify({ cancelledBy, reason }),
    method: "POST",
  })
}
