import { ClipboardList, FilePlus2, RefreshCw, Search, UserRound } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"

import { PageHeader } from "@/components/layout/page-header"
import { FormAlert } from "@/features/auth/components/form-controls"
import { ClinicalHistorySnapshot, ClinicalRecordTimeline } from "@/features/medical-records/components/clinical-record-timeline"
import { useClinicalHistorySearch } from "@/features/medical-records/hooks/use-medical-records"
import { getMedicalRecordErrorMessage } from "@/features/medical-records/utils/medical-record-errors"
import type { PatientClinicalHistoryResult } from "@/features/medical-records/types"

export function MedicalRecordSearchPage() {
  const [term, setTerm] = useState("")
  const [submittedTerm, setSubmittedTerm] = useState("")
  const [searchError, setSearchError] = useState<string | null>(null)
  const searchQuery = useClinicalHistorySearch(submittedTerm)
  const results = searchQuery.data ?? []

  return (
    <div className="space-y-7">
      <PageHeader
        actions={
          <Link
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_-16px_var(--brand)] transition-colors hover:bg-brand-strong"
            to="/app/medical-records/new"
          >
            <FilePlus2 aria-hidden="true" className="h-4 w-4" />
            Nuevo expediente
          </Link>
        }
        description="Busca por nombre, documento o identificador de paciente para consultar el historial clínico autorizado."
        eyebrow="Clínica · Expedientes"
        title="Historial clínico"
      />

      <section className="rounded-[1.35rem] border border-line/80 bg-panel p-4 shadow-[0_20px_55px_-38px_var(--ink)] sm:p-5">
        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault()
            const normalizedTerm = term.trim()

            if (!normalizedTerm) {
              setSearchError("Ingresa un nombre, documento o ID de paciente.")
              return
            }

            setSearchError(null)
            setSubmittedTerm(normalizedTerm)
          }}
        >
          <label className="sr-only" htmlFor="medical-record-search">Buscar historial clínico</label>
          <div className="relative min-w-0 flex-1">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
            <input
              aria-describedby={searchError ? "medical-record-search-error" : "medical-record-search-hint"}
              aria-invalid={Boolean(searchError)}
              className="h-12 w-full rounded-xl border border-line bg-panel-raised pl-10 pr-3.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-brand/60 focus:ring-2 focus:ring-brand/10"
              id="medical-record-search"
              onChange={(event) => {
                setSearchError(null)
                setTerm(event.target.value)
              }}
              placeholder="Nombre, documento o ID del paciente"
              type="search"
              value={term}
            />
          </div>
          <button className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-white shadow-[0_12px_24px_-16px_var(--brand)] transition-colors hover:bg-brand-strong" type="submit">
            <Search aria-hidden="true" className="h-4 w-4" />
            Buscar historial
          </button>
        </form>
        {searchError ? <p className="mt-2 text-xs text-rose-strong" id="medical-record-search-error" role="alert">{searchError}</p> : null}
        {!searchError ? <p className="mt-2 text-[0.68rem] text-ink-subtle" id="medical-record-search-hint">La búsqueda devuelve el resumen del paciente y sus registros más recientes.</p> : null}
        {searchQuery.isFetching && submittedTerm ? <p aria-live="polite" className="mt-3 text-[0.68rem] text-ink-subtle">Buscando historial...</p> : null}
      </section>

      {searchQuery.isError ? (
        <section className="rounded-[1.35rem] border border-rose/20 bg-rose-soft/45 p-5" role="alert">
          <FormAlert message={getMedicalRecordErrorMessage(searchQuery.error, "No pudimos buscar el historial clínico.")} />
          <button className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-strong" onClick={() => void searchQuery.refetch()} type="button">
            <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
            Intentar nuevamente
          </button>
        </section>
      ) : null}
      {searchQuery.isPending && submittedTerm ? <SearchLoadingState /> : null}
      {!submittedTerm && !searchQuery.isError ? <SearchPrompt /> : null}
      {!searchQuery.isPending && !searchQuery.isError && submittedTerm && results.length === 0 ? <SearchEmptyState term={submittedTerm} /> : null}
      {!searchQuery.isPending && !searchQuery.isError && results.length > 0 ? (
        <section aria-labelledby="clinical-search-results-title" className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold tracking-[-0.035em] text-ink" id="clinical-search-results-title">Pacientes encontrados</h2>
              <p className="mt-1 text-xs text-ink-muted">{results.length} resultado{results.length === 1 ? "" : "s"} para “{submittedTerm}”.</p>
            </div>
            <span aria-live="polite" className="hidden text-[0.68rem] text-ink-subtle sm:inline">Resultados bajo demanda</span>
          </div>
          <div className="space-y-4">
            {results.map((result) => <ClinicalHistorySearchResult key={result.patientId} result={result} />)}
          </div>
        </section>
      ) : null}
    </div>
  )
}

