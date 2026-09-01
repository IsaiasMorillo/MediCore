import { ArrowLeft, FileCheck2, FlaskConical } from "lucide-react"
import { useNavigate, useParams, Link } from "react-router-dom"

import { PageHeader } from "@/components/layout/page-header"
import { FormAlert } from "@/features/auth/components/form-controls"
import { useDoctor } from "@/features/doctors/hooks/use-doctors"
import { formatDoctorName } from "@/features/doctors/utils/doctor-formatting"
import { LaboratoryResultsForm } from "@/features/laboratory/components/laboratory-results-form"
import { useLaboratoryOrder, useLaboratoryTestTypes, useLoadLaboratoryResults } from "@/features/laboratory/hooks/use-laboratory"
import { getLaboratoryResultTemplate } from "@/features/laboratory/utils/laboratory-result-templates"
import { formatLaboratoryDate, formatLaboratoryTestType } from "@/features/laboratory/utils/laboratory-formatting"
import { getLaboratoryErrorMessage } from "@/features/laboratory/utils/laboratory-errors"
import { usePatient } from "@/features/patients/hooks/use-patients"
import { formatPatientName } from "@/features/patients/utils/patient-formatting"

export function LaboratoryResultsPage() {
  const navigate = useNavigate()
  const { orderId } = useParams()
  const orderQuery = useLaboratoryOrder(orderId)
  const order = orderQuery.data
  const patientQuery = usePatient(order?.patientId)
  const doctorQuery = useDoctor(order?.doctorId)
  const testTypesQuery = useLaboratoryTestTypes()
  const loadMutation = useLoadLaboratoryResults()

  if (!orderId) {
    return <LaboratoryResultsState message="La orden no tiene un identificador válido." />
  }

  if (orderQuery.isPending || testTypesQuery.isPending) {
    return <LaboratoryResultsLoadingState />
  }

  if (orderQuery.isError || !order) {
    return <LaboratoryResultsState message={getLaboratoryErrorMessage(orderQuery.error, "No pudimos cargar la orden de laboratorio.")} onRetry={() => void orderQuery.refetch()} />
  }

  if (testTypesQuery.isError) {
    return <LaboratoryResultsState message={getLaboratoryErrorMessage(testTypesQuery.error, "No pudimos cargar las plantillas de resultados.")} onRetry={() => void testTypesQuery.refetch()} />
  }

  const patientName = patientQuery.data ? formatPatientName(patientQuery.data) : order.patientId
  const doctorName = doctorQuery.data ? formatDoctorName(doctorQuery.data) : order.doctorId
  const fields = getLaboratoryResultTemplate(order.testType)

  if (order.status === "ResultadoCargado") {
    return (
      <div className="space-y-7">
        <BackToOrder orderId={order.id} />
        <PageHeader description="Esta orden ya tiene resultados cargados y no admite una segunda carga." eyebrow="Clínica · Resultados" title={formatLaboratoryTestType(order.testType)} />
        <div className="flex items-start gap-3 rounded-2xl border border-brand/20 bg-brand-soft/55 px-4 py-3.5"><FileCheck2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-brand-strong" /><p className="text-xs leading-5 text-ink-muted">La orden fue completada el {order.resultsLoadedAt ? formatLaboratoryDate(order.resultsLoadedAt) : "en una fecha no disponible"}. No se puede sobrescribir desde este flujo.</p></div>
        <Link className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-strong" to={`/app/laboratory/orders/${order.id}`}>Ver resultados</Link>
      </div>
    )
  }

  const handleSubmit = async (results: Record<string, unknown>) => {
    await loadMutation.mutateAsync({ id: order.id, results })
    navigate(`/app/laboratory/orders/${order.id}`, { replace: true })
  }

  return (
    <div className="space-y-7">
      <BackToOrder orderId={order.id} />
      <PageHeader description={`Carga los resultados de ${formatLaboratoryTestType(order.testType)} para ${patientName}. Usa los campos estructurados de la plantilla, sin rangos clínicos inventados.`} eyebrow="Laboratorio · Cargar resultados" title="Cargar resultados" />
      {loadMutation.isError ? <FormAlert message={getLaboratoryErrorMessage(loadMutation.error, "No pudimos cargar los resultados.")} /> : null}
      <section className="rounded-[1.35rem] border border-line/80 bg-panel p-5 shadow-[0_20px_55px_-38px_var(--ink)] sm:p-6">
        <div className="flex flex-col gap-3 border-b border-line/70 pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-strong"><FlaskConical aria-hidden="true" className="h-4 w-4" /></span><div><p className="text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-brand-strong">{formatLaboratoryTestType(order.testType)}</p><h2 className="mt-1.5 font-display text-lg font-semibold tracking-[-0.035em] text-ink">Orden {order.id}</h2><p className="mt-1 text-xs text-ink-muted">Paciente: {patientName} · Médico: {doctorName}</p></div></div><p className="text-xs text-ink-muted">Solicitada {formatLaboratoryDate(order.requestedAt)}</p>
        </div>
        <div className="pt-5"><LaboratoryResultsForm fields={fields} onSubmit={handleSubmit} serverError={null} /></div>
      </section>
    </div>
  )
}

function BackToOrder({ orderId }: { orderId: string }) {
  return <Link className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-strong transition-colors hover:text-brand focus-visible:outline-none" to={`/app/laboratory/orders/${orderId}`}><ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />Volver a la orden</Link>
}

function LaboratoryResultsLoadingState() {
  return <div aria-busy="true" aria-live="polite" className="space-y-6"><span className="block h-4 w-44 animate-pulse rounded-full bg-line/60" /><div className="space-y-3"><span className="block h-3 w-36 animate-pulse rounded-full bg-line/60" /><span className="block h-10 w-2/3 animate-pulse rounded-xl bg-line/60" /><span className="block h-4 w-full max-w-2xl animate-pulse rounded-full bg-line/60" /></div><div className="h-96 animate-pulse rounded-[1.35rem] border border-line/70 bg-panel" /></div>
}

function LaboratoryResultsState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center" role={onRetry ? "alert" : undefined}><p className="text-sm font-semibold text-ink">No pudimos preparar los resultados</p><p className="mt-2 max-w-sm text-xs leading-5 text-ink-muted">{message}</p><div className="mt-5 flex flex-wrap justify-center gap-2.5">{onRetry ? <button className="rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-strong" onClick={onRetry} type="button">Intentar nuevamente</button> : null}<Link className="rounded-xl border border-line bg-panel-raised px-4 py-2.5 text-xs font-semibold text-ink-muted transition-colors hover:border-brand/40 hover:text-ink" to="/app/laboratory">Volver a laboratorio</Link></div></div>
}
