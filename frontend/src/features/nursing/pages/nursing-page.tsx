import { Activity, FilePlus2, RefreshCw, Search, UserRound } from "lucide-react"
import { useState } from "react"
import { Link, useSearchParams } from "react-router-dom"

import { PageHeader } from "@/components/layout/page-header"
import { FormAlert } from "@/features/auth/components/form-controls"
import { usePatientVitals } from "@/features/nursing/hooks/use-nursing"
import { VitalsSummary, VitalsTimeline, VitalsTrendStrip } from "@/features/nursing/components/vitals-timeline"
import { getNursingErrorMessage } from "@/features/nursing/utils/nursing-errors"
import { sortVitalsRecords } from "@/features/nursing/utils/nursing-formatting"
import { usePatients } from "@/features/patients/hooks/use-patients"
import { formatPatientName } from "@/features/patients/utils/patient-formatting"
import { hasAnyRole } from "@/lib/permissions/roles"
import { NURSING_WRITE_ROLES } from "@/lib/permissions/route-roles"
import { useAuthSession } from "@/lib/auth/use-auth-session"

export function NursingPage() {
  const { session } = useAuthSession()
  const [searchParams] = useSearchParams()
  const initialPatientId = searchParams.get("patientId")?.trim() || ""
  const [patientSearch, setPatientSearch] = useState("")
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId)
  const patientsQuery = usePatients("")
  const vitalsQuery = usePatientVitals(selectedPatientId)
  const canCreate = session ? hasAnyRole(session.user.roles, NURSING_WRITE_ROLES) : false
  const activePatients = (patientsQuery.data ?? []).filter((patient) => patient.isActive)
  const selectedPatient = (patientsQuery.data ?? []).find((patient) => patient.id === selectedPatientId)
  const normalizedPatientSearch = patientSearch.trim().toLocaleLowerCase("es")
  const matchingPatients = activePatients.filter((patient) => {
    if (!normalizedPatientSearch) {
      return true
    }

    return `${formatPatientName(patient)} ${patient.personalData.documentId}`
      .toLocaleLowerCase("es")
      .includes(normalizedPatientSearch)
  })
  const patientOptions = selectedPatient && !matchingPatients.some((patient) => patient.id === selectedPatient.id)
    ? [selectedPatient, ...matchingPatients]
    : matchingPatients
  const records = vitalsQuery.data ?? []

  return (
    <div className="space-y-7">
      <PageHeader
        actions={canCreate ? <Link className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_-16px_var(--brand)] transition-colors hover:bg-brand-strong" to="/app/nursing/vitals/new"><FilePlus2 aria-hidden="true" className="h-4 w-4" />Registrar signos</Link> : null}
        description="Consulta y registra signos vitales por paciente sin interpretar automáticamente los valores clínicos."
        eyebrow="Clínica · Enfermería"
        title="Signos vitales"
      />

      <section className="rounded-[1.35rem] border border-line/80 bg-panel p-4 shadow-[0_20px_55px_-38px_var(--ink)] sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-brand-strong">Paciente activo</p>
            <h2 className="mt-1.5 font-display text-lg font-semibold tracking-[-0.035em] text-ink">Selecciona el contexto de atención</h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-ink-muted">El historial de signos vitales se consulta por paciente para conservar el contexto y respetar la autorización del backend.</p>
          </div>
          <div className="grid w-full gap-3 sm:grid-cols-2 lg:max-w-[34rem]">
            <label>
              <span className="mb-2 block text-xs font-semibold text-ink">Buscar paciente</span>
              <div className="relative">
                <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
                <input aria-label="Buscar paciente en enfermería" className="h-11 w-full rounded-xl border border-line bg-panel-raised pl-10 pr-3.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-brand/60 focus:ring-2 focus:ring-brand/10" onChange={(event) => setPatientSearch(event.target.value)} placeholder="Nombre o documento" type="search" value={patientSearch} />
              </div>
            </label>
            <label>
              <span className="mb-2 block text-xs font-semibold text-ink">Paciente</span>
              <select aria-label="Paciente para signos vitales" className="h-11 w-full rounded-xl border border-line bg-panel-raised px-3.5 text-sm text-ink outline-none transition-colors focus:border-brand/60 focus:ring-2 focus:ring-brand/10" onChange={(event) => setSelectedPatientId(event.target.value)} value={selectedPatientId}>
                <option value="">Selecciona un paciente</option>
                {patientOptions.map((patient) => <option key={patient.id} value={patient.id}>{formatPatientName(patient)} · {patient.personalData.documentId}</option>)}
                {patientOptions.length === 0 ? <option disabled value="">No encontramos pacientes activos</option> : null}
              </select>
            </label>
          </div>
        </div>
        {patientsQuery.isPending ? <p aria-live="polite" className="mt-4 text-xs text-ink-subtle">Cargando pacientes...</p> : null}
        {patientsQuery.isError ? (
          <div className="mt-4 space-y-3">
            <FormAlert message={getNursingErrorMessage(patientsQuery.error, "No pudimos cargar los pacientes.")} />
            <button className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-strong" onClick={() => void patientsQuery.refetch()} type="button"><RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />Intentar nuevamente</button>
          </div>
        ) : null}
      </section>

      {!selectedPatientId ? <NursingPrompt canCreate={canCreate} /> : null}
      {selectedPatientId && vitalsQuery.isPending ? <VitalsLoadingState /> : null}
      {selectedPatientId && vitalsQuery.isError ? (
        <section className="rounded-[1.35rem] border border-rose/20 bg-rose-soft/45 p-5" role="alert">
          <FormAlert message={getNursingErrorMessage(vitalsQuery.error, "No pudimos cargar los signos vitales del paciente.")} />
          <button className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-strong" onClick={() => void vitalsQuery.refetch()} type="button"><RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />Intentar nuevamente</button>
        </section>
      ) : null}
      {selectedPatientId && !vitalsQuery.isPending && !vitalsQuery.isError ? (
        <section className="space-y-5" aria-labelledby="nursing-history-title">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-brand-strong"><Activity aria-hidden="true" className="h-3.5 w-3.5" />{selectedPatient ? formatPatientName(selectedPatient) : "Paciente seleccionado"}</div>
              <h2 className="mt-1.5 font-display text-lg font-semibold tracking-[-0.035em] text-ink" id="nursing-history-title">Historial de signos vitales</h2>
              <p className="mt-1 text-xs text-ink-muted">{records.length} registro{records.length === 1 ? "" : "s"} ordenado{records.length === 1 ? "" : "s"} desde el más reciente.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-panel px-3 py-2 text-xs font-semibold text-ink-muted transition-colors hover:border-brand/40 hover:text-ink" to={`/app/patients/${encodeURIComponent(selectedPatientId)}`}><UserRound aria-hidden="true" className="h-3.5 w-3.5" />Ficha del paciente</Link>
              {canCreate ? <Link className="inline-flex items-center gap-1.5 rounded-xl bg-brand-soft px-3 py-2 text-xs font-semibold text-brand-strong transition-colors hover:bg-brand-soft/70" to={`/app/nursing/vitals/new?patientId=${encodeURIComponent(selectedPatientId)}`}><FilePlus2 aria-hidden="true" className="h-3.5 w-3.5" />Registrar valores</Link> : null}
            </div>
          </div>
          {records.length > 0 ? <VitalsSummary record={sortVitalsRecords(records)[0]} /> : null}
          <VitalsTrendStrip records={records} />
          <VitalsTimeline records={records} />
        </section>
      ) : null}
    </div>
  )
}

function NursingPrompt({ canCreate }: { canCreate: boolean }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-[1.35rem] border border-dashed border-line px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand-strong"><Activity aria-hidden="true" className="h-5 w-5" /></span>
      <p className="mt-5 text-sm font-semibold text-ink">Selecciona un paciente para consultar sus valores</p>
      <p className="mt-1 max-w-md text-xs leading-5 text-ink-muted">{canCreate ? "También puedes registrar una medición nueva desde el botón superior." : "Tu rol puede consultar el historial, pero no registrar nuevas mediciones."}</p>
    </div>
  )
}

function VitalsLoadingState() {
  return <div aria-busy="true" aria-live="polite" className="space-y-4"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((item) => <div className="h-24 animate-pulse rounded-2xl border border-line/70 bg-panel" key={item} />)}</div><div className="h-96 animate-pulse rounded-[1.35rem] border border-line/70 bg-panel" /></div>
}
