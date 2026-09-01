import type { InvoiceStatus } from "@/features/billing/types"
import { formatInvoiceStatus } from "@/features/billing/utils/billing-formatting"

const statusStyles: Record<string, string> = {
  Anulada: "border-rose/25 bg-rose-soft text-rose-strong",
  Pagada: "border-brand/25 bg-brand-soft text-brand-strong",
  Pendiente: "border-amber/30 bg-amber-soft text-amber-strong",
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold ${statusStyles[status] ?? "border-line bg-canvas text-ink-muted"}`}>{formatInvoiceStatus(status)}</span>
}
