import { ArrowUpRight, FilePlus2, ReceiptText } from "lucide-react"
import { Link } from "react-router-dom"

import { FormAlert } from "@/features/auth/components/form-controls"
import { InvoiceList } from "@/features/billing/components/invoice-list"
import { usePatientInvoices } from "@/features/billing/hooks/use-billing"
import { getBillingErrorMessage } from "@/features/billing/utils/billing-errors"

export function PatientInvoicesPanel({ canCreate, patientId }: { canCreate: boolean; patientId: string }) {
  const invoicesQuery = usePatientInvoices(patientId)
  const invoices = invoicesQuery.data ?? []

  return (
    <section className="rounded-[1.35rem] border border-line/80 bg-panel p-5 shadow-[0_20px_55px_-38px_var(--ink)] sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-strong"><ReceiptText aria-hidden="true" className="h-4 w-4" /></span>
          <div><h2 className="font-display text-base font-semibold tracking-[-0.025em] text-ink">Facturación</h2><p className="mt-1 text-xs leading-5 text-ink-muted">Facturas, saldos y pagos asociados a este paciente.</p></div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {canCreate ? <Link className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-panel-raised px-3 py-2 text-xs font-semibold text-ink-muted transition-colors hover:border-brand/40 hover:text-ink" to={`/app/billing?patientId=${encodeURIComponent(patientId)}&mode=new`}><FilePlus2 aria-hidden="true" className="h-3.5 w-3.5" />Nueva factura</Link> : null}
          <Link className="inline-flex items-center gap-1.5 rounded-xl bg-brand-soft px-3 py-2 text-xs font-semibold text-brand-strong transition-colors hover:bg-brand-soft/70" to={`/app/billing?patientId=${encodeURIComponent(patientId)}`}>Ver facturas <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" /></Link>
        </div>
      </div>
      {invoicesQuery.isPending ? <InvoicesPanelLoadingState /> : null}
      {invoicesQuery.isError ? <div className="mt-5"><FormAlert message={getBillingErrorMessage(invoicesQuery.error, "No pudimos cargar las facturas del paciente.")} /><button className="mt-4 rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-strong" onClick={() => void invoicesQuery.refetch()} type="button">Intentar nuevamente</button></div> : null}
      {!invoicesQuery.isPending && !invoicesQuery.isError ? <div className="mt-5"><InvoiceList invoices={invoices} /></div> : null}
    </section>
  )
}

function InvoicesPanelLoadingState() {
  return <div aria-busy="true" aria-live="polite" className="mt-5 space-y-3"><div className="h-36 animate-pulse rounded-2xl border border-line/70 bg-canvas/45" /><div className="h-36 animate-pulse rounded-2xl border border-line/70 bg-canvas/45" /></div>
}
