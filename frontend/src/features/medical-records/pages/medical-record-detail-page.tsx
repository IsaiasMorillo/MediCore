import { ArrowLeft, CalendarClock, FileCheck2, FlaskConical, Link2, Pill, ShieldCheck, Stethoscope, UserRound } from "lucide-react"
import { Link, useParams } from "react-router-dom"
import type { ReactNode } from "react"

import { PageHeader } from "@/components/layout/page-header"
import { ClinicalRecordSection } from "@/features/medical-records/components/clinical-record-timeline"
import { useMedicalRecord } from "@/features/medical-records/hooks/use-medical-records"
import { formatVitalSign, formatMedicalRecordDate } from "@/features/medical-records/utils/medical-record-formatting"
import { getMedicalRecordErrorMessage } from "@/features/medical-records/utils/medical-record-errors"
import { useDoctor } from "@/features/doctors/hooks/use-doctors"
import { formatDoctorName } from "@/features/doctors/utils/doctor-formatting"
import { hasAnyRole } from "@/lib/permissions/roles"
import { LABORATORY_ORDER_WRITE_ROLES, PRESCRIPTION_WRITE_ROLES } from "@/lib/permissions/route-roles"
import { useAuthSession } from "@/lib/auth/use-auth-session"
import { usePatient } from "@/features/patients/hooks/use-patients"
import { formatPatientName } from "@/features/patients/utils/patient-formatting"

