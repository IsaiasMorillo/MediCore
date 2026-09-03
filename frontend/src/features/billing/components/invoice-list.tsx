import { ArrowUpRight, ReceiptText } from "lucide-react"
import { Link } from "react-router-dom"

import type { Invoice } from "@/features/billing/types"
import {
  formatBillingCurrency,
  formatBillingDate,
  sortInvoices,
} from "@/features/billing/utils/billing-formatting"
import { InvoiceStatusBadge } from "@/features/billing/utils/billing-status"

export function InvoiceList({
  context = "internal",
  invoices,
}: {
  context?: "internal" | "portal"
  invoices: readonly Invoice[]
}) {
  const sortedInvoices = sortInvoices(invoices)

  if (sortedInvoices.length === 0) {
    return (
      <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-line px-6 py-10 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-strong">
          <ReceiptText aria-hidden="true" className="h-4 w-4" />
        </span>
        <p className="mt-3 text-sm font-semibold text-ink">{context === "portal" ? "No tienes facturas registradas" : "No hay facturas para este paciente"}</p>
        <p className="mt-1 max-w-sm text-xs leading-5 text-ink-muted">{context === "portal" ? "Las facturas emitidas a tu nombre aparecerán aquí cuando estén disponibles." : "Las facturas creadas desde el área de recepción aparecerán aquí."}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {sortedInvoices.map((invoice) => (
        <article className="rounded-2xl border border-line/80 bg-panel-raised p-4 sm:p-5" key={invoice.id}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-strong">
                <ReceiptText aria-hidden="true" className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-ink">Factura {invoice.number}</h3>
                <p className="mt-1 text-xs text-ink-muted">{formatBillingDate(invoice.invoiceDate, true)}</p>
              </div>
            </div>
            <InvoiceStatusBadge status={invoice.status} />
          </div>

          <dl className="mt-4 grid gap-3 border-t border-line/70 pt-4 text-xs sm:grid-cols-3">
            <div>
              <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-ink-subtle">Total</dt>
              <dd className="mt-1 font-semibold text-ink">{formatBillingCurrency(invoice.total)}</dd>
            </div>
            <div>
              <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-ink-subtle">Pagado</dt>
              <dd className="mt-1 font-medium text-ink">{formatBillingCurrency(invoice.paidAmount)}</dd>
            </div>
            <div>
              <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-ink-subtle">Saldo</dt>
              <dd className={invoice.balance > 0 ? "mt-1 font-semibold text-amber-strong" : "mt-1 font-semibold text-brand-strong"}>{formatBillingCurrency(invoice.balance)}</dd>
            </div>
          </dl>

          {context === "portal" ? <PortalInvoiceDetails invoice={invoice} /> : (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-line/70 pt-4">
              <Link className="inline-flex items-center gap-1.5 rounded-xl bg-brand-soft px-3 py-2 text-xs font-semibold text-brand-strong transition-colors hover:bg-brand-soft/70" to={`/app/billing/invoices/${encodeURIComponent(invoice.id)}`}>
                Ver factura
                <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
              </Link>
              <Link className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-xs font-semibold text-ink-muted transition-colors hover:border-brand/40 hover:text-ink" to={`/app/patients/${encodeURIComponent(invoice.patientId)}`}>
                Abrir paciente
                <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </article>
      ))}
    </div>
  )
}

function PortalInvoiceDetails({ invoice }: { invoice: Invoice }) {
  return (
    <details className="mt-4 border-t border-line/70 pt-4">
      <summary className="cursor-pointer text-xs font-semibold text-brand-strong">Ver detalle de factura</summary>
      <div className="mt-4 space-y-4">
        <ul className="divide-y divide-line/60 rounded-xl border border-line/60 bg-canvas/40 px-3">
          {invoice.items.map((item, index) => (
            <li className="flex items-start justify-between gap-4 py-3 text-xs" key={`${item.description}-${index}`}>
              <span className="min-w-0"><span className="font-medium text-ink">{item.description}</span><span className="mt-1 block text-ink-subtle">{item.quantity} × {formatBillingCurrency(item.unitPrice)}</span></span>
              <span className="shrink-0 font-semibold tabular-nums text-ink">{formatBillingCurrency(item.subtotal)}</span>
            </li>
          ))}
        </ul>
        <dl className="grid gap-2 border-t border-line/70 pt-3 text-xs sm:grid-cols-2">
          <div className="flex justify-between gap-4"><dt className="text-ink-muted">Subtotal</dt><dd className="font-medium tabular-nums text-ink">{formatBillingCurrency(invoice.subtotal)}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-ink-muted">Cobertura</dt><dd className="font-medium tabular-nums text-ink">-{formatBillingCurrency(invoice.insuranceCoverage)}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-ink-muted">Impuestos</dt><dd className="font-medium tabular-nums text-ink">{formatBillingCurrency(invoice.taxes)}</dd></div>
          <div className="flex justify-between gap-4"><dt className="font-semibold text-ink">Total</dt><dd className="font-semibold tabular-nums text-ink">{formatBillingCurrency(invoice.total)}</dd></div>
        </dl>
      </div>
    </details>
  )
}
