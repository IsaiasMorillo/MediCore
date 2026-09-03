import { ArrowUpRight, CalendarDays, FileText, FlaskConical, HeartPulse, Pill } from "lucide-react"
import type { ReactNode } from "react"
import { Link } from "react-router-dom"

import { countPendingPortalInvoices, getPortalFirstName } from "@/features/patient-portal/utils/patient-portal-formatting"
import type { PatientPortalQueryState } from "@/features/patient-portal/hooks/use-patient-portal"
import { PortalAppointmentsPanel, PortalInvoicesPanel, PortalLaboratoryPanel, PortalPrescriptionsPanel } from "@/features/patient-portal/components/portal-panels"

export function PortalOverview({ fullName, portal }: { fullName: string; portal: PatientPortalQueryState }) {
  const appointments = portal.appointments.data ?? []
  const prescriptions = portal.prescriptions.data ?? []
  const invoices = portal.invoices.data ?? []
  const laboratoryResults = portal.laboratoryResults.data ?? []
  const pendingInvoices = countPendingPortalInvoices(invoices)

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[1.6rem] bg-ink p-5 text-white shadow-[0_24px_60px_-35px_var(--ink)] sm:p-7">
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-end">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-brand-soft">
              <HeartPulse aria-hidden="true" className="h-4 w-4" />
              <span className="text-[0.66rem] font-semibold uppercase tracking-[0.15em]">Tu resumen personal</span>
            </div>
            <h2 className="mt-4 max-w-xl font-display text-[clamp(1.55rem,3vw,2.4rem)] font-semibold leading-tight tracking-[-0.055em]">Todo lo importante de tu cuidado, en un solo lugar.</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/65">Hola, {getPortalFirstName(fullName)}. Aquí puedes revisar tus próximas citas, tratamientos, facturas y resultados disponibles.</p>
          </div>
          <Link className="inline-flex w-fit items-center gap-2 rounded-xl bg-brand-soft px-3.5 py-2.5 text-xs font-semibold text-brand-strong transition-colors hover:bg-white" to="/portal/appointments">Ver mis citas<ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" /></Link>
        </div>
      </section>

      <section aria-label="Resumen de tu información" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <PortalMetricCard detail={appointments.length === 1 ? "cita programada" : "citas programadas"} icon={<CalendarDays aria-hidden="true" className="h-4 w-4" />} label="Próximas citas" to="/portal/appointments" value={appointments.length} />
        <PortalMetricCard detail={prescriptions.length === 1 ? "tratamiento activo" : "tratamientos activos"} icon={<Pill aria-hidden="true" className="h-4 w-4" />} label="Recetas activas" to="/portal/prescriptions" value={prescriptions.length} />
        <PortalMetricCard detail={pendingInvoices === 0 ? "Sin saldos pendientes" : "requieren revisión"} icon={<FileText aria-hidden="true" className="h-4 w-4" />} label="Facturas pendientes" to="/portal/invoices" value={pendingInvoices} />
        <PortalMetricCard detail={laboratoryResults.length === 1 ? "resultado disponible" : "resultados disponibles"} icon={<FlaskConical aria-hidden="true" className="h-4 w-4" />} label="Resultados" to="/portal/laboratory-results" value={laboratoryResults.length} />
      </section>

      <section aria-label="Información reciente" className="grid gap-5 xl:grid-cols-2">
        <PortalAppointmentsPanel compact query={portal.appointments} />
        <PortalPrescriptionsPanel compact query={portal.prescriptions} />
        <PortalInvoicesPanel compact query={portal.invoices} />
        <PortalLaboratoryPanel compact query={portal.laboratoryResults} />
      </section>
    </div>
  )
}

function PortalMetricCard({ detail, icon, label, to, value }: { detail: string; icon: ReactNode; label: string; to: string; value: number }) {
  return (
    <Link className="group rounded-2xl border border-line/80 bg-panel p-4 shadow-[0_16px_40px_-32px_var(--ink)] transition-colors hover:border-brand/35 hover:bg-panel-raised" to={to}>
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft text-brand-strong">{icon}</span>
        <ArrowUpRight aria-hidden="true" className="h-4 w-4 text-ink-subtle transition-colors group-hover:text-brand-strong" />
      </div>
      <p className="mt-5 text-xs font-medium text-ink-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold tracking-[-0.045em] text-ink tabular-nums">{value}</p>
      <p className="mt-1 text-[0.68rem] text-ink-subtle">{detail}</p>
    </Link>
  )
}
