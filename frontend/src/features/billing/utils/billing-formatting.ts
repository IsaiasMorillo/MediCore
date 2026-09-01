import type { CoverageType, Invoice, InvoiceItemType, InvoiceStatus, PaymentMethod } from "@/features/billing/types"
import type { Patient } from "@/features/patients/types"

const dateTimeFormatter = new Intl.DateTimeFormat("es-DO", {
  day: "numeric",
  hour: "2-digit",
  hour12: false,
  minute: "2-digit",
  month: "short",
  timeZone: "UTC",
  weekday: "short",
  year: "numeric",
})

const dateFormatter = new Intl.DateTimeFormat("es-DO", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
  year: "numeric",
})

const invoiceStatusLabels: Record<string, string> = {
  Anulada: "Anulada",
  Pagada: "Pagada",
  Pendiente: "Pendiente",
}

const itemTypeLabels: Record<string, string> = {
  Consulta: "Consulta",
  Examen: "Examen",
  Medicamento: "Medicamento",
}

const paymentMethodLabels: Record<string, string> = {
  EFTPOS: "Tarjeta / EFTPOS",
  Efectivo: "Efectivo",
  Transferencia: "Transferencia",
}

export function formatBillingCurrency(value: number) {
  return new Intl.NumberFormat("es-DO", { currency: "DOP", style: "currency" }).format(value)
}

export function formatBillingDate(value: string | null | undefined, includeTime = false) {
  if (!value) {
    return "No registrada"
  }

  const timestamp = Date.parse(value)

  if (!Number.isFinite(timestamp)) {
    return "Fecha no válida"
  }

  const formatted = (includeTime ? dateTimeFormatter : dateFormatter).format(timestamp)
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

export function formatInvoiceStatus(status: InvoiceStatus) {
  return invoiceStatusLabels[status] ?? status
}

export function formatInvoiceItemType(type: InvoiceItemType) {
  return itemTypeLabels[type] ?? type
}

export function formatPaymentMethod(method: PaymentMethod) {
  return paymentMethodLabels[method] ?? method
}

export function normalizeCoverageType(value: string | null | undefined): CoverageType {
  const normalized = value?.trim().toLocaleLowerCase("es")

  if (normalized === "premium") {
    return "Premium"
  }

  if (normalized === "basica" || normalized === "básica" || normalized === "basico" || normalized === "básico") {
    return "Basica"
  }

  return "SinSeguro"
}

export function calculateInvoicePreview(items: readonly { type: InvoiceItemType; quantity: number; unitPrice: number }[], patient: Patient | undefined) {
  const subtotal = round2(items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0))
  const coverageType = normalizeCoverageType(patient?.medicalInsurance?.coverageType)
  const coveragePercent = coverageType === "Premium" ? 0.9 : coverageType === "Basica" ? 0.6 : 0
  const coveredSubtotal = round2(items.filter((item) => item.type === "Consulta" || item.type === "Examen").reduce((sum, item) => sum + item.quantity * item.unitPrice, 0))
  const insuranceCoverage = round2(coveredSubtotal * coveragePercent)
  const patientShare = round2(subtotal - insuranceCoverage)
  const taxes = round2(patientShare * 0.18)

  return { coverageType, discount: 0, insuranceCoverage, subtotal, taxes, total: round2(patientShare + taxes) }
}

export function sortInvoices(invoices: readonly Invoice[]) {
  return [...invoices].sort((first, second) => {
    const firstDate = Date.parse(first.invoiceDate)
    const secondDate = Date.parse(second.invoiceDate)

    return (Number.isFinite(secondDate) ? secondDate : 0) - (Number.isFinite(firstDate) ? firstDate : 0)
  })
}

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}
