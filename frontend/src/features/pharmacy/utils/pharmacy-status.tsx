import type { Medication, PrescriptionStatus } from "@/features/pharmacy/types"
import { formatPrescriptionStatus, isLowStock, isMedicationExpired } from "@/features/pharmacy/utils/pharmacy-formatting"

const prescriptionStatusStyles: Record<string, string> = {
  Cancelada: "border-rose/25 bg-rose-soft text-rose-strong",
  Despachada: "border-brand/25 bg-brand-soft text-brand-strong",
  Emitida: "border-amber/30 bg-amber-soft text-amber-strong",
}

export function PrescriptionStatusBadge({ status }: { status: PrescriptionStatus }) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold ${prescriptionStatusStyles[status] ?? "border-line bg-canvas text-ink-muted"}`}>{formatPrescriptionStatus(status)}</span>
}

export function MedicationStockBadge({ medication }: { medication: Medication }) {
  if (isMedicationExpired(medication)) {
    return <span className="inline-flex items-center rounded-full border border-rose/25 bg-rose-soft px-2.5 py-1 text-[0.68rem] font-semibold text-rose-strong">Vencido</span>
  }

  if (isLowStock(medication)) {
    return <span className="inline-flex items-center rounded-full border border-amber/30 bg-amber-soft px-2.5 py-1 text-[0.68rem] font-semibold text-amber-strong">Stock bajo</span>
  }

  return <span className="inline-flex items-center rounded-full border border-brand/25 bg-brand-soft px-2.5 py-1 text-[0.68rem] font-semibold text-brand-strong">Disponible</span>
}

export function MedicationActiveBadge({ isActive }: { isActive: boolean }) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold ${isActive ? "border-brand/25 bg-brand-soft text-brand-strong" : "border-line bg-canvas text-ink-muted"}`}>{isActive ? "Activo" : "Inactivo"}</span>
}
