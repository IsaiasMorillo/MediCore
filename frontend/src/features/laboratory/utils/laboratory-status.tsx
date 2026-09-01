import type { LaboratoryOrderStatus } from "@/features/laboratory/types"
import { formatLaboratoryOrderStatus } from "@/features/laboratory/utils/laboratory-formatting"

const statusStyles: Record<string, string> = {
  ResultadoCargado: "border-brand/25 bg-brand-soft text-brand-strong",
  SolicitudPendiente: "border-amber/30 bg-amber-soft text-amber-strong",
}

export function LaboratoryStatusBadge({ status }: { status: LaboratoryOrderStatus }) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold ${statusStyles[status] ?? "border-line bg-canvas text-ink-muted"}`}>{formatLaboratoryOrderStatus(status)}</span>
}
