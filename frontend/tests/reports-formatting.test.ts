import { describe, expect, it } from "vitest"

import {
  formatReportDate,
  formatReportMonth,
  getCurrentMonthRange,
  isBillingRangeValid,
  sortBillingRowsAscending,
  sortLowStockRows,
  toBillingChartData,
} from "@/features/reports/utils/report-formatting"

describe("report formatting", () => {
  it("creates a UTC-safe current month range", () => {
    expect(getCurrentMonthRange(new Date("2026-02-14T23:00:00.000Z"))).toEqual({
      from: "2026-02-01",
      to: "2026-02-28",
    })
    expect(formatReportDate("2026-02-01")).toMatch(/1 de febrero de 2026/i)
  })

  it("validates date ranges and rejects invalid calendar dates", () => {
    expect(isBillingRangeValid("2026-09-01", "2026-09-30")).toBe(true)
    expect(isBillingRangeValid("2026-09-30", "2026-09-01")).toBe(false)
    expect(isBillingRangeValid("2026-02-30", "2026-03-01")).toBe(false)
  })

  it("sorts billing data chronologically for charts", () => {
    const rows = [
      { invoiceCount: 4, month: 2, totalInvoiced: 400, year: 2026 },
      { invoiceCount: 7, month: 1, totalInvoiced: 700, year: 2026 },
    ]

    expect(sortBillingRowsAscending(rows).map((row) => row.month)).toEqual([1, 2])
    expect(toBillingChartData(rows).map((row) => row.date.toISOString())).toEqual([
      "2026-01-01T00:00:00.000Z",
      "2026-02-01T00:00:00.000Z",
    ])
    expect(formatReportMonth(2026, 1)).toMatch(/ene/i)
  })

  it("orders low stock by the gap against its reorder level", () => {
    const rows = [
      { medicationId: "a", medicationName: "A", reorderLevel: 10, stockQuantity: 8 },
      { medicationId: "b", medicationName: "B", reorderLevel: 20, stockQuantity: 2 },
      { medicationId: "c", medicationName: "C", reorderLevel: 5, stockQuantity: 5 },
    ]

    expect(sortLowStockRows(rows).map((row) => row.medicationId)).toEqual(["b", "a", "c"])
  })
})
