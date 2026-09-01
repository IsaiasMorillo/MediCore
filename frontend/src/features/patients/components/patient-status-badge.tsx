import { CircleCheck, CircleX } from "lucide-react"

export function PatientStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={
        isActive
          ? "inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-[0.68rem] font-semibold text-brand-strong"
          : "inline-flex items-center gap-1.5 rounded-full bg-rose-soft px-2.5 py-1 text-[0.68rem] font-semibold text-rose-strong"
      }
    >
      {isActive ? (
        <CircleCheck aria-hidden="true" className="h-3.5 w-3.5" />
      ) : (
        <CircleX aria-hidden="true" className="h-3.5 w-3.5" />
      )}
      {isActive ? "Activo" : "Inactivo"}
    </span>
  )
}