export function MedicalRecordDetailPage() {
  const { session } = useAuthSession()
  const { recordId } = useParams()
  const recordQuery = useMedicalRecord(recordId)
  const record = recordQuery.data
  const patientQuery = usePatient(record?.patientId)
  const doctorQuery = useDoctor(record?.doctorId)
  const canOrderLaboratory = session ? hasAnyRole(session.user.roles, LABORATORY_ORDER_WRITE_ROLES) : false
  const canCreatePrescription = session ? hasAnyRole(session.user.roles, PRESCRIPTION_WRITE_ROLES) : false

  if (!recordId) {
    return <MedicalRecordDetailState message="El expediente no tiene un identificador válido." />
  }

  if (recordQuery.isPending) {
    return <MedicalRecordDetailLoadingState />
  }

  if (recordQuery.isError || !record) {
    return (
      <MedicalRecordDetailState
        message={getMedicalRecordErrorMessage(recordQuery.error, "No pudimos cargar el expediente clínico.")}
        onRetry={() => void recordQuery.refetch()}
      />
    )
  }

  const patientName = patientQuery.data ? formatPatientName(patientQuery.data) : record.patientId
  const doctorName = doctorQuery.data ? formatDoctorName(doctorQuery.data) : record.doctorId

  return (
    <div className="space-y-7">
      <Link className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-strong transition-colors hover:text-brand focus-visible:outline-none" to={`/app/medical-records/patient/${record.patientId}`}>
        <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
        Volver al historial del paciente
      </Link>
      <PageHeader
        actions={
          <>
            <Link className="inline-flex items-center gap-2 rounded-xl border border-line bg-panel px-3.5 py-2.5 text-xs font-semibold text-ink-muted transition-colors hover:border-brand/40 hover:text-ink" to={`/app/medical-records/new?patientId=${encodeURIComponent(record.patientId)}&doctorId=${encodeURIComponent(record.doctorId)}`}>
              Crear otro registro
            </Link>
            {canOrderLaboratory ? <Link className="inline-flex items-center gap-2 rounded-xl bg-brand px-3.5 py-2.5 text-xs font-semibold text-white shadow-[0_12px_24px_-16px_var(--brand)] transition-colors hover:bg-brand-strong" to={`/app/laboratory/orders/new?patientId=${encodeURIComponent(record.patientId)}&doctorId=${encodeURIComponent(record.doctorId)}&medicalRecordId=${encodeURIComponent(record.id)}`}><FlaskConical aria-hidden="true" className="h-3.5 w-3.5" />Ordenar laboratorio</Link> : null}
            {canCreatePrescription ? <Link className="inline-flex items-center gap-2 rounded-xl border border-line bg-panel px-3.5 py-2.5 text-xs font-semibold text-ink-muted transition-colors hover:border-brand/40 hover:text-ink" to={`/app/pharmacy/prescriptions?patientId=${encodeURIComponent(record.patientId)}&medicalRecordId=${encodeURIComponent(record.id)}&mode=new`}><Pill aria-hidden="true" className="h-3.5 w-3.5" />Crear receta</Link> : null}
          </>
        }
        description={`Consulta asentada el ${formatMedicalRecordDate(record.consultationDate)}. Este registro es inmutable y no admite edición.`}
        eyebrow="Clínica · Expediente clínico"
        title={record.diagnosis}
      />

      <div className="flex items-start gap-3 rounded-2xl border border-brand/20 bg-brand-soft/55 px-4 py-3.5">
        <FileCheck2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-brand-strong" />
        <div>
          <p className="text-xs font-semibold text-ink">Registro clínico protegido</p>
          <p className="mt-1 text-xs leading-5 text-ink-muted">Los datos se muestran tal como fueron guardados. Las correcciones deben seguir el flujo clínico definido por el backend.</p>
        </div>
      </div>

      <section className="rounded-[1.35rem] border border-line/80 bg-panel p-5 shadow-[0_20px_55px_-38px_var(--ink)] sm:p-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DetailCard icon={<UserRound aria-hidden="true" className="h-4 w-4" />} label="Paciente" value={patientName} secondary={record.patientId} href={`/app/patients/${record.patientId}`} />
          <DetailCard icon={<Stethoscope aria-hidden="true" className="h-4 w-4" />} label="Médico" value={doctorName} secondary={record.doctorId} href={`/app/doctors/${record.doctorId}`} />
          <DetailCard icon={<CalendarClock aria-hidden="true" className="h-4 w-4" />} label="Consulta" value={formatMedicalRecordDate(record.consultationDate)} secondary="Zona operativa UTC" />
          <DetailCard icon={<Link2 aria-hidden="true" className="h-4 w-4" />} label="Cita relacionada" value={record.appointmentId ? "Abrir cita" : "Sin cita asociada"} secondary={record.appointmentId ?? "No aplica"} href={record.appointmentId ? `/app/appointments/${record.appointmentId}` : undefined} />
        </div>
      </section>

      <section className="rounded-[1.35rem] border border-line/80 bg-panel p-5 shadow-[0_20px_55px_-38px_var(--ink)] sm:p-6">
        <div className="flex items-center gap-2 border-b border-line/70 pb-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-soft text-brand-strong"><ShieldCheck aria-hidden="true" className="h-4 w-4" /></span>
          <div>
            <h2 className="font-display text-base font-semibold tracking-[-0.025em] text-ink">Signos vitales</h2>
            <p className="mt-1 text-xs text-ink-muted">Valores registrados durante la consulta.</p>
          </div>
        </div>
        <dl className="grid gap-4 pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <VitalValue label="Presión arterial" value={record.vitalSigns.bloodPressure ? `${record.vitalSigns.bloodPressure} mmHg` : "No registrada"} />
          <VitalValue label="Frecuencia cardiaca" value={formatVitalSign(record.vitalSigns.heartRate, "bpm")} />
          <VitalValue label="Temperatura" value={formatVitalSign(record.vitalSigns.temperature, "°C")} />
          <VitalValue label="Peso" value={formatVitalSign(record.vitalSigns.weightKg, "kg")} />
        </dl>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <ClinicalRecordSection title="Diagnóstico" value={record.diagnosis} />
        <ClinicalRecordSection title="Observaciones clínicas" value={record.observations} />
        <ClinicalRecordSection title="Plan de tratamiento" value={record.treatmentPlan} />
        <RelatedItems patientId={record.patientId} prescriptionIds={record.prescriptionIds} laboratoryOrderIds={record.laboratoryOrderIds} />
      </div>
    </div>
  )
}

