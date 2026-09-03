import type { InvoiceStatus } from "@/features/billing/types"
import { formatInvoiceStatus } from "@/features/billing/utils/billing-formatting"
import { StatusBadge, type StatusTone } from "@/components/ui"

const statusTones: Record<string, StatusTone> = {
  Anulada: "danger",
  Pagada: "success",
  Pendiente: "warning",
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return <StatusBadge label={formatInvoiceStatus(status)} tone={statusTones[status] ?? "neutral"} />
}
