import type { Medication, PrescriptionStatus } from "@/features/pharmacy/types"
import { formatPrescriptionStatus, isLowStock, isMedicationExpired } from "@/features/pharmacy/utils/pharmacy-formatting"
import { StatusBadge, type StatusTone } from "@/components/ui"

const prescriptionStatusTones: Record<string, StatusTone> = {
  Cancelada: "danger",
  Despachada: "success",
  Emitida: "warning",
}

export function PrescriptionStatusBadge({ status }: { status: PrescriptionStatus }) {
  return <StatusBadge label={formatPrescriptionStatus(status)} tone={prescriptionStatusTones[status] ?? "neutral"} />
}

export function MedicationStockBadge({ medication }: { medication: Medication }) {
  if (isMedicationExpired(medication)) {
    return <StatusBadge label="Vencido" tone="danger" />
  }

  if (isLowStock(medication)) {
    return <StatusBadge label="Stock bajo" tone="warning" />
  }

  return <StatusBadge label="Disponible" tone="success" />
}

export function MedicationActiveBadge({ isActive }: { isActive: boolean }) {
  return <StatusBadge label={isActive ? "Activo" : "Inactivo"} tone={isActive ? "success" : "neutral"} />
}
