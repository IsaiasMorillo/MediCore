import { ArrowUpRight, CalendarClock, FileCheck2, FlaskConical, Link2 } from "lucide-react"
import { Link } from "react-router-dom"

import type { LaboratoryOrder } from "@/features/laboratory/types"
import { LaboratoryStatusBadge } from "@/features/laboratory/utils/laboratory-status"
import { formatLaboratoryDate, formatLaboratoryTestType, sortLaboratoryOrders } from "@/features/laboratory/utils/laboratory-formatting"

export function LaboratoryOrderList({ canLoadResults, orders }: { canLoadResults: boolean; orders: readonly LaboratoryOrder[] }) {
  const sortedOrders = sortLaboratoryOrders(orders)

  if (sortedOrders.length === 0) {
    return (
      <div className="flex min-h-36 flex-col items-center justify-center rounded-2xl border border-dashed border-line px-6 py-8 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-strong"><FlaskConical aria-hidden="true" className="h-4 w-4" /></span>
        <p className="mt-3 text-sm font-semibold text-ink">No hay órdenes de laboratorio</p>
        <p className="mt-1 max-w-sm text-xs leading-5 text-ink-muted">Crea una orden desde un expediente clínico o desde el acceso de nueva orden.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {sortedOrders.map((order) => (
        <article className="rounded-2xl border border-line/80 bg-panel-raised p-4 sm:p-5" key={order.id}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-strong"><FlaskConical aria-hidden="true" className="h-4 w-4" /></span>
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-ink">{formatLaboratoryTestType(order.testType)}</h3>
                <p className="mt-1 break-all font-mono text-[0.68rem] text-ink-subtle">{order.id}</p>
              </div>
            </div>
            <LaboratoryStatusBadge status={order.status} />
          </div>
          <div className="mt-4 grid gap-3 border-t border-line/70 pt-4 text-xs sm:grid-cols-3">
            <p className="flex items-start gap-2 text-ink-muted"><CalendarClock aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-strong" />{formatLaboratoryDate(order.requestedAt)}</p>
            <p className="flex items-start gap-2 text-ink-muted"><FileCheck2 aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-strong" />{order.medicalRecordId ? `Expediente ${order.medicalRecordId}` : "Sin expediente asociado"}</p>
            <p className="flex items-start gap-2 text-ink-muted"><Link2 aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-strong" />Médico <span className="break-all font-mono text-[0.68rem]">{order.doctorId}</span></p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 border-t border-line/70 pt-4">
            <Link className="inline-flex items-center gap-1.5 rounded-xl bg-brand-soft px-3 py-2 text-xs font-semibold text-brand-strong transition-colors hover:bg-brand-soft/70" to={`/app/laboratory/orders/${encodeURIComponent(order.id)}`}>Abrir orden <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" /></Link>
            {canLoadResults && order.status !== "ResultadoCargado" ? <Link className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-xs font-semibold text-ink-muted transition-colors hover:border-brand/40 hover:text-ink" to={`/app/laboratory/orders/${encodeURIComponent(order.id)}/results`}>Cargar resultados</Link> : null}
          </div>
        </article>
      ))}
    </div>
  )
}
