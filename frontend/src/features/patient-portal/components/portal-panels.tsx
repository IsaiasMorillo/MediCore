import { ArrowUpRight, CalendarDays, ChevronRight, FileText, FlaskConical, Pill, Stethoscope } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"

import { AppointmentStatusBadge } from "@/features/appointments/components/appointment-status-badge"
import { formatAppointmentDate, formatAppointmentTime } from "@/features/appointments/utils/appointment-formatting"
import { InvoiceList } from "@/features/billing/components/invoice-list"
import { sortInvoices } from "@/features/billing/utils/billing-formatting"
import { LaboratoryResultsViewer } from "@/features/laboratory/components/laboratory-results-viewer"
import { LaboratoryStatusBadge } from "@/features/laboratory/utils/laboratory-status"
import { formatLaboratoryDate, formatLaboratoryTestType, sortLaboratoryOrders } from "@/features/laboratory/utils/laboratory-formatting"
import { formatPharmacyDate } from "@/features/pharmacy/utils/pharmacy-formatting"
import type {
  PatientPortalAppointmentsQuery,
  PatientPortalInvoicesQuery,
  PatientPortalLaboratoryQuery,
  PatientPortalPrescriptionsQuery,
} from "@/features/patient-portal/hooks/use-patient-portal"
import { PortalPanel } from "@/features/patient-portal/components/portal-panel"

