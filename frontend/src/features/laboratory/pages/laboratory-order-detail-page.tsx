import { ArrowLeft, CalendarClock, FileHeart, FilePlus2, FlaskConical, Link2, ShieldCheck, UserRound } from "lucide-react"
import type { ReactNode } from "react"
import { Link, useParams } from "react-router-dom"

import { PageHeader } from "@/components/layout/page-header"
import { useDoctor } from "@/features/doctors/hooks/use-doctors"
import { formatDoctorName } from "@/features/doctors/utils/doctor-formatting"
import { LaboratoryResultsViewer } from "@/features/laboratory/components/laboratory-results-viewer"
import { LaboratoryStatusBadge } from "@/features/laboratory/utils/laboratory-status"
import { useLaboratoryOrder } from "@/features/laboratory/hooks/use-laboratory"
import { formatLaboratoryDate, formatLaboratoryTestType } from "@/features/laboratory/utils/laboratory-formatting"
import { getLaboratoryErrorMessage } from "@/features/laboratory/utils/laboratory-errors"
import { usePatient } from "@/features/patients/hooks/use-patients"
import { formatPatientName } from "@/features/patients/utils/patient-formatting"
import { hasAnyRole } from "@/lib/permissions/roles"
import { LABORATORY_ORDER_WRITE_ROLES, LABORATORY_RESULT_WRITE_ROLES } from "@/lib/permissions/route-roles"
import { useAuthSession } from "@/lib/auth/use-auth-session"

export function LaboratoryOrderDetailPage() {
  const { session } = useAuthSession()
  const { orderId } = useParams()
  const orderQuery = useLaboratoryOrder(orderId)
  const order = orderQuery.data
  const patientQuery = usePatient(order?.patientId)
  const doctorQuery = useDoctor(order?.doctorId)
  const canCreateOrder = session ? hasAnyRole(session.user.roles, LABORATORY_ORDER_WRITE_ROLES) : false
  const canLoadResults = session ? hasAnyRole(session.user.roles, LABORATORY_RESULT_WRITE_ROLES) : false

  if (!orderId) {
    return <LaboratoryOrderDetailState message="La orden no tiene un identificador válido." />
  }

  if (orderQuery.isPending) {
    return <LaboratoryOrderDetailLoadingState />
  }

  if (orderQuery.isError || !order) {
    return <LaboratoryOrderDetailState message={getLaboratoryErrorMessage(orderQuery.error, "No pudimos cargar la orden de laboratorio.")} onRetry={() => void orderQuery.refetch()} />
  }

  const patientName = patientQuery.data ? formatPatientName(patientQuery.data) : order.patientId
  const doctorName = doctorQuery.data ? formatDoctorName(doctorQuery.data) : order.doctorId

  return (
    <div className="space-y-7">
      <Link className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-strong transition-colors hover:text-brand focus-visible:outline-none" to={`/app/laboratory?patientId=${encodeURIComponent(order.patientId)}`}><ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />Volver a órdenes del paciente</Link>
      <PageHeader
        actions={
          <>
            <LaboratoryStatusBadge status={order.status} />
            {canLoadResults && order.status !== "ResultadoCargado" ? <Link className="inline-flex items-center gap-2 rounded-xl bg-brand px-3.5 py-2.5 text-xs font-semibold text-white shadow-[0_12px_24px_-16px_var(--brand)] transition-colors hover:bg-brand-strong" to={`/app/laboratory/orders/${encodeURIComponent(order.id)}/results`}><FilePlus2 aria-hidden="true" className="h-3.5 w-3.5" />Cargar resultados</Link> : null}
            {canCreateOrder ? <Link className="inline-flex items-center gap-2 rounded-xl border border-line bg-panel px-3.5 py-2.5 text-xs font-semibold text-ink-muted transition-colors hover:border-brand/40 hover:text-ink" to={`/app/laboratory/orders/new?patientId=${encodeURIComponent(order.patientId)}&doctorId=${encodeURIComponent(order.doctorId)}`}><FlaskConical aria-hidden="true" className="h-3.5 w-3.5" />Nueva orden</Link> : null}
          </>
        }
        description={`Solicitud de ${formatLaboratoryTestType(order.testType)} creada el ${formatLaboratoryDate(order.requestedAt)}.`}
        eyebrow="Clínica · Orden de laboratorio"
        title={formatLaboratoryTestType(order.testType)}
      />

      <section className="rounded-[1.35rem] border border-line/80 bg-panel p-5 shadow-[0_20px_55px_-38px_var(--ink)] sm:p-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DetailCard href={`/app/patients/${order.patientId}`} icon={<UserRound aria-hidden="true" className="h-4 w-4" />} label="Paciente" secondary={order.patientId} value={patientName} />
          <DetailCard href={`/app/doctors/${order.doctorId}`} icon={<ShieldCheck aria-hidden="true" className="h-4 w-4" />} label="Médico solicitante" secondary={order.doctorId} value={doctorName} />
          <DetailCard icon={<CalendarClock aria-hidden="true" className="h-4 w-4" />} label="Solicitada" secondary="Zona operativa UTC" value={formatLaboratoryDate(order.requestedAt)} />
          {order.medicalRecordId ? <DetailCard href={`/app/medical-records/${order.medicalRecordId}`} icon={<FileHeart aria-hidden="true" className="h-4 w-4" />} label="Expediente clínico" secondary={order.medicalRecordId} value="Abrir expediente" /> : <DetailCard icon={<Link2 aria-hidden="true" className="h-4 w-4" />} label="Expediente clínico" secondary="No aplica" value="Sin referencia" />}
        </div>
      </section>

      <LaboratoryResultsViewer order={order} />
    </div>
  )
}

