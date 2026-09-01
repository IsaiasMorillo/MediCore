import { Boxes, ChevronLeft, ChevronRight, Package, Plus, RefreshCw, Search, TriangleAlert, X } from "lucide-react"
import { useDeferredValue, useState, type ReactNode } from "react"
import { Link } from "react-router-dom"

import { PageHeader } from "@/components/layout/page-header"
import { SuccessAlert } from "@/features/auth/components/form-controls"
import { MedicationList } from "@/features/pharmacy/components/medication-list"
import { StockAdjustmentForm } from "@/features/pharmacy/components/stock-adjustment-form"
import { useAdjustMedicationStock, useMedications } from "@/features/pharmacy/hooks/use-pharmacy"
import type { Medication } from "@/features/pharmacy/types"
import { getPharmacyErrorMessage } from "@/features/pharmacy/utils/pharmacy-errors"
import { isLowStock, sortMedications } from "@/features/pharmacy/utils/pharmacy-formatting"
import { PHARMACY_MANAGE_ROLES } from "@/lib/permissions/route-roles"
import { hasAnyRole } from "@/lib/permissions/roles"
import { useAuthSession } from "@/lib/auth/use-auth-session"

const PAGE_SIZE = 8

export function PharmacyMedicationsPage() {
  const { session } = useAuthSession()
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const deferredSearch = useDeferredValue(searchTerm.trim())
  const medicationsQuery = useMedications(deferredSearch)
  const stockMutation = useAdjustMedicationStock()
  const medications = sortMedications(medicationsQuery.data ?? [])
  const pageCount = Math.max(1, Math.ceil(medications.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const visibleMedications = medications.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const canManage = session ? hasAnyRole(session.user.roles, PHARMACY_MANAGE_ROLES) : false

  const handleStockAdjustment = async (values: { direction: "entrada" | "salida"; quantity: number }) => {
    if (!selectedMedication) {
      return
    }

    try {
      await stockMutation.mutateAsync({
        id: selectedMedication.id,
        quantityChange: values.direction === "entrada" ? values.quantity : -values.quantity,
      })
      setSelectedMedication(null)
      setSuccessMessage(`El stock de ${selectedMedication.name} fue actualizado.`)
    } catch {
      // The dialog renders the server error and remains open for retry.
    }
  }

  return (
    <div className="space-y-7">
      <PageHeader
        actions={canManage ? <Link className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_-16px_var(--brand)] transition-colors hover:bg-brand-strong" to="/app/pharmacy/medications/new"><Plus aria-hidden="true" className="h-4 w-4" />Nuevo medicamento</Link> : null}
        description="Consulta el inventario disponible, detecta niveles de reposición y ajusta existencias con un movimiento confirmado."
        eyebrow="Operación · Farmacia"
        title="Inventario de medicamentos"
      />

      <InventoryMetrics medications={medications} />
      {successMessage ? <SuccessAlert message={successMessage} /> : null}

      <section className="overflow-hidden rounded-[1.35rem] border border-line/80 bg-panel shadow-[0_20px_55px_-38px_var(--ink)]">
        <div className="border-b border-line/70 p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <label className="relative min-w-0 flex-1"><span className="sr-only">Buscar medicamentos</span><Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" /><input aria-label="Buscar medicamentos" className="h-11 w-full rounded-xl border border-line bg-panel-raised pl-10 pr-3.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-brand/60 focus:ring-2 focus:ring-brand/10" onChange={(event) => { setPage(1); setSearchTerm(event.target.value) }} placeholder="Nombre, código o categoría" type="search" value={searchTerm} /></label>
            <button aria-label="Actualizar inventario" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line bg-panel-raised px-3.5 text-xs font-semibold text-ink-muted transition-colors hover:border-brand/40 hover:text-ink disabled:cursor-wait disabled:opacity-60" disabled={medicationsQuery.isFetching} onClick={() => void medicationsQuery.refetch()} type="button"><RefreshCw aria-hidden="true" className={medicationsQuery.isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} /><span className="hidden sm:inline">Actualizar</span></button>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[0.68rem] text-ink-subtle"><span aria-live="polite">{medicationsQuery.isFetching ? "Actualizando inventario..." : `${medications.length} medicamento${medications.length === 1 ? "" : "s"} encontrado${medications.length === 1 ? "" : "s"}`}</span>{deferredSearch ? <span>La búsqueda incluye nombre, código y categoría.</span> : null}</div>
        </div>
        {medicationsQuery.isPending ? <InventoryLoadingState /> : null}
        {medicationsQuery.isError ? <InventoryErrorState message={getPharmacyErrorMessage(medicationsQuery.error, "No pudimos cargar el inventario.")} onRetry={() => void medicationsQuery.refetch()} /> : null}
        {!medicationsQuery.isPending && !medicationsQuery.isError && medications.length === 0 ? <MedicationList canManage={canManage} medications={[]} onAdjustStock={setSelectedMedication} /> : null}
        {!medicationsQuery.isPending && !medicationsQuery.isError && medications.length > 0 ? <><MedicationList canManage={canManage} medications={visibleMedications} onAdjustStock={(medication) => { stockMutation.reset(); setSuccessMessage(null); setSelectedMedication(medication) }} /><InventoryPagination page={currentPage} pageCount={pageCount} onPageChange={setPage} /></> : null}
      </section>

      {selectedMedication ? <StockAdjustmentDialog medication={selectedMedication} mutation={stockMutation} onCancel={() => { stockMutation.reset(); setSelectedMedication(null) }} onSubmit={handleStockAdjustment} /> : null}
    </div>
  )
}

function InventoryMetrics({ medications }: { medications: readonly Medication[] }) {
  const lowStockCount = medications.filter(isLowStock).length
  const activeCount = medications.filter((medication) => medication.isActive).length
  const units = medications.reduce((total, medication) => total + medication.stockQuantity, 0)

  return <section aria-label="Resumen de inventario" className="grid gap-4 sm:grid-cols-3"><MetricCard icon={<Boxes aria-hidden="true" className="h-4 w-4" />} label="Referencias encontradas" value={medications.length} /><MetricCard icon={<Package aria-hidden="true" className="h-4 w-4" />} label="Unidades disponibles" value={units} /><MetricCard icon={<TriangleAlert aria-hidden="true" className="h-4 w-4" />} label="Stock bajo" value={lowStockCount} detail={`${activeCount} activas`} /></section>
}

function MetricCard({ detail, icon, label, value }: { detail?: string; icon: ReactNode; label: string; value: number }) {
  return <article className="rounded-[1.2rem] border border-line/80 bg-panel p-4 shadow-[0_16px_40px_-32px_var(--ink)]"><div className="flex items-center justify-between gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-soft text-brand-strong">{icon}</span><span className="font-display text-2xl font-semibold tracking-[-0.05em] text-ink">{value}</span></div><p className="mt-3 text-xs font-medium text-ink-muted">{label}</p>{detail ? <p className="mt-1 text-[0.68rem] text-ink-subtle">{detail}</p> : null}</article>
}

function InventoryLoadingState() {
  return <div aria-busy="true" aria-live="polite" className="space-y-3 p-4 sm:p-5">{[0, 1, 2, 3].map((row) => <div className="flex animate-pulse items-center gap-3 rounded-2xl border border-line/60 px-4 py-4" key={row}><span className="h-10 w-10 rounded-xl bg-line/60" /><span className="h-3 w-40 rounded-full bg-line/60" /><span className="ml-auto hidden h-3 w-24 rounded-full bg-line/60 sm:block" /></div>)}</div>
}

function InventoryErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="flex min-h-56 flex-col items-center justify-center px-6 py-12 text-center" role="alert"><p className="text-sm font-semibold text-ink">No pudimos cargar el inventario</p><p className="mt-2 max-w-sm text-xs leading-5 text-ink-muted">{message}</p><button className="mt-5 rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-strong" onClick={onRetry} type="button">Intentar nuevamente</button></div>
}

function InventoryPagination({ onPageChange, page, pageCount }: { onPageChange: (page: number) => void; page: number; pageCount: number }) {
  if (pageCount <= 1) {
    return null
  }

  return <div className="flex items-center justify-between border-t border-line/70 px-4 py-3 sm:px-5"><p className="text-xs text-ink-subtle">Página {page} de {pageCount}</p><div className="flex items-center gap-2"><button aria-label="Página anterior del inventario" className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-panel-raised text-ink-muted transition-colors hover:border-brand/40 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40" disabled={page === 1} onClick={() => onPageChange(page - 1)} type="button"><ChevronLeft aria-hidden="true" className="h-4 w-4" /></button><button aria-label="Página siguiente del inventario" className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-panel-raised text-ink-muted transition-colors hover:border-brand/40 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40" disabled={page === pageCount} onClick={() => onPageChange(page + 1)} type="button"><ChevronRight aria-hidden="true" className="h-4 w-4" /></button></div></div>
}

function StockAdjustmentDialog({ medication, mutation, onCancel, onSubmit }: { medication: Medication; mutation: ReturnType<typeof useAdjustMedicationStock>; onCancel: () => void; onSubmit: (values: { direction: "entrada" | "salida"; quantity: number }) => Promise<void> }) {
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 p-4 sm:items-center"><section aria-describedby="stock-adjustment-description" aria-labelledby="stock-adjustment-title" aria-modal="true" className="max-h-[calc(100vh-2rem)] w-full max-w-xl overflow-y-auto rounded-[1.35rem] border border-line/80 bg-panel p-5 shadow-2xl sm:p-6" role="dialog"><div className="flex items-start justify-between gap-4"><div><p className="text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-brand-strong">Inventario · Movimiento</p><h2 className="mt-1.5 font-display text-lg font-semibold tracking-[-0.035em] text-ink" id="stock-adjustment-title">Ajustar stock</h2><p className="mt-1 text-xs text-ink-muted" id="stock-adjustment-description">{medication.name} · {medication.code}</p></div><button aria-label="Cerrar ajuste de stock" className="rounded-lg px-2 py-1 text-ink-subtle transition-colors hover:bg-canvas hover:text-ink" onClick={onCancel} type="button"><X aria-hidden="true" className="h-4 w-4" /></button></div><div className="mt-5"><StockAdjustmentForm medication={medication} onCancel={onCancel} onSubmit={onSubmit} serverError={mutation.isError ? getPharmacyErrorMessage(mutation.error, "No pudimos actualizar el stock.") : null} /></div></section></div>
}
