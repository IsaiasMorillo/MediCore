import { ArrowLeft, FilePlus2, ReceiptText, RefreshCw, Search, UserRound } from "lucide-react"
import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"

import { PageHeader } from "@/components/layout/page-header"
import { FormAlert } from "@/features/auth/components/form-controls"
import { InvoiceBuilder } from "@/features/billing/components/invoice-builder"
import { InvoiceList } from "@/features/billing/components/invoice-list"
import { useCreateInvoice, usePatientInvoices } from "@/features/billing/hooks/use-billing"
import type { InvoiceItemInput } from "@/features/billing/types"
import { getBillingErrorMessage } from "@/features/billing/utils/billing-errors"
import { usePatients } from "@/features/patients/hooks/use-patients"
import { formatPatientName } from "@/features/patients/utils/patient-formatting"
import { useAuthSession } from "@/lib/auth/use-auth-session"

export function BillingPage() {
  const { session } = useAuthSession()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const routePatientId = searchParams.get("patientId")?.trim() ?? ""
  const [selectedPatientId, setSelectedPatientId] = useState(routePatientId)
  const [patientSearch, setPatientSearch] = useState("")
  const [isBuilderOpen, setIsBuilderOpen] = useState(searchParams.get("mode") === "new")
  const patientsQuery = usePatients("")
  const invoicesQuery = usePatientInvoices(selectedPatientId)
  const createMutation = useCreateInvoice()
  const patients = patientsQuery.data ?? []
  const selectedPatient = patients.find((patient) => patient.id === selectedPatientId)
  const activePatients = patients.filter((patient) => patient.isActive)
  const normalizedSearch = patientSearch.trim().toLocaleLowerCase("es")
  const matchingPatients = activePatients.filter((patient) => `${formatPatientName(patient)} ${patient.personalData.documentId}`.toLocaleLowerCase("es").includes(normalizedSearch))
  const patientOptions = selectedPatient && !matchingPatients.some((patient) => patient.id === selectedPatient.id) ? [selectedPatient, ...matchingPatients] : matchingPatients

  const handlePatientChange = (patientId: string) => {
    setSelectedPatientId(patientId)
    setIsBuilderOpen(false)
    createMutation.reset()
    navigate(patientId ? `/app/billing?patientId=${encodeURIComponent(patientId)}` : "/app/billing", { replace: true })
  }

  const handleCreate = async ({ items, patientId }: { items: InvoiceItemInput[]; patientId: string }) => {
    try {
      const invoice = await createMutation.mutateAsync({ createdBy: session?.user.fullName ?? "", items, patientId })
      navigate(`/app/billing/invoices/${encodeURIComponent(invoice.id)}`)
    } catch {
      // The builder renders the server response and keeps the entered items available for retry.
    }
  }

  return (
    <div className="space-y-7">
      <PageHeader actions={selectedPatientId ? <button className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_-16px_var(--brand)] transition-colors hover:bg-brand-strong" onClick={() => { createMutation.reset(); setIsBuilderOpen(true) }} type="button"><FilePlus2 aria-hidden="true" className="h-4 w-4" />Nueva factura</button> : null} description="Consulta y crea facturas desde el contexto de un paciente. MediCore no simula un listado global que la API todavía no expone." eyebrow="Operación · Recepción" title="Facturación" />

      <section className="rounded-[1.35rem] border border-line/80 bg-panel p-4 shadow-[0_20px_55px_-38px_var(--ink)] sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div><p className="text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-brand-strong">Contexto de consulta</p><h2 className="mt-1.5 font-display text-lg font-semibold tracking-[-0.035em] text-ink">Localiza las facturas de un paciente</h2><p className="mt-1 max-w-2xl text-xs leading-5 text-ink-muted">Selecciona un paciente para consultar su historial, saldo y pagos registrados.</p></div>
          <div className="grid w-full gap-3 sm:grid-cols-2 lg:max-w-[34rem]">
            <label><span className="mb-2 block text-xs font-semibold text-ink">Buscar paciente</span><div className="relative"><Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" /><input aria-label="Buscar paciente para facturación" className="h-11 w-full rounded-xl border border-line bg-panel-raised pl-10 pr-3.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-brand/60 focus:ring-2 focus:ring-brand/10" onChange={(event) => setPatientSearch(event.target.value)} placeholder="Nombre o documento" type="search" value={patientSearch} /></div></label>
            <label><span className="mb-2 block text-xs font-semibold text-ink">Paciente</span><select aria-label="Paciente para facturación" className="h-11 w-full rounded-xl border border-line bg-panel-raised px-3.5 text-sm text-ink outline-none transition-colors focus:border-brand/60 focus:ring-2 focus:ring-brand/10" onChange={(event) => handlePatientChange(event.target.value)} value={selectedPatientId}><option value="">Selecciona un paciente</option>{patientOptions.map((patient) => <option key={patient.id} value={patient.id}>{formatPatientName(patient)} · {patient.personalData.documentId}</option>)}{patientOptions.length === 0 ? <option disabled value="">No encontramos pacientes activos</option> : null}</select></label>
          </div>
        </div>
        {patientsQuery.isPending ? <p aria-live="polite" className="mt-4 text-xs text-ink-subtle">Cargando pacientes...</p> : null}
        {patientsQuery.isError ? <div className="mt-4 space-y-3"><FormAlert message={getBillingErrorMessage(patientsQuery.error, "No pudimos cargar los pacientes.")} /><button className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-strong" onClick={() => void patientsQuery.refetch()} type="button"><RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />Intentar nuevamente</button></div> : null}
      </section>

      {isBuilderOpen ? <InvoiceBuilder initialPatientId={selectedPatientId} isSubmitting={createMutation.isPending} onPatientChange={setSelectedPatientId} onSubmit={handleCreate} patients={patients} serverError={createMutation.isError ? getBillingErrorMessage(createMutation.error, "No pudimos crear la factura.") : null} /> : null}
      {!selectedPatientId ? <BillingPrompt onCreate={() => setIsBuilderOpen(true)} /> : null}
      {selectedPatientId && invoicesQuery.isPending ? <InvoicesLoadingState /> : null}
      {selectedPatientId && invoicesQuery.isError ? <section className="rounded-[1.35rem] border border-rose/20 bg-rose-soft/45 p-5" role="alert"><FormAlert message={getBillingErrorMessage(invoicesQuery.error, "No pudimos cargar las facturas del paciente.")} /><button className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-strong" onClick={() => void invoicesQuery.refetch()} type="button"><RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />Intentar nuevamente</button></section> : null}
      {selectedPatientId && !invoicesQuery.isPending && !invoicesQuery.isError ? <section aria-labelledby="billing-invoices-title" className="space-y-4"><div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><div className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-brand-strong"><UserRound aria-hidden="true" className="h-3.5 w-3.5" />{selectedPatient ? formatPatientName(selectedPatient) : "Paciente seleccionado"}</div><h2 className="mt-1.5 font-display text-lg font-semibold tracking-[-0.035em] text-ink" id="billing-invoices-title">Facturas del paciente</h2></div><p className="text-xs text-ink-muted">{(invoicesQuery.data ?? []).length} factura{(invoicesQuery.data ?? []).length === 1 ? "" : "s"}</p></div><InvoiceList invoices={invoicesQuery.data ?? []} /></section> : null}
      {selectedPatientId ? <Link className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-strong transition-colors hover:text-brand focus-visible:outline-none" to={`/app/patients/${encodeURIComponent(selectedPatientId)}`}><ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />Volver al paciente</Link> : null}
    </div>
  )
}

function BillingPrompt({ onCreate }: { onCreate: () => void }) {
  return <div className="flex min-h-56 flex-col items-center justify-center rounded-[1.35rem] border border-dashed border-line px-6 py-12 text-center"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand-strong"><ReceiptText aria-hidden="true" className="h-5 w-5" /></span><p className="mt-5 text-sm font-semibold text-ink">Selecciona un paciente para consultar sus facturas</p><p className="mt-1 max-w-md text-xs leading-5 text-ink-muted">La operación de facturación comienza desde la ficha del paciente y conserva el contexto de cada saldo.</p><button className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-strong" onClick={onCreate} type="button"><FilePlus2 aria-hidden="true" className="h-3.5 w-3.5" />Crear factura</button></div>
}

function InvoicesLoadingState() {
  return <div aria-busy="true" aria-live="polite" className="space-y-3">{[0, 1].map((item) => <div className="h-36 animate-pulse rounded-2xl border border-line/70 bg-panel" key={item} />)}</div>
}
