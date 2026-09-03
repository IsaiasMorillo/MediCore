import type { LaboratoryOrderStatus } from "@/features/laboratory/types"
import { formatLaboratoryOrderStatus } from "@/features/laboratory/utils/laboratory-formatting"
import { StatusBadge, type StatusTone } from "@/components/ui"

const statusTones: Record<string, StatusTone> = {
  ResultadoCargado: "success",
  SolicitudPendiente: "warning",
}

export function LaboratoryStatusBadge({ status }: { status: LaboratoryOrderStatus }) {
  return <StatusBadge label={formatLaboratoryOrderStatus(status)} tone={statusTones[status] ?? "neutral"} />
}
