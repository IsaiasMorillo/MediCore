import { ROLE_LABELS, type UserRole } from "@/lib/permissions/roles"

export function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span className="inline-flex items-center rounded-full bg-brand-soft px-2.5 py-1 text-[0.68rem] font-semibold text-brand-strong">
      {ROLE_LABELS[role]}
    </span>
  )
}
