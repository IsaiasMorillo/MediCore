import { ArrowLeft, Construction, ExternalLink } from "lucide-react"
import { Link } from "react-router-dom"

import { PageHeader } from "@/components/layout/page-header"
import { findNavigationItem } from "@/lib/permissions/navigation"

export function ModulePlaceholderPage({ moduleId }: { moduleId: string }) {
  const context = findNavigationItem(`/app/${moduleId}`)
  const item = context?.item

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={context?.group.label ?? "Módulo"}
        title={item?.label ?? "Módulo"}
        description={item?.description}
      />
      <section className="flex min-h-[22rem] flex-col items-center justify-center rounded-[1.35rem] border border-dashed border-line bg-panel/70 px-6 py-12 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand-strong">
          <Construction aria-hidden="true" className="h-5 w-5" />
        </span>
        <p className="mt-5 text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-brand-strong">
          Módulo en preparación
        </p>
        <h2 className="mt-2 font-display text-xl font-semibold tracking-[-0.04em] text-ink">
          Esta capacidad estará disponible próximamente
        </h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-ink-muted">
          La navegación y sus permisos ya están definidos. La funcionalidad se conectará cuando se implemente su flujo operativo.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          <Link
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_-16px_var(--brand)] transition-colors hover:bg-brand-strong"
            to="/app"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Volver al dashboard
          </Link>
          <Link
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-panel-raised px-4 py-2.5 text-sm font-semibold text-ink-muted transition-colors hover:border-brand/40 hover:text-ink"
            to="/app"
          >
            Ver accesos disponibles
            <ExternalLink aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
