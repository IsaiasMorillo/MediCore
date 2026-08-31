export interface BillingReportRow {
  year: number
  month: number
  invoiceCount: number
  totalInvoiced: number
}

export interface MedicationDispensedRow {
  medicationId: string
  medicationName: string
  prescriptionCount: number
  totalQuantity: number
}

export interface CategoryCountRow {
  key: string
  label: string
  count: number
}

export interface LowStockRow {
  medicationId: string
  medicationName: string
  stockQuantity: number
  reorderLevel: number
}
