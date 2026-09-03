import type {
  BillingReportRow,
  LowStockRow,
} from "@/features/reports/types"

const monthFormatter = new Intl.DateTimeFormat("es-DO", {
  month: "short",
  timeZone: "UTC",
  year: "numeric",
})

const dateFormatter = new Intl.DateTimeFormat("es-DO", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
  year: "numeric",
})

export function getCurrentMonthRange(now = new Date()) {
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth()
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()

  return {
    from: toDateInputValue(year, month + 1, 1),
    to: toDateInputValue(year, month + 1, lastDay),
  }
}

export function isDateInputValue(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const [year, month, day] = value.split("-").map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

export function isBillingRangeValid(from: string, to: string) {
  return isDateInputValue(from) && isDateInputValue(to) && from <= to
}

export function sortBillingRowsAscending(rows: readonly BillingReportRow[]) {
  return [...rows].sort((first, second) => monthKey(first) - monthKey(second))
}

export function sortBillingRowsDescending(rows: readonly BillingReportRow[]) {
  return sortBillingRowsAscending(rows).reverse()
}

export function toBillingChartData(rows: readonly BillingReportRow[]) {
  return sortBillingRowsAscending(rows).map((row) => ({
    date: new Date(Date.UTC(row.year, row.month - 1, 1)),
    invoiceCount: row.invoiceCount,
    totalInvoiced: row.totalInvoiced,
  }))
}

export function formatReportMonth(year: number, month: number) {
  const formatted = monthFormatter.format(new Date(Date.UTC(year, month - 1, 1)))
  return capitalize(formatted)
}

export function formatReportDate(value: string) {
  if (!isDateInputValue(value)) {
    return "Fecha no válida"
  }

  return capitalize(dateFormatter.format(new Date(`${value}T00:00:00.000Z`)))
}

export function sortLowStockRows(rows: readonly LowStockRow[]) {
  return [...rows].sort((first, second) => {
    const deficitDifference = stockDifference(first) - stockDifference(second)

    if (deficitDifference !== 0) {
      return deficitDifference
    }

    if (first.stockQuantity !== second.stockQuantity) {
      return first.stockQuantity - second.stockQuantity
    }

    return first.medicationName.localeCompare(second.medicationName, "es")
  })
}

export function stockDifference(row: Pick<LowStockRow, "stockQuantity" | "reorderLevel">) {
  return row.stockQuantity - row.reorderLevel
}

function monthKey(row: BillingReportRow) {
  return row.year * 12 + row.month
}

function toDateInputValue(year: number, month: number, day: number) {
  return [year, String(month).padStart(2, "0"), String(day).padStart(2, "0")].join("-")
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
