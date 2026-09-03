import { CircleCheck, CircleX } from "lucide-react"
import { StatusBadge } from "@/components/ui"

export function DoctorStatusBadge({ isActive }: { isActive: boolean }) {
  return <StatusBadge icon={isActive ? <CircleCheck aria-hidden="true" className="h-3.5 w-3.5" /> : <CircleX aria-hidden="true" className="h-3.5 w-3.5" />} label={isActive ? "Activo" : "Inactivo"} tone={isActive ? "success" : "danger"} />
}