export function PortalAppointmentsPanel({ compact = false, query }: { compact?: boolean; query: PatientPortalAppointmentsQuery }) {
  const appointments = query.data ?? []
  const visibleAppointments = compact ? appointments.slice(0, 3) : appointments

  return (
    <PortalPanel
      action={compact && appointments.length > 3 ? <PanelLink to="/portal/appointments">Ver todas</PanelLink> : null}
      description="Tus consultas confirmadas y próximas aparecen ordenadas por fecha."
      emptyDescription="Cuando tengas una consulta programada, aparecerá aquí con los detalles de tu visita."
      emptyTitle="No tienes citas próximas"
      error={query.error}
      icon={<CalendarDays aria-hidden="true" className="h-4 w-4" />}
      isEmpty={appointments.length === 0}
      isPending={query.isPending}
      onRetry={() => void query.refetch()}
      title={compact ? "Próximas citas" : "Tus próximas citas"}
    >
      <div className="space-y-3">
        {visibleAppointments.map((appointment, index) => (
          <article className={index === 0 ? "rounded-2xl border border-ink/10 bg-ink p-4 text-white" : "rounded-2xl border border-line/70 bg-canvas/40 p-4"} key={appointment.id}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <span className={index === 0 ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-brand-soft" : "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-strong"}>
                  <Stethoscope aria-hidden="true" className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <h3 className={index === 0 ? "truncate text-sm font-semibold" : "truncate text-sm font-semibold text-ink"}>{appointment.doctorName}</h3>
                  <p className={index === 0 ? "mt-1 truncate text-xs text-white/65" : "mt-1 truncate text-xs text-ink-muted"}>{appointment.specialty || "Consulta médica"}</p>
                </div>
              </div>
              <AppointmentStatusBadge status={appointment.status} />
            </div>
            <div className={index === 0 ? "mt-4 grid gap-3 border-t border-white/10 pt-4 text-xs sm:grid-cols-2" : "mt-4 grid gap-3 border-t border-line/70 pt-4 text-xs sm:grid-cols-2"}>
              <div>
                <p className={index === 0 ? "text-[0.64rem] font-semibold uppercase tracking-[0.12em] text-white/50" : "text-[0.64rem] font-semibold uppercase tracking-[0.12em] text-ink-subtle"}>Fecha</p>
                <p className={index === 0 ? "mt-1 font-medium" : "mt-1 font-medium text-ink"}>{formatAppointmentDate(appointment.startDateTime)}</p>
              </div>
              <div>
                <p className={index === 0 ? "text-[0.64rem] font-semibold uppercase tracking-[0.12em] text-white/50" : "text-[0.64rem] font-semibold uppercase tracking-[0.12em] text-ink-subtle"}>Hora</p>
                <p className={index === 0 ? "mt-1 font-medium" : "mt-1 font-medium text-ink"}>{formatAppointmentTime(appointment.startDateTime)} - {formatAppointmentTime(appointment.endDateTime)}</p>
              </div>
            </div>
            {appointment.notes.trim() ? <p className={index === 0 ? "mt-4 border-l-2 border-brand-soft/70 pl-3 text-xs leading-5 text-white/65" : "mt-4 border-l-2 border-brand/30 pl-3 text-xs leading-5 text-ink-muted"}>{appointment.notes}</p> : null}
          </article>
        ))}
      </div>
    </PortalPanel>
  )
}

export function PortalPrescriptionsPanel({ compact = false, query }: { compact?: boolean; query: PatientPortalPrescriptionsQuery }) {
  const prescriptions = query.data ?? []
  const visiblePrescriptions = compact ? prescriptions.slice(0, 2) : prescriptions

  return (
    <PortalPanel
      action={compact && prescriptions.length > 2 ? <PanelLink to="/portal/prescriptions">Ver todas</PanelLink> : null}
      description="Tus medicamentos con receta emitida y sus indicaciones actuales."
      emptyDescription="No hay medicamentos activos registrados para tu expediente en este momento."
      emptyTitle="No tienes recetas activas"
      error={query.error}
      icon={<Pill aria-hidden="true" className="h-4 w-4" />}
      isEmpty={prescriptions.length === 0}
      isPending={query.isPending}
      onRetry={() => void query.refetch()}
      title={compact ? "Recetas activas" : "Tus recetas activas"}
    >
      <div className="space-y-3">
        {visiblePrescriptions.map((prescription) => (
          <article className="rounded-2xl border border-line/70 bg-canvas/40 p-4" key={prescription.id}>
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-strong">
                <Pill aria-hidden="true" className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-ink">{prescription.medicationName}</h3>
                <p className="mt-1 text-xs font-medium text-brand-strong">{prescription.dosage} · {prescription.frequency}</p>
              </div>
              <span className="shrink-0 rounded-lg bg-panel px-2 py-1 text-[0.66rem] font-semibold tabular-nums text-ink-muted">{prescription.quantity} ud.</span>
            </div>
            <div className="mt-4 grid gap-3 border-t border-line/70 pt-4 sm:grid-cols-2">
              <div>
                <p className="text-[0.64rem] font-semibold uppercase tracking-[0.12em] text-ink-subtle">Indicado por</p>
                <p className="mt-1 text-xs font-medium text-ink">{prescription.doctorName}</p>
              </div>
              <div>
                <p className="text-[0.64rem] font-semibold uppercase tracking-[0.12em] text-ink-subtle">Fecha</p>
                <p className="mt-1 text-xs font-medium text-ink">{formatPharmacyDate(prescription.createdAt)}</p>
              </div>
            </div>
            {prescription.instructions.trim() ? <p className="mt-4 rounded-xl bg-panel px-3 py-2.5 text-xs leading-5 text-ink-muted"><span className="font-semibold text-ink">Indicaciones: </span>{prescription.instructions}</p> : null}
          </article>
        ))}
      </div>
    </PortalPanel>
  )
}

export function PortalInvoicesPanel({ compact = false, query }: { compact?: boolean; query: PatientPortalInvoicesQuery }) {
  const invoices = sortInvoices(query.data ?? [])
  const visibleInvoices = compact ? invoices.slice(0, 3) : invoices

  return (
    <PortalPanel
      action={compact && invoices.length > 3 ? <PanelLink to="/portal/invoices">Ver todas</PanelLink> : null}
      description="Consulta tus saldos, pagos registrados y el detalle de cada factura."
      emptyDescription="Las facturas emitidas a tu nombre aparecerán aquí cuando estén disponibles."
      emptyTitle="No tienes facturas registradas"
      error={query.error}
      icon={<FileText aria-hidden="true" className="h-4 w-4" />}
      isEmpty={invoices.length === 0}
      isPending={query.isPending}
      onRetry={() => void query.refetch()}
      title={compact ? "Facturas" : "Tus facturas"}
    >
      <InvoiceList context="portal" invoices={visibleInvoices} />
    </PortalPanel>
  )
}

export function PortalLaboratoryPanel({ compact = false, query }: { compact?: boolean; query: PatientPortalLaboratoryQuery }) {
  const results = sortLaboratoryOrders(query.data ?? [])
  const visibleResults = compact ? results.slice(0, 3) : results
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null)
  const selectedResult = results.find((result) => result.id === selectedResultId) ?? results[0]

  return (
    <PortalPanel
      action={compact && results.length > 3 ? <PanelLink to="/portal/laboratory-results">Ver todos</PanelLink> : null}
      description="Revisa los valores recibidos por el laboratorio sin interpretaciones añadidas."
      emptyDescription="Tus resultados estarán disponibles aquí después de que el laboratorio los cargue."
      emptyTitle="No hay resultados disponibles"
      error={query.error}
      icon={<FlaskConical aria-hidden="true" className="h-4 w-4" />}
      isEmpty={results.length === 0}
      isPending={query.isPending}
      onRetry={() => void query.refetch()}
      title={compact ? "Últimos resultados" : "Resultados de laboratorio"}
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)]">
        <div className="space-y-2" role="list" aria-label="Resultados disponibles">
          {visibleResults.map((result) => {
            const isSelected = result.id === selectedResult?.id

            return (
              <button
                aria-pressed={isSelected}
                className={isSelected ? "flex w-full items-center gap-3 rounded-2xl border border-brand/30 bg-brand-soft/60 p-3 text-left" : "flex w-full items-center gap-3 rounded-2xl border border-line/70 bg-canvas/40 p-3 text-left transition-colors hover:border-brand/30 hover:bg-brand-soft/30"}
                key={result.id}
                onClick={() => setSelectedResultId(result.id)}
                role="listitem"
                type="button"
              >
                <span className={isSelected ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand text-white" : "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-strong"}>
                  <FlaskConical aria-hidden="true" className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold text-ink">{formatLaboratoryTestType(result.testType)}</span>
                  <span className="mt-1 block truncate text-[0.68rem] text-ink-muted">{formatLaboratoryDate(result.resultsLoadedAt ?? result.requestedAt, false)}</span>
                </span>
                <ChevronRight aria-hidden="true" className={isSelected ? "h-4 w-4 shrink-0 text-brand-strong" : "h-4 w-4 shrink-0 text-ink-subtle"} />
              </button>
            )
          })}
        </div>
        {selectedResult ? (
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-brand-strong">Resultado seleccionado</p>
                <p className="mt-1 text-xs text-ink-muted">{formatLaboratoryTestType(selectedResult.testType)}</p>
              </div>
              <LaboratoryStatusBadge status={selectedResult.status} />
            </div>
            <LaboratoryResultsViewer order={selectedResult} />
          </div>
        ) : null}
      </div>
    </PortalPanel>
  )
}

function PanelLink({ to, children }: { children: string; to: string }) {
  return <Link className="inline-flex items-center gap-1 text-xs font-semibold text-brand-strong transition-colors hover:text-brand" to={to}>{children}<ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" /></Link>
}