function ClinicalHistorySearchResult({ result }: { result: PatientClinicalHistoryResult }) {
  return (
    <article className="rounded-[1.35rem] border border-line/80 bg-panel p-5 shadow-[0_20px_55px_-38px_var(--ink)] sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-xs font-bold text-brand-strong">
            {getInitials(result.patientName)}
          </span>
          <div className="min-w-0">
            <h3 className="truncate font-display text-lg font-semibold tracking-[-0.035em] text-ink">{result.patientName}</h3>
            <p className="mt-1 text-xs text-ink-muted">Documento <span className="font-mono">{result.documentId}</span> · {result.medicalRecords.length} registro{result.medicalRecords.length === 1 ? "" : "s"}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-panel-raised px-3 py-2 text-xs font-semibold text-ink-muted transition-colors hover:border-brand/40 hover:text-ink" to={`/app/patients/${result.patientId}`}>
            <UserRound aria-hidden="true" className="h-3.5 w-3.5" />
            Ficha del paciente
          </Link>
          <Link className="inline-flex items-center gap-1.5 rounded-xl bg-brand-soft px-3 py-2 text-xs font-semibold text-brand-strong transition-colors hover:bg-brand-soft/70" to={`/app/medical-records/patient/${result.patientId}`}>
            Ver historial
            <ClipboardList aria-hidden="true" className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-subtle">Antecedentes registrados</h4>
          <div className="mt-3"><ClinicalHistorySnapshot history={result.clinicalHistory} /></div>
        </div>
        <div>
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-subtle">Timeline clínico</h4>
            {result.medicalRecords.length > 3 ? <span className="text-[0.68rem] text-ink-subtle">3 más recientes</span> : null}
          </div>
          <div className="mt-3"><ClinicalRecordTimeline limit={3} records={result.medicalRecords} /></div>
        </div>
      </div>
    </article>
  )
}

function SearchPrompt() {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-[1.35rem] border border-dashed border-line px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand-strong"><ClipboardList aria-hidden="true" className="h-5 w-5" /></span>
      <p className="mt-5 text-sm font-semibold text-ink">Busca un paciente para comenzar</p>
      <p className="mt-1 max-w-md text-xs leading-5 text-ink-muted">El historial clínico se consulta por paciente para mantener el contexto de atención y evitar una bandeja global sin respaldo de la API.</p>
    </div>
  )
}

function SearchEmptyState({ term }: { term: string }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center rounded-[1.35rem] border border-dashed border-line px-6 py-12 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-soft text-brand-strong"><Search aria-hidden="true" className="h-5 w-5" /></span>
      <p className="mt-4 text-sm font-semibold text-ink">No encontramos pacientes</p>
      <p className="mt-1 max-w-sm text-xs leading-5 text-ink-muted">No hay coincidencias para “{term}”. Prueba con el nombre completo, el documento o el ID del paciente.</p>
    </div>
  )
}

function SearchLoadingState() {
  return (
    <div aria-busy="true" aria-live="polite" className="space-y-4">
      {[0, 1].map((item) => <div className="h-80 animate-pulse rounded-[1.35rem] border border-line/70 bg-panel" key={item} />)}
    </div>
  )
}

function getInitials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "P"
}
