import { ArrowLeft, CreditCard, FileCheck2, ReceiptText, ShieldCheck, UserRound, XCircle } from "lucide-react"
import { useState, type ReactNode } from "react"
import { Link, useParams } from "react-router-dom"

import { PageHeader } from "@/components/layout/page-header"
import { FormAlert, SuccessAlert } from "@/features/auth/components/form-controls"
import { InvoiceCancelDialog, InvoicePaymentDialog } from "@/features/billing/components/invoice-actions"
import { useCancelInvoice, useInvoice, usePayInvoice } from "@/features/billing/hooks/use-billing"
import type { CancelInvoiceFormValues, PaymentFormValues } from "@/features/billing/schemas/billing-schemas"
import { getBillingErrorMessage } from "@/features/billing/utils/billing-errors"
import {
  formatBillingCurrency,
  formatBillingDate,
  formatInvoiceItemType,
  formatPaymentMethod,
} from "@/features/billing/utils/billing-formatting"
import { InvoiceStatusBadge } from "@/features/billing/utils/billing-status"
import { usePatient } from "@/features/patients/hooks/use-patients"
import { formatPatientName } from "@/features/patients/utils/patient-formatting"
import { useAuthSession } from "@/lib/auth/use-auth-session"

export function BillingInvoiceDetailPage() {
  const { session } = useAuthSession()
  const { invoiceId } = useParams()
  const invoiceQuery = useInvoice(invoiceId)
  const invoice = invoiceQuery.data
  const patientQuery = usePatient(invoice?.patientId)
  const payMutation = usePayInvoice()
  const cancelMutation = useCancelInvoice()
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  if (!invoiceId) {
    return <BillingInvoiceDetailState message="La factura no tiene un identificador válido." />
  }

  if (invoiceQuery.isPending) {
    return <BillingInvoiceDetailLoadingState />
  }

  if (invoiceQuery.isError || !invoice) {
    return <BillingInvoiceDetailState message={getBillingErrorMessage(invoiceQuery.error, "No pudimos cargar la factura.")} onRetry={() => void invoiceQuery.refetch()} />
  }

  const patientName = patientQuery.data ? formatPatientName(patientQuery.data) : invoice.patientId
  const canPay = invoice.status === "Pendiente" && invoice.balance > 0
  const canCancel = invoice.status === "Pendiente"

  const handlePayment = async (values: PaymentFormValues) => {
    try {
      await payMutation.mutateAsync({ amount: values.amount, id: invoice.id, method: values.method, paidBy: session?.user.fullName ?? null })
      setIsPaymentDialogOpen(false)
      setSuccessMessage("El pago fue registrado. El saldo se actualizó con la respuesta del servidor.")
      payMutation.reset()
    } catch {
      // Keep the dialog open so reception can review the server response and retry.
    }
  }

  const handleCancel = async (values: CancelInvoiceFormValues) => {
    try {
      await cancelMutation.mutateAsync({ cancelledBy: session?.user.fullName ?? null, id: invoice.id, reason: values.reason || null })
      setIsCancelDialogOpen(false)
      setSuccessMessage("La factura fue anulada correctamente.")
      cancelMutation.reset()
    } catch {
      // Keep the destructive dialog open after a rejected request.
    }
  }

  return (
    <div className="space-y-7">
      <Link className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-strong transition-colors hover:text-brand focus-visible:outline-none" to={`/app/billing?patientId=${encodeURIComponent(invoice.patientId)}`}>
        <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
        Volver a facturación
      </Link>
      <PageHeader
        actions={<div className="flex flex-wrap items-center gap-2.5"><InvoiceStatusBadge status={invoice.status} />{canPay ? <button className="inline-flex items-center gap-2 rounded-xl bg-brand px-3.5 py-2.5 text-xs font-semibold text-white shadow-[0_12px_24px_-16px_var(--brand)] transition-colors hover:bg-brand-strong" onClick={() => { payMutation.reset(); setSuccessMessage(null); setIsPaymentDialogOpen(true) }} type="button"><CreditCard aria-hidden="true" className="h-3.5 w-3.5" />Registrar pago</button> : null}{canCancel ? <button className="inline-flex items-center gap-2 rounded-xl border border-rose/25 bg-rose-soft/50 px-3.5 py-2.5 text-xs font-semibold text-rose-strong transition-colors hover:border-rose/45 hover:bg-rose-soft" onClick={() => { cancelMutation.reset(); setSuccessMessage(null); setIsCancelDialogOpen(true) }} type="button"><XCircle aria-hidden="true" className="h-3.5 w-3.5" />Anular factura</button> : null}</div>}
        description={`Emitida el ${formatBillingDate(invoice.invoiceDate)} por ${invoice.createdBy || "usuario no identificado"}.`}
        eyebrow="Operación · Facturación"
        title={invoice.number}
      />

      {successMessage ? <SuccessAlert message={successMessage} /> : null}
      {payMutation.isError && !isPaymentDialogOpen ? <FormAlert message={getBillingErrorMessage(payMutation.error, "No pudimos registrar el pago.")} /> : null}
      {cancelMutation.isError && !isCancelDialogOpen ? <FormAlert message={getBillingErrorMessage(cancelMutation.error, "No pudimos anular la factura.")} /> : null}

      <InvoiceHeadline invoice={invoice} />
      <InvoicePatientCard patientId={invoice.patientId} patientName={patientName} />
      <InvoiceItems invoiceItems={invoice.items} />
      <InvoiceBreakdown coverageType={invoice.coverageType} discount={invoice.discount} insuranceCoverage={invoice.insuranceCoverage} subtotal={invoice.subtotal} taxes={invoice.taxes} total={invoice.total} />
      <InvoicePayments payments={invoice.payments} />

      {invoice.status === "Pagada" ? <InvoiceStateNote icon={<FileCheck2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-brand-strong" />} message="La factura está completamente pagada. No se permiten nuevos pagos ni anulación." /> : null}
      {invoice.status === "Anulada" ? <InvoiceStateNote icon={<XCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-rose-strong" />} message="Esta factura fue anulada y ya no admite operaciones." tone="danger" /> : null}

      {isPaymentDialogOpen && canPay ? <InvoicePaymentDialog error={payMutation.isError ? getBillingErrorMessage(payMutation.error, "No pudimos registrar el pago.") : null} invoice={invoice} isPending={payMutation.isPending} onCancel={() => { payMutation.reset(); setIsPaymentDialogOpen(false) }} onSubmit={handlePayment} /> : null}
      {isCancelDialogOpen && canCancel ? <InvoiceCancelDialog error={cancelMutation.isError ? getBillingErrorMessage(cancelMutation.error, "No pudimos anular la factura.") : null} invoice={invoice} isPending={cancelMutation.isPending} onCancel={() => { cancelMutation.reset(); setIsCancelDialogOpen(false) }} onSubmit={handleCancel} /> : null}
      {patientQuery.isError ? <p className="text-xs text-ink-subtle">No pudimos cargar el nombre del paciente; se muestra su identificador interno.</p> : null}
      {patientQuery.isPending ? <p aria-live="polite" className="text-xs text-ink-subtle">Cargando información del paciente...</p> : null}
    </div>
  )
}

function InvoiceHeadline({ invoice }: { invoice: { balance: number; paidAmount: number; status: string; total: number } }) {
  return (
    <section aria-label="Resumen financiero de la factura" className="grid gap-4 sm:grid-cols-3">
      <InvoiceMetric label="Total" value={formatBillingCurrency(invoice.total)} tone="default" />
      <InvoiceMetric label="Pagado" value={formatBillingCurrency(invoice.paidAmount)} tone="brand" />
      <InvoiceMetric label="Saldo pendiente" value={formatBillingCurrency(invoice.balance)} tone={invoice.balance > 0 && invoice.status === "Pendiente" ? "warning" : "brand"} />
    </section>
  )
}

function InvoiceMetric({ label, tone, value }: { label: string; tone: "brand" | "default" | "warning"; value: string }) {
  const toneClass = tone === "warning" ? "text-amber-strong" : tone === "brand" ? "text-brand-strong" : "text-ink"

  return <article className="rounded-[1.2rem] border border-line/80 bg-panel p-4 shadow-[0_16px_40px_-32px_var(--ink)]"><p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-ink-subtle">{label}</p><p className={`mt-2 font-display text-2xl font-semibold tracking-[-0.05em] ${toneClass}`}>{value}</p></article>
}

function InvoicePatientCard({ patientId, patientName }: { patientId: string; patientName: string }) {
  return (
    <section className="rounded-[1.35rem] border border-line/80 bg-panel p-5 shadow-[0_20px_55px_-38px_var(--ink)] sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-strong"><UserRound aria-hidden="true" className="h-4 w-4" /></span><div className="min-w-0"><p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-ink-subtle">Paciente</p><h2 className="mt-1 truncate text-base font-semibold text-ink">{patientName}</h2><p className="mt-1 break-all font-mono text-[0.68rem] text-ink-subtle">{patientId}</p></div></div>
        <Link className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-line bg-panel-raised px-3 py-2 text-xs font-semibold text-ink-muted transition-colors hover:border-brand/40 hover:text-ink" to={`/app/patients/${encodeURIComponent(patientId)}`}>Abrir ficha <UserRound aria-hidden="true" className="h-3.5 w-3.5" /></Link>
      </div>
    </section>
  )
}

function InvoiceItems({ invoiceItems }: { invoiceItems: readonly { description: string; quantity: number; subtotal: number; type: string; unitPrice: number }[] }) {
  return (
    <section className="rounded-[1.35rem] border border-line/80 bg-panel p-5 shadow-[0_20px_55px_-38px_var(--ink)] sm:p-6">
      <div className="flex items-center gap-2 border-b border-line/70 pb-4"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-soft text-brand-strong"><ReceiptText aria-hidden="true" className="h-4 w-4" /></span><div><h2 className="font-display text-base font-semibold tracking-[-0.025em] text-ink">Items facturados</h2><p className="mt-1 text-xs text-ink-muted">Detalle de los conceptos registrados en la factura.</p></div></div>
      <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[38rem] border-collapse text-left text-xs"><thead><tr className="border-b border-line/70 text-[0.65rem] uppercase tracking-[0.1em] text-ink-subtle"><th className="pb-3 pr-4 font-semibold">Concepto</th><th className="pb-3 pr-4 font-semibold">Tipo</th><th className="pb-3 pr-4 text-right font-semibold">Cantidad</th><th className="pb-3 pr-4 text-right font-semibold">Precio</th><th className="pb-3 text-right font-semibold">Subtotal</th></tr></thead><tbody>{invoiceItems.map((item, index) => <tr className="border-b border-line/60 last:border-0" key={`${item.description}-${index}`}><td className="py-3 pr-4 font-medium text-ink">{item.description}</td><td className="py-3 pr-4 text-ink-muted">{formatInvoiceItemType(item.type)}</td><td className="py-3 pr-4 text-right text-ink-muted">{item.quantity}</td><td className="py-3 pr-4 text-right text-ink-muted">{formatBillingCurrency(item.unitPrice)}</td><td className="py-3 text-right font-semibold text-ink">{formatBillingCurrency(item.subtotal)}</td></tr>)}</tbody></table></div>
    </section>
  )
}

function InvoiceBreakdown({ coverageType, discount, insuranceCoverage, subtotal, taxes, total }: { coverageType: string; discount: number; insuranceCoverage: number; subtotal: number; taxes: number; total: number }) {
  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section className="rounded-[1.35rem] border border-line/80 bg-panel p-5 shadow-[0_20px_55px_-38px_var(--ink)] sm:p-6"><div className="flex items-center gap-2 border-b border-line/70 pb-4"><ShieldCheck aria-hidden="true" className="h-4 w-4 text-brand-strong" /><h2 className="font-display text-base font-semibold tracking-[-0.025em] text-ink">Cobertura y cargos</h2></div><dl className="mt-5 grid gap-4 sm:grid-cols-2"><BreakdownValue label="Tipo de cobertura" value={coverageType} /><BreakdownValue label="Subtotal" value={formatBillingCurrency(subtotal)} /><BreakdownValue label="Cobertura del seguro" value={formatBillingCurrency(insuranceCoverage)} /><BreakdownValue label="Descuento" value={formatBillingCurrency(discount)} /><BreakdownValue label="ITBIS" value={formatBillingCurrency(taxes)} /></dl></section>
      <section className="rounded-[1.35rem] border border-brand/20 bg-brand-soft/55 p-5 sm:p-6"><p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-brand-strong">Total oficial</p><p className="mt-2 font-display text-3xl font-semibold tracking-[-0.06em] text-ink">{formatBillingCurrency(total)}</p><p className="mt-2 text-xs leading-5 text-ink-muted">Importe calculado y devuelto por el backend de facturación.</p></section>
    </section>
  )
}

function BreakdownValue({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-ink-subtle">{label}</dt><dd className="mt-1.5 text-sm font-medium text-ink">{value}</dd></div>
}

function InvoicePayments({ payments }: { payments: readonly { amount: number; paidAt: string; paidBy: string | null; method: string }[] }) {
  return (
    <section className="rounded-[1.35rem] border border-line/80 bg-panel p-5 shadow-[0_20px_55px_-38px_var(--ink)] sm:p-6"><div className="flex items-center gap-2 border-b border-line/70 pb-4"><CreditCard aria-hidden="true" className="h-4 w-4 text-brand-strong" /><div><h2 className="font-display text-base font-semibold tracking-[-0.025em] text-ink">Pagos registrados</h2><p className="mt-1 text-xs text-ink-muted">Movimientos confirmados por el servidor.</p></div></div>{payments.length > 0 ? <div className="mt-5 space-y-2">{payments.map((payment, index) => <div className="flex flex-col gap-2 rounded-2xl border border-line/70 bg-canvas/45 p-3.5 sm:flex-row sm:items-center sm:justify-between" key={`${payment.paidAt}-${index}`}><div><p className="text-sm font-semibold text-ink">{formatPaymentMethod(payment.method)}</p><p className="mt-1 text-xs text-ink-muted">{formatBillingDate(payment.paidAt, true)} · {payment.paidBy || "Usuario no identificado"}</p></div><p className="text-sm font-semibold text-brand-strong">{formatBillingCurrency(payment.amount)}</p></div>)}</div> : <p className="mt-5 rounded-2xl border border-dashed border-line bg-canvas/35 px-4 py-6 text-center text-xs text-ink-muted">No hay pagos registrados para esta factura.</p>}</section>
  )
}

function InvoiceStateNote({ icon, message, tone = "brand" }: { icon: ReactNode; message: string; tone?: "brand" | "danger" }) {
  return <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3.5 ${tone === "danger" ? "border-rose/20 bg-rose-soft/50" : "border-brand/20 bg-brand-soft/55"}`} role="status">{icon}<p className="text-xs leading-5 text-ink">{message}</p></div>
}

function BillingInvoiceDetailLoadingState() {
  return <div aria-busy="true" aria-live="polite" className="space-y-6"><span className="block h-4 w-44 animate-pulse rounded-full bg-line/60" /><div className="space-y-3"><span className="block h-3 w-36 animate-pulse rounded-full bg-line/60" /><span className="block h-10 w-2/3 animate-pulse rounded-xl bg-line/60" /><span className="block h-4 w-full max-w-2xl animate-pulse rounded-full bg-line/60" /></div><div className="grid gap-4 sm:grid-cols-3"><div className="h-28 animate-pulse rounded-[1.2rem] border border-line/70 bg-panel" /><div className="h-28 animate-pulse rounded-[1.2rem] border border-line/70 bg-panel" /><div className="h-28 animate-pulse rounded-[1.2rem] border border-line/70 bg-panel" /></div><div className="h-28 animate-pulse rounded-[1.35rem] border border-line/70 bg-panel" /><div className="h-64 animate-pulse rounded-[1.35rem] border border-line/70 bg-panel" /></div>
}

function BillingInvoiceDetailState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center" role={onRetry ? "alert" : undefined}><p className="text-sm font-semibold text-ink">No pudimos mostrar la factura</p><p className="mt-2 max-w-sm text-xs leading-5 text-ink-muted">{message}</p><div className="mt-5 flex flex-wrap justify-center gap-2.5">{onRetry ? <button className="rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-strong" onClick={onRetry} type="button">Intentar nuevamente</button> : null}<Link className="rounded-xl border border-line bg-panel-raised px-4 py-2.5 text-xs font-semibold text-ink-muted transition-colors hover:border-brand/40 hover:text-ink" to="/app/billing">Volver a facturación</Link></div></div>
}
