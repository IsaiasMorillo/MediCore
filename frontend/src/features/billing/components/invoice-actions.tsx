import { zodResolver } from "@hookform/resolvers/zod"
import { CreditCard, LoaderCircle, XCircle } from "lucide-react"
import { useForm, useWatch } from "react-hook-form"

import { FieldError, FormAlert, FormErrorSummary, SubmitButton } from "@/features/auth/components/form-controls"
import { getFormErrorMessages } from "@/features/auth/utils/form-errors"
import {
  cancelInvoiceFormSchema,
  paymentFormSchema,
  type CancelInvoiceFormValues,
  type PaymentFormValues,
} from "@/features/billing/schemas/billing-schemas"
import type { Invoice } from "@/features/billing/types"
import { formatBillingCurrency, formatPaymentMethod } from "@/features/billing/utils/billing-formatting"

export function InvoicePaymentDialog({
  error,
  invoice,
  isPending,
  onCancel,
  onSubmit,
}: {
  error?: string | null
  invoice: Invoice
  isPending: boolean
  onCancel: () => void
  onSubmit: (values: PaymentFormValues) => void | Promise<void>
}) {
  const {
    formState: { errors, isSubmitting },
    control,
    handleSubmit,
    register,
    setError,
  } = useForm<PaymentFormValues>({
    defaultValues: { amount: invoice.balance, method: "Efectivo" },
    mode: "onBlur",
    resolver: zodResolver(paymentFormSchema),
    shouldFocusError: true,
  })
  const amount = useWatch({ control, name: "amount" })
  const estimatedBalance = Number.isFinite(amount) ? Math.max(0, invoice.balance - amount) : invoice.balance
  const validationMessages = getFormErrorMessages(errors)

  const handleFormSubmit = (values: PaymentFormValues) => {
    if (values.amount > invoice.balance) {
      setError("amount", { message: `El pago no puede superar el saldo de ${formatBillingCurrency(invoice.balance)}.`, type: "validate" })
      return
    }

    void onSubmit(values)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 p-4 sm:items-center" role="presentation">
      <section aria-describedby="pay-invoice-description" aria-labelledby="pay-invoice-title" aria-modal="true" className="w-full max-w-lg rounded-[1.35rem] border border-line/80 bg-panel p-5 shadow-2xl sm:p-6" role="dialog">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-strong"><CreditCard aria-hidden="true" className="h-5 w-5" /></span>
          <div><p className="text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-brand-strong">Recepción · Registrar pago</p><h2 className="mt-1.5 font-display text-lg font-semibold tracking-[-0.035em] text-ink" id="pay-invoice-title">Registrar pago de factura</h2></div>
        </div>
        <p className="mt-4 text-sm leading-6 text-ink-muted" id="pay-invoice-description">Confirma el monto y método. La actualización del saldo ocurrirá después de la confirmación del servidor.</p>
        <div className="mt-4 grid gap-3 rounded-2xl border border-line/70 bg-canvas/45 p-4 text-xs sm:grid-cols-2">
          <div><p className="text-[0.65rem] uppercase tracking-[0.1em] text-ink-subtle">Saldo antes</p><p className="mt-1 text-base font-semibold text-ink">{formatBillingCurrency(invoice.balance)}</p></div>
          <div><p className="text-[0.65rem] uppercase tracking-[0.1em] text-ink-subtle">Saldo después</p><p className="mt-1 text-base font-semibold text-brand-strong">{formatBillingCurrency(estimatedBalance)}</p></div>
        </div>
        <form className="mt-5 space-y-4" noValidate onSubmit={handleSubmit(handleFormSubmit)}>
          <FormErrorSummary messages={validationMessages} />
          {error ? <FormAlert message={error} /> : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-ink" htmlFor="invoice-payment-amount">Monto</label>
              <input {...register("amount", { valueAsNumber: true })} aria-describedby={errors.amount ? "invoice-payment-amount-error" : undefined} aria-invalid={Boolean(errors.amount)} className="h-11 w-full rounded-xl border border-line bg-panel-raised px-3.5 text-sm text-ink outline-none transition-colors focus:border-brand/60 focus:ring-2 focus:ring-brand/10" id="invoice-payment-amount" min="0.01" step="0.01" type="number" />
              {errors.amount?.message ? <FieldError id="invoice-payment-amount-error" message={errors.amount.message} /> : null}
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-ink" htmlFor="invoice-payment-method">Método de pago</label>
              <select {...register("method")} aria-describedby={errors.method ? "invoice-payment-method-error" : undefined} aria-invalid={Boolean(errors.method)} className="h-11 w-full rounded-xl border border-line bg-panel-raised px-3.5 text-sm text-ink outline-none transition-colors focus:border-brand/60 focus:ring-2 focus:ring-brand/10" id="invoice-payment-method">
                <option value="Efectivo">{formatPaymentMethod("Efectivo")}</option>
                <option value="EFTPOS">{formatPaymentMethod("EFTPOS")}</option>
                <option value="Transferencia">{formatPaymentMethod("Transferencia")}</option>
              </select>
              {errors.method?.message ? <FieldError id="invoice-payment-method-error" message={errors.method.message} /> : null}
            </div>
          </div>
          <div className="flex flex-col-reverse gap-2 border-t border-line/70 pt-5 sm:flex-row sm:justify-end">
            <button className="rounded-xl border border-line bg-panel-raised px-4 py-2.5 text-xs font-semibold text-ink-muted transition-colors hover:border-brand/40 hover:text-ink disabled:opacity-60" disabled={isPending || isSubmitting} onClick={onCancel} type="button">Cancelar</button>
            <SubmitButton isSubmitting={isPending || isSubmitting}>Confirmar pago</SubmitButton>
          </div>
        </form>
      </section>
    </div>
  )
}

export function InvoiceCancelDialog({
  error,
  invoice,
  isPending,
  onCancel,
  onSubmit,
}: {
  error?: string | null
  invoice: Invoice
  isPending: boolean
  onCancel: () => void
  onSubmit: (values: CancelInvoiceFormValues) => void | Promise<void>
}) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<CancelInvoiceFormValues>({
    defaultValues: { reason: "" },
    mode: "onBlur",
    resolver: zodResolver(cancelInvoiceFormSchema),
    shouldFocusError: true,
  })
  const validationMessages = getFormErrorMessages(errors)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 p-4 sm:items-center" role="presentation">
      <section aria-describedby="cancel-invoice-description" aria-labelledby="cancel-invoice-title" aria-modal="true" className="w-full max-w-lg rounded-[1.35rem] border border-rose/25 bg-panel p-5 shadow-2xl sm:p-6" role="dialog">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-soft text-rose-strong"><XCircle aria-hidden="true" className="h-5 w-5" /></span>
          <div><p className="text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-rose-strong">Acción irreversible</p><h2 className="mt-1.5 font-display text-lg font-semibold tracking-[-0.035em] text-ink" id="cancel-invoice-title">¿Anular esta factura?</h2></div>
        </div>
        <p className="mt-4 text-sm leading-6 text-ink-muted" id="cancel-invoice-description">La factura <strong className="font-semibold text-ink">{invoice.number}</strong> dejará de estar disponible para pago. Confirma solo si corresponde al flujo administrativo.</p>
        <form className="mt-5 space-y-4" noValidate onSubmit={handleSubmit((values) => void onSubmit(values))}>
          <FormErrorSummary messages={validationMessages} />
          {error ? <FormAlert message={error} /> : null}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-ink" htmlFor="invoice-cancel-reason">Razón (opcional)</label>
            <textarea {...register("reason")} aria-describedby={errors.reason ? "invoice-cancel-reason-error" : undefined} aria-invalid={Boolean(errors.reason)} className="min-h-24 w-full resize-y rounded-xl border border-line bg-panel-raised px-3.5 py-3 text-sm leading-6 text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-rose/50 focus:ring-2 focus:ring-rose/10" id="invoice-cancel-reason" placeholder="Describe brevemente el motivo administrativo" rows={3} />
            {errors.reason?.message ? <FieldError id="invoice-cancel-reason-error" message={errors.reason.message} /> : null}
          </div>
          <div className="flex flex-col-reverse gap-2 border-t border-line/70 pt-5 sm:flex-row sm:justify-end">
            <button className="rounded-xl border border-line bg-panel-raised px-4 py-2.5 text-xs font-semibold text-ink-muted transition-colors hover:border-brand/40 hover:text-ink disabled:opacity-60" disabled={isPending || isSubmitting} onClick={onCancel} type="button">Volver</button>
            <button className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-rose-strong px-4 text-sm font-semibold text-white transition-colors hover:bg-rose disabled:cursor-wait disabled:opacity-65" disabled={isPending || isSubmitting} type="submit">
              {isPending || isSubmitting ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : null}
              {isPending || isSubmitting ? "Anulando..." : "Sí, anular factura"}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
