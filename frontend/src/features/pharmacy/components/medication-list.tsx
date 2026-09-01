import { ArrowUpRight, PackageSearch, Pencil, SlidersHorizontal } from "lucide-react"
import { Link } from "react-router-dom"

import type { Medication } from "@/features/pharmacy/types"
import { formatPharmacyCurrency, formatPharmacyDate } from "@/features/pharmacy/utils/pharmacy-formatting"
import { MedicationActiveBadge, MedicationStockBadge } from "@/features/pharmacy/utils/pharmacy-status"

interface MedicationListProps {
  canManage: boolean
  medications: readonly Medication[]
  onAdjustStock: (medication: Medication) => void
}

type MedicationItemProps = Omit<MedicationListProps, "medications"> & { medication: Medication }

export function MedicationList({ canManage, medications, onAdjustStock }: MedicationListProps) {
  if (medications.length === 0) {
    return (
      <div className="flex min-h-56 flex-col items-center justify-center px-6 py-12 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-soft text-brand-strong">
          <PackageSearch aria-hidden="true" className="h-5 w-5" />
        </span>
        <p className="mt-4 text-sm font-semibold text-ink">No hay medicamentos para mostrar</p>
        <p className="mt-1 max-w-sm text-xs leading-5 text-ink-muted">Prueba con otro nombre, código o categoría.</p>
      </div>
    )
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[1050px] border-collapse text-left">
          <caption className="sr-only">Inventario de medicamentos</caption>
          <thead>
            <tr className="border-b border-line/80 text-[0.68rem] uppercase tracking-[0.12em] text-ink-subtle">
              <th className="px-5 py-3 font-semibold" scope="col">Medicamento</th>
              <th className="px-5 py-3 font-semibold" scope="col">Categoría</th>
              <th className="px-5 py-3 font-semibold" scope="col">Stock</th>
              <th className="px-5 py-3 font-semibold" scope="col">Precio</th>
              <th className="px-5 py-3 font-semibold" scope="col">Expiración</th>
              <th className="px-5 py-3 font-semibold" scope="col">Estado</th>
              <th className="px-5 py-3 text-right font-semibold" scope="col">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {medications.map((medication) => (
              <MedicationTableRow key={medication.id} canManage={canManage} medication={medication} onAdjustStock={onAdjustStock} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-4 md:hidden">
        {medications.map((medication) => (
          <MedicationCard key={medication.id} canManage={canManage} medication={medication} onAdjustStock={onAdjustStock} />
        ))}
      </div>
    </>
  )
}

function MedicationTableRow({ canManage, medication, onAdjustStock }: MedicationItemProps) {
  return (
    <tr className="group transition-colors hover:bg-canvas/60">
      <td className="px-5 py-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink group-hover:text-brand-strong">{medication.name}</p>
          <p className="mt-0.5 truncate font-mono text-[0.68rem] text-ink-subtle">{medication.code}</p>
        </div>
      </td>
      <td className="px-5 py-4 text-sm text-ink-muted">{medication.category || "Sin categoría"}</td>
      <td className="px-5 py-4">
        <p className="text-sm font-semibold text-ink">{medication.stockQuantity} unidades</p>
        <p className="mt-0.5 text-[0.68rem] text-ink-subtle">Reposición: {medication.reorderLevel}</p>
      </td>
      <td className="px-5 py-4 text-sm font-medium text-ink-muted">{formatPharmacyCurrency(medication.price)}</td>
      <td className="px-5 py-4 text-sm text-ink-muted">{formatPharmacyDate(medication.expirationDate)}</td>
      <td className="px-5 py-4">
        <div className="flex flex-wrap gap-1.5">
          <MedicationStockBadge medication={medication} />
          <MedicationActiveBadge isActive={medication.isActive} />
        </div>
      </td>
      <td className="px-5 py-4">
        <div className="flex justify-end gap-1.5">
          {canManage ? <button aria-label={`Ajustar stock de ${medication.name}`} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-ink-muted transition-colors hover:bg-brand-soft/60 hover:text-brand-strong" onClick={() => onAdjustStock(medication)} type="button"><SlidersHorizontal aria-hidden="true" className="h-3.5 w-3.5" />Stock</button> : null}
          {canManage ? <Link aria-label={`Editar ${medication.name}`} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-brand-strong transition-colors hover:bg-brand-soft/60" to={`/app/pharmacy/medications/${encodeURIComponent(medication.id)}/edit`}><Pencil aria-hidden="true" className="h-3.5 w-3.5" />Editar</Link> : null}
        </div>
      </td>
    </tr>
  )
}

function MedicationCard({ canManage, medication, onAdjustStock }: MedicationItemProps) {
  return (
    <article className="rounded-2xl border border-line/80 bg-panel-raised p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{medication.name}</p>
          <p className="mt-0.5 truncate font-mono text-[0.68rem] text-ink-subtle">{medication.code}</p>
        </div>
        <MedicationActiveBadge isActive={medication.isActive} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <MedicationStockBadge medication={medication} />
        <span className="text-xs text-ink-muted">{medication.category || "Sin categoría"}</span>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-line/60 pt-3">
        <div><dt className="text-[0.65rem] uppercase tracking-[0.1em] text-ink-subtle">Stock</dt><dd className="mt-1 text-xs font-semibold text-ink">{medication.stockQuantity} unidades</dd><dd className="mt-0.5 text-[0.68rem] text-ink-subtle">Reposición: {medication.reorderLevel}</dd></div>
        <div><dt className="text-[0.65rem] uppercase tracking-[0.1em] text-ink-subtle">Precio</dt><dd className="mt-1 text-xs font-semibold text-ink">{formatPharmacyCurrency(medication.price)}</dd></div>
        <div><dt className="text-[0.65rem] uppercase tracking-[0.1em] text-ink-subtle">Expiración</dt><dd className="mt-1 text-xs font-medium text-ink-muted">{formatPharmacyDate(medication.expirationDate)}</dd></div>
      </dl>
      {canManage ? <div className="mt-4 flex flex-wrap gap-2 border-t border-line/60 pt-3"><button className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-xs font-semibold text-ink-muted transition-colors hover:border-brand/40 hover:text-ink" onClick={() => onAdjustStock(medication)} type="button"><SlidersHorizontal aria-hidden="true" className="h-3.5 w-3.5" />Ajustar stock</button><Link className="inline-flex items-center gap-1.5 rounded-xl bg-brand-soft px-3 py-2 text-xs font-semibold text-brand-strong transition-colors hover:bg-brand-soft/70" to={`/app/pharmacy/medications/${encodeURIComponent(medication.id)}/edit`}>Editar <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" /></Link></div> : null}
    </article>
  )
}