function DetailCard({ href, icon, label, secondary, value }: { href?: string; icon: ReactNode; label: string; secondary: string; value: string }) {
  const content = (
    <>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-strong">{icon}</span>
      <div className="min-w-0">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-ink-subtle">{label}</p>
        <p className="mt-1 truncate text-sm font-semibold text-ink">{value}</p>
        <p className="mt-1 truncate font-mono text-[0.68rem] text-ink-subtle">{secondary}</p>
      </div>
    </>
  )

  return href ? (
    <Link className="flex items-start gap-3 rounded-2xl border border-line/70 bg-canvas/45 p-4 transition-colors hover:border-brand/40" to={href}>{content}</Link>
  ) : (
    <article className="flex items-start gap-3 rounded-2xl border border-line/70 bg-canvas/45 p-4">{content}</article>
  )
}

function VitalValue({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-ink-subtle">{label}</dt><dd className="mt-1.5 text-sm font-medium text-ink">{value}</dd></div>
}

function RelatedItems({ laboratoryOrderIds, patientId, prescriptionIds }: { laboratoryOrderIds: readonly string[]; patientId: string; prescriptionIds: readonly string[] }) {
  return (
    <section className="rounded-2xl border border-line/70 bg-canvas/45 p-4 sm:p-5">
      <div className="flex items-center gap-2 text-xs font-semibold text-ink"><FlaskConical aria-hidden="true" className="h-4 w-4 text-brand-strong" />Referencias relacionadas</div>
      <div className="mt-4 space-y-3">
        <RelatedList label="Recetas" patientId={patientId} values={prescriptionIds} />
        <RelatedList label="Órdenes de laboratorio" values={laboratoryOrderIds} />
      </div>
    </section>
  )
}

function RelatedList({ label, patientId, values }: { label: string; patientId?: string; values: readonly string[] }) {
  return (
    <div>
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-ink-subtle">{label}</p>
      {values.length > 0 ? <ul className="mt-2 space-y-1.5">{values.map((value) => <li className="break-all font-mono text-xs text-ink-muted" key={value}>{label === "Órdenes de laboratorio" ? <Link className="text-brand-strong hover:text-brand" to={`/app/laboratory/orders/${encodeURIComponent(value)}`}>{value}</Link> : <Link className="text-brand-strong hover:text-brand" to={`/app/pharmacy/prescriptions/patient/${encodeURIComponent(patientId ?? "")}`}>{value}</Link>}</li>)}</ul> : <p className="mt-1 text-xs text-ink-subtle">Sin referencias registradas.</p>}
    </div>
  )
}

function MedicalRecordDetailLoadingState() {
  return (
    <div aria-busy="true" aria-live="polite" className="space-y-6">
      <span className="block h-4 w-44 animate-pulse rounded-full bg-line/60" />
      <div className="space-y-3"><span className="block h-3 w-36 animate-pulse rounded-full bg-line/60" /><span className="block h-10 w-2/3 animate-pulse rounded-xl bg-line/60" /><span className="block h-4 w-full max-w-2xl animate-pulse rounded-full bg-line/60" /></div>
      <div className="h-24 animate-pulse rounded-2xl border border-line/70 bg-panel" />
      <div className="h-40 animate-pulse rounded-[1.35rem] border border-line/70 bg-panel" />
      <div className="grid gap-5 lg:grid-cols-2"><div className="h-48 animate-pulse rounded-[1.35rem] border border-line/70 bg-panel" /><div className="h-48 animate-pulse rounded-[1.35rem] border border-line/70 bg-panel" /></div>
    </div>
  )
}

function MedicalRecordDetailState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center" role={onRetry ? "alert" : undefined}>
      <p className="text-sm font-semibold text-ink">No pudimos mostrar el expediente</p>
      <p className="mt-2 max-w-sm text-xs leading-5 text-ink-muted">{message}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2.5">
        {onRetry ? <button className="rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-strong" onClick={onRetry} type="button">Intentar nuevamente</button> : null}
        <Link className="rounded-xl border border-line bg-panel-raised px-4 py-2.5 text-xs font-semibold text-ink-muted transition-colors hover:border-brand/40 hover:text-ink" to="/app/medical-records/search">Volver a expedientes</Link>
      </div>
    </div>
  )
}
