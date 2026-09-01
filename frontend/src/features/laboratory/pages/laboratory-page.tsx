import { ClipboardList, FilePlus2, FlaskConical, RefreshCw, Search, UserRound } from "lucide-react"
import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"

import { PageHeader } from "@/components/layout/page-header"
import { FormAlert } from "@/features/auth/components/form-controls"
import { LaboratoryOrderList } from "@/features/laboratory/components/laboratory-order-list"
import { useLaboratoryTestTypes, usePatientLaboratoryOrders } from "@/features/laboratory/hooks/use-laboratory"
import { getLaboratoryErrorMessage } from "@/features/laboratory/utils/laboratory-errors"
import { usePatients } from "@/features/patients/hooks/use-patients"
import { formatPatientName } from "@/features/patients/utils/patient-formatting"
import { hasAnyRole } from "@/lib/permissions/roles"
import { LABORATORY_ORDER_WRITE_ROLES, LABORATORY_RESULT_WRITE_ROLES } from "@/lib/permissions/route-roles"
import { useAuthSession } from "@/lib/auth/use-auth-session"
import { formatLaboratoryTestType } from "@/features/laboratory/utils/laboratory-formatting"

export function LaboratoryPage() {
  const { session } = useAuthSession()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialPatientId = searchParams.get("patientId")?.trim() || ""
  const [patientSearch, setPatientSearch] = useState("")
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId)
  const [orderId, setOrderId] = useState("")
  const [orderLookupError, setOrderLookupError] = useState<string | null>(null)
  const patientsQuery = usePatients("")
  const testTypesQuery = useLaboratoryTestTypes()
  const ordersQuery = usePatientLaboratoryOrders(selectedPatientId)
  const canCreateOrder = session ? hasAnyRole(session.user.roles, LABORATORY_ORDER_WRITE_ROLES) : false
  const canLoadResults = session ? hasAnyRole(session.user.roles, LABORATORY_RESULT_WRITE_ROLES) : false
  const activePatients = (patientsQuery.data ?? []).filter((patient) => patient.isActive)
  const selectedPatient = (patientsQuery.data ?? []).find((patient) => patient.id === selectedPatientId)
  const normalizedPatientSearch = patientSearch.trim().toLocaleLowerCase("es")
  const matchingPatients = activePatients.filter((patient) => !normalizedPatientSearch || `${formatPatientName(patient)} ${patient.personalData.documentId}`.toLocaleLowerCase("es").includes(normalizedPatientSearch))
  const patientOptions = selectedPatient && !matchingPatients.some((patient) => patient.id === selectedPatient.id) ? [selectedPatient, ...matchingPatients] : matchingPatients
  const testTypes = testTypesQuery.data?.supported ?? []
  const orders = ordersQuery.data ?? []

  return (
    <div className="space-y-7">
      <PageHeader
        actions={canCreateOrder ? <Link className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_-16px_var(--brand)] transition-colors hover:bg-brand-strong" to="/app/laboratory/orders/new"><FilePlus2 aria-hidden="true" className="h-4 w-4" />Crear orden</Link> : null}
        description="Consulta órdenes por paciente o por identificador. MediCore no simula una bandeja global que la API todavía no expone."
        eyebrow="Clínica · Laboratorio"
        title="Órdenes de laboratorio"
      />

      <section className="rounded-[1.35rem] border border-line/80 bg-panel p-4 shadow-[0_20px_55px_-38px_var(--ink)] sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-brand-strong">Contexto de consulta</p>
            <h2 className="mt-1.5 font-display text-lg font-semibold tracking-[-0.035em] text-ink">Busca las órdenes de un paciente</h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-ink-muted">Selecciona un paciente para consultar todas sus órdenes autorizadas y abrir su detalle.</p>
          </div>
          <div className="grid w-full gap-3 sm:grid-cols-2 lg:max-w-[34rem]">
            <label>
              <span className="mb-2 block text-xs font-semibold text-ink">Buscar paciente</span>
              <div className="relative"><Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" /><input aria-label="Buscar paciente en laboratorio" className="h-11 w-full rounded-xl border border-line bg-panel-raised pl-10 pr-3.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-brand/60 focus:ring-2 focus:ring-brand/10" onChange={(event) => setPatientSearch(event.target.value)} placeholder="Nombre o documento" type="search" value={patientSearch} /></div>
            </label>
            <label>
              <span className="mb-2 block text-xs font-semibold text-ink">Paciente</span>
              <select aria-label="Paciente para órdenes de laboratorio" className="h-11 w-full rounded-xl border border-line bg-panel-raised px-3.5 text-sm text-ink outline-none transition-colors focus:border-brand/60 focus:ring-2 focus:ring-brand/10" onChange={(event) => setSelectedPatientId(event.target.value)} value={selectedPatientId}>
                <option value="">Selecciona un paciente</option>
                {patientOptions.map((patient) => <option key={patient.id} value={patient.id}>{formatPatientName(patient)} · {patient.personalData.documentId}</option>)}
                {patientOptions.length === 0 ? <option disabled value="">No encontramos pacientes activos</option> : null}
              </select>
            </label>
          </div>
        </div>
        {patientsQuery.isPending ? <p aria-live="polite" className="mt-4 text-xs text-ink-subtle">Cargando pacientes...</p> : null}
        {patientsQuery.isError ? <div className="mt-4 space-y-3"><FormAlert message={getLaboratoryErrorMessage(patientsQuery.error, "No pudimos cargar los pacientes.")} /><button className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-strong" onClick={() => void patientsQuery.refetch()} type="button"><RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />Intentar nuevamente</button></div> : null}
      </section>

      <LaboratoryTestCatalog isError={testTypesQuery.isError} isPending={testTypesQuery.isPending} onRetry={() => void testTypesQuery.refetch()} testTypes={testTypes} />

      <LaboratoryOrderLookup error={orderLookupError} onSubmit={(id) => navigate(`/app/laboratory/orders/${encodeURIComponent(id)}`)} orderId={orderId} setError={setOrderLookupError} setOrderId={setOrderId} />

      {!selectedPatientId ? <LaboratoryPrompt /> : null}
      {selectedPatientId && ordersQuery.isPending ? <OrdersLoadingState /> : null}
      {selectedPatientId && ordersQuery.isError ? <section className="rounded-[1.35rem] border border-rose/20 bg-rose-soft/45 p-5" role="alert"><FormAlert message={getLaboratoryErrorMessage(ordersQuery.error, "No pudimos cargar las órdenes del paciente.")} /><button className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-strong" onClick={() => void ordersQuery.refetch()} type="button"><RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />Intentar nuevamente</button></section> : null}
      {selectedPatientId && !ordersQuery.isPending && !ordersQuery.isError ? (
        <section aria-labelledby="laboratory-orders-title" className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div><div className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-brand-strong"><UserRound aria-hidden="true" className="h-3.5 w-3.5" />{selectedPatient ? formatPatientName(selectedPatient) : "Paciente seleccionado"}</div><h2 className="mt-1.5 font-display text-lg font-semibold tracking-[-0.035em] text-ink" id="laboratory-orders-title">Órdenes del paciente</h2></div>
            <p className="text-xs text-ink-muted">{orders.length} orden{orders.length === 1 ? "" : "es"}</p>
          </div>
          <LaboratoryOrderList canLoadResults={canLoadResults} orders={orders} />
        </section>
      ) : null}
    </div>
  )
}

function LaboratoryTestCatalog({ isError, isPending, onRetry, testTypes }: { isError: boolean; isPending: boolean; onRetry: () => void; testTypes: readonly string[] }) {
  return (
    <section className="rounded-[1.35rem] border border-line/80 bg-panel p-5 shadow-[0_20px_55px_-38px_var(--ink)] sm:p-6">
      <div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-strong"><FlaskConical aria-hidden="true" className="h-4 w-4" /></span><div><p className="text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-brand-strong">Catálogo respaldado por API</p><h2 className="mt-1.5 font-display text-lg font-semibold tracking-[-0.035em] text-ink">Pruebas disponibles</h2></div></div>
      {isPending ? <p aria-live="polite" className="mt-4 text-xs text-ink-subtle">Cargando catálogo de pruebas...</p> : null}
      {isError ? <div className="mt-4 space-y-3"><FormAlert message="No pudimos cargar el catálogo de pruebas." /><button className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-strong" onClick={onRetry} type="button"><RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />Intentar nuevamente</button></div> : null}
      {!isPending && !isError ? <div className="mt-4 flex flex-wrap gap-2">{testTypes.map((testType) => <span className="rounded-full border border-line bg-canvas/60 px-3 py-1.5 text-xs font-medium text-ink-muted" key={testType}>{formatLaboratoryTestType(testType)}</span>)}</div> : null}
    </section>
  )
}

function LaboratoryOrderLookup({ error, onSubmit, orderId, setError, setOrderId }: { error: string | null; onSubmit: (id: string) => void; orderId: string; setError: (value: string | null) => void; setOrderId: (value: string) => void }) {
  return <section className="rounded-[1.35rem] border border-line/80 bg-ink p-5 text-white shadow-[0_20px_55px_-38px_var(--ink)] sm:p-6"><div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-brand-soft"><ClipboardList aria-hidden="true" className="h-5 w-5" /></span><div><h2 className="font-display text-lg font-semibold tracking-[-0.035em]">Abrir una orden por ID</h2><p className="mt-1 max-w-xl text-xs leading-5 text-white/60">Úsalo cuando el laboratorio o el médico ya tengan el identificador de una orden concreta.</p></div></div><form className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-xl" onSubmit={(event) => { event.preventDefault(); const normalizedId = orderId.trim(); if (!normalizedId) { setError("Ingresa el identificador de la orden."); return } setError(null); onSubmit(normalizedId) }}><label className="sr-only" htmlFor="laboratory-order-lookup">Identificador de la orden</label><input aria-invalid={Boolean(error)} className="h-11 min-w-0 flex-1 rounded-xl border border-white/15 bg-white/10 px-3.5 text-sm text-white outline-none placeholder:text-white/40 focus:border-brand-soft/60 focus:ring-2 focus:ring-brand-soft/20" id="laboratory-order-lookup" onChange={(event) => { setError(null); setOrderId(event.target.value) }} placeholder="Ej. 67f2..." value={orderId} /><button className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-soft px-4 text-xs font-semibold text-brand-strong transition-colors hover:bg-white" type="submit"><Search aria-hidden="true" className="h-4 w-4" />Abrir orden</button></form></div>{error ? <p className="mt-3 text-xs text-rose-soft" role="alert">{error}</p> : null}</section>
}

function LaboratoryPrompt() {
  return <div className="flex min-h-56 flex-col items-center justify-center rounded-[1.35rem] border border-dashed border-line px-6 py-12 text-center"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand-strong"><FlaskConical aria-hidden="true" className="h-5 w-5" /></span><p className="mt-5 text-sm font-semibold text-ink">Selecciona un paciente para consultar sus órdenes</p><p className="mt-1 max-w-md text-xs leading-5 text-ink-muted">La consulta por paciente reemplaza una cola global hasta que el backend exponga un endpoint para ella.</p></div>
}

function OrdersLoadingState() {
  return <div aria-busy="true" aria-live="polite" className="space-y-3">{[0, 1, 2].map((item) => <div className="h-40 animate-pulse rounded-2xl border border-line/70 bg-panel" key={item} />)}</div>
}