function DetailCard({ href, icon, label, secondary, value }: { href?: string; icon: ReactNode; label: string; secondary: string; value: string }) {
  const content = <><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-strong">{icon}</span><div className="min-w-0"><p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-ink-subtle">{label}</p><p className="mt-1 truncate text-sm font-semibold text-ink">{value}</p><p className="mt-1 truncate break-all font-mono text-[0.68rem] text-ink-subtle">{secondary}</p></div></>
  return href ? <Link className="flex items-start gap-3 rounded-2xl border border-line/70 bg-canvas/45 p-4 transition-colors hover:border-brand/40" to={href}>{content}</Link> : <article className="flex items-start gap-3 rounded-2xl border border-line/70 bg-canvas/45 p-4">{content}</article>
}

function LaboratoryOrderDetailLoadingState() {
  return <div aria-busy="true" aria-live="polite" className="space-y-6"><span className="block h-4 w-52 animate-pulse rounded-full bg-line/60" /><div className="space-y-3"><span className="block h-3 w-36 animate-pulse rounded-full bg-line/60" /><span className="block h-10 w-2/3 animate-pulse rounded-xl bg-line/60" /><span className="block h-4 w-full max-w-2xl animate-pulse rounded-full bg-line/60" /></div><div className="h-40 animate-pulse rounded-[1.35rem] border border-line/70 bg-panel" /><div className="h-72 animate-pulse rounded-[1.35rem] border border-line/70 bg-panel" /></div>
}

function LaboratoryOrderDetailState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center" role={onRetry ? "alert" : undefined}><p className="text-sm font-semibold text-ink">No pudimos mostrar la orden</p><p className="mt-2 max-w-sm text-xs leading-5 text-ink-muted">{message}</p><div className="mt-5 flex flex-wrap justify-center gap-2.5">{onRetry ? <button className="rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-strong" onClick={onRetry} type="button">Intentar nuevamente</button> : null}<Link className="rounded-xl border border-line bg-panel-raised px-4 py-2.5 text-xs font-semibold text-ink-muted transition-colors hover:border-brand/40 hover:text-ink" to="/app/laboratory">Volver a laboratorio</Link></div></div>
}
