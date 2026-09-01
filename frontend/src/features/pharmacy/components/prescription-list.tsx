import { ArrowUpRight, CalendarCheck2, ClipboardList, PackageCheck, Pill, ShieldCheck } from "lucide-react"
import { Link } from "react-router-dom"

import type { Prescription } from "@/features/pharmacy/types"
import { formatPharmacyDate, sortPrescriptions } from "@/features/pharmacy/utils/pharmacy-formatting"
import { PrescriptionStatusBadge } from "@/features/pharmacy/utils/pharmacy-status"

interface PrescriptionListProps {
  canDispense: boolean
  onDispense: (prescription: Prescription) => void
  prescriptions: readonly Prescription[]
}

export function PrescriptionList({ canDispense, onDispense, prescriptions }: PrescriptionListProps) {
  const sortedPrescriptions = sortPrescriptions(prescriptions)

  if (sortedPrescriptions.length === 0) {
    return (
      <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-line px-6 py-10 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-strong"><Pill aria-hidden="true" className="h-4 w-4" /></span>
        <p className="mt-3 text-sm font-semibold text-ink">No hay recetas para este paciente</p>
        <p className="mt-1 max-w-sm text-xs leading-5 text-ink-muted">Las recetas emitidas desde un expediente o paciente aparecerán aquí.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {sortedPrescriptions.map((prescription) => (
        <article className="rounded-2xl border border-line/80 bg-panel-raised p-4 sm:p-5" key={prescription.id}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-strong"><Pill aria-hidden="true" className="h-4 w-4" /></span>
              <div className="min-w-0"><h3 className="truncate text-sm font-semibold text-ink">{prescription.medicationName}</h3><p className="mt-1 break-all font-mono text-[0.68rem] text-ink-subtle">Receta {prescription.id}</p></div>
            </div>
            <PrescriptionStatusBadge status={prescription.status} />
          </div>
          <dl className="mt-4 grid gap-3 border-t border-line/70 pt-4 text-xs sm:grid-cols-3">
            <div><dt className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-ink-subtle">Dosis</dt><dd className="mt-1 font-medium text-ink">{prescription.dosage || "No indicada"}</dd></div>
            <div><dt className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-ink-subtle">Frecuencia</dt><dd className="mt-1 font-medium text-ink">{prescription.frequency || "No indicada"}</dd></div>
            <div><dt className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-ink-subtle">Cantidad</dt><dd className="mt-1 font-medium text-ink">{prescription.quantity} unidades</dd></div>
          </dl>
          <div className="mt-4 grid gap-3 border-t border-line/70 pt-4 text-xs sm:grid-cols-2">
            <p className="flex items-start gap-2 text-ink-muted"><ClipboardList aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-strong" />{prescription.instructions || "Sin instrucciones adicionales."}</p>
            <p className="flex items-start gap-2 text-ink-muted"><ShieldCheck aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-strong" />Médico <span className="break-all font-mono text-[0.68rem]">{prescription.doctorId}</span></p>
          </div>
          {prescription.status === "Despachada" ? <p className="mt-4 flex items-start gap-2 rounded-xl border border-brand/20 bg-brand-soft/55 px-3.5 py-3 text-xs leading-5 text-ink-muted"><PackageCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-brand-strong" />Despachada el {formatPharmacyDate(prescription.dispensedAt, true)}{prescription.dispensedBy ? ` por ${prescription.dispensedBy}` : ""}.</p> : null}
          <div className="mt-4 flex flex-wrap gap-2 border-t border-line/70 pt-4">
            <Link className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-xs font-semibold text-ink-muted transition-colors hover:border-brand/40 hover:text-ink" to={`/app/patients/${encodeURIComponent(prescription.patientId)}`}>Abrir paciente <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" /></Link>
            {canDispense && prescription.status === "Emitida" ? <button className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-strong" onClick={() => onDispense(prescription)} type="button"><CalendarCheck2 aria-hidden="true" className="h-3.5 w-3.5" />Dispensar</button> : null}
          </div>
        </article>
      ))}
    </div>
  )
}

export function PrescriptionDispenseDialog({
  error,
  isPending,
  onCancel,
  onConfirm,
  prescription,
}: {
  error?: string | null
  isPending: boolean
  onCancel: () => void
  onConfirm: () => void
  prescription: Prescription
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 p-4 sm:items-center" role="presentation">
      <section aria-describedby="dispense-prescription-description" aria-labelledby="dispense-prescription-title" aria-modal="true" className="w-full max-w-lg rounded-[1.35rem] border border-line/80 bg-panel p-5 shadow-2xl sm:p-6" role="dialog">
        <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-strong"><PackageCheck aria-hidden="true" className="h-5 w-5" /></span><div><p className="text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-brand-strong">Confirmación de farmacia</p><h2 className="mt-1.5 font-display text-lg font-semibold tracking-[-0.035em] text-ink" id="dispense-prescription-title">¿Dispensar esta receta?</h2></div></div>
        <p className="mt-4 text-sm leading-6 text-ink-muted" id="dispense-prescription-description">Se descontarán <strong className="font-semibold text-ink">{prescription.quantity} unidades</strong> de <strong className="font-semibold text-ink">{prescription.medicationName}</strong>. La operación no debe repetirse después de confirmar.</p>
        <div className="mt-4 grid gap-3 rounded-2xl border border-line/70 bg-canvas/45 p-4 text-xs sm:grid-cols-3"><div><p className="text-[0.65rem] uppercase tracking-[0.1em] text-ink-subtle">Dosis</p><p className="mt-1 font-medium text-ink">{prescription.dosage}</p></div><div><p className="text-[0.65rem] uppercase tracking-[0.1em] text-ink-subtle">Frecuencia</p><p className="mt-1 font-medium text-ink">{prescription.frequency}</p></div><div><p className="text-[0.65rem] uppercase tracking-[0.1em] text-ink-subtle">Cantidad</p><p className="mt-1 font-medium text-ink">{prescription.quantity}</p></div></div>
        {error ? <div className="mt-4"><p className="rounded-xl border border-rose/20 bg-rose-soft/60 px-4 py-3 text-xs leading-5 text-ink" role="alert">{error}</p></div> : null}
        <div className="mt-5 flex flex-col-reverse gap-2 border-t border-line/70 pt-5 sm:flex-row sm:justify-end"><button className="rounded-xl border border-line bg-panel-raised px-4 py-2.5 text-xs font-semibold text-ink-muted transition-colors hover:border-brand/40 hover:text-ink" disabled={isPending} onClick={onCancel} type="button">Cancelar</button><button className="inline-flex items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-strong disabled:cursor-wait disabled:opacity-60" disabled={isPending} onClick={onConfirm} type="button">{isPending ? "Dispensando..." : "Sí, dispensar"}</button></div>
      </section>
    </div>
  )
}
