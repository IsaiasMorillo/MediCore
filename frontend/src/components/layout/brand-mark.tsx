import { HeartPulse } from "lucide-react"

import { cn } from "@/lib/utils"

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", compact && "justify-center")}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-[0_8px_18px_-10px_var(--brand)]">
        <HeartPulse aria-hidden="true" className="h-5 w-5" strokeWidth={2.3} />
      </span>
      {!compact ? (
        <div className="min-w-0">
          <p className="font-display text-[1.05rem] font-semibold tracking-[-0.03em] text-ink">
            MediCore
          </p>
          <p className="text-[0.65rem] font-medium uppercase tracking-[0.16em] text-ink-subtle">
            Operaciones clínicas
          </p>
        </div>
      ) : null}
    </div>
  )
}
