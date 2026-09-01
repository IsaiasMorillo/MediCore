import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowDownToLine, ArrowUpFromLine, PackageCheck } from "lucide-react"
import { useForm, useWatch, type SubmitHandler } from "react-hook-form"

import { FieldError, FormAlert, FormErrorSummary, SubmitButton } from "@/features/auth/components/form-controls"
import { getFormErrorMessages } from "@/features/auth/utils/form-errors"
import type { Medication } from "@/features/pharmacy/types"
import { stockAdjustmentFormSchema, type StockAdjustmentFormValues } from "@/features/pharmacy/schemas/pharmacy-schemas"

interface StockAdjustmentFormProps {
  medication: Medication
  onCancel: () => void
  onSubmit: SubmitHandler<StockAdjustmentFormValues>
  serverError?: string | null
}

export function StockAdjustmentForm({ medication, onCancel, onSubmit, serverError }: StockAdjustmentFormProps) {
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
  } = useForm<StockAdjustmentFormValues>({
    defaultValues: {
      confirmed: false,
      direction: "entrada",
      quantity: 1,
    },
    mode: "onBlur",
    resolver: zodResolver(stockAdjustmentFormSchema),
    shouldFocusError: true,
  })
  const direction = useWatch({ control, name: "direction" }) ?? "entrada"
  const quantity = useWatch({ control, name: "quantity" })
  const numericQuantity = typeof quantity === "number" && Number.isFinite(quantity) ? quantity : 0
  const nextStock = direction === "entrada" ? medication.stockQuantity + numericQuantity : medication.stockQuantity - numericQuantity
  const validationMessages = getFormErrorMessages(errors)
  const handleValidSubmit: SubmitHandler<StockAdjustmentFormValues> = (values) => {
    if (values.direction === "salida" && values.quantity > medication.stockQuantity) {
      setError("quantity", { message: "La salida no puede superar el stock actual.", type: "validate" })
      return
    }

    return onSubmit(values)
  }

  return (
    <form className="space-y-5" noValidate onSubmit={handleSubmit(handleValidSubmit)}>
      <FormErrorSummary messages={validationMessages} />
      {serverError ? <FormAlert message={serverError} /> : null}

      <fieldset className="space-y-2">
        <legend className="text-xs font-semibold text-ink">Tipo de movimiento</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 transition-colors ${direction === "entrada" ? "border-brand/50 bg-brand-soft/60" : "border-line bg-panel-raised hover:border-brand/30"}`}>
            <input {...register("direction")} className="h-4 w-4 accent-[var(--brand)]" type="radio" value="entrada" />
            <span><span className="flex items-center gap-1.5 text-xs font-semibold text-ink"><ArrowDownToLine aria-hidden="true" className="h-3.5 w-3.5 text-brand-strong" />Entrada</span><span className="mt-0.5 block text-[0.68rem] text-ink-muted">Suma unidades disponibles</span></span>
          </label>
          <label className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 transition-colors ${direction === "salida" ? "border-amber/50 bg-amber-soft/60" : "border-line bg-panel-raised hover:border-brand/30"}`}>
            <input {...register("direction")} className="h-4 w-4 accent-[var(--brand)]" type="radio" value="salida" />
            <span><span className="flex items-center gap-1.5 text-xs font-semibold text-ink"><ArrowUpFromLine aria-hidden="true" className="h-3.5 w-3.5 text-amber-strong" />Salida</span><span className="mt-0.5 block text-[0.68rem] text-ink-muted">Resta unidades disponibles</span></span>
          </label>
        </div>
        {errors.direction?.message ? <FieldError id="stock-direction-error" message={errors.direction.message} /> : null}
      </fieldset>

      <div className="space-y-2">
        <label className="block text-xs font-semibold text-ink" htmlFor="stock-adjustment-quantity">Cantidad de unidades</label>
        <input
          {...register("quantity", { valueAsNumber: true })}
          aria-describedby={errors.quantity ? "stock-adjustment-quantity-error" : undefined}
          aria-invalid={Boolean(errors.quantity)}
          className="h-11 w-full rounded-xl border border-line bg-panel-raised px-3.5 text-sm text-ink outline-none transition-colors focus:border-brand/60 focus:ring-2 focus:ring-brand/10"
          id="stock-adjustment-quantity"
          min="1"
          step="1"
          type="number"
        />
        {errors.quantity?.message ? <FieldError id="stock-adjustment-quantity-error" message={errors.quantity.message} /> : null}
      </div>

      <div className={`rounded-2xl border px-4 py-3.5 ${nextStock < 0 ? "border-rose/25 bg-rose-soft/60" : "border-brand/20 bg-brand-soft/55"}`}>
        <div className="flex items-center justify-between gap-3 text-xs"><span className="flex items-center gap-2 font-medium text-ink-muted"><PackageCheck aria-hidden="true" className="h-4 w-4 text-brand-strong" />Nuevo stock estimado</span><strong className="text-sm text-ink">{nextStock >= 0 ? `${nextStock} unidades` : "No puede ser negativo"}</strong></div>
        <p className="mt-1 text-[0.68rem] leading-5 text-ink-subtle">Stock actual: {medication.stockQuantity} unidades. La API recibe el delta positivo o negativo.</p>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line/80 bg-canvas/45 px-3.5 py-3">
        <input {...register("confirmed")} className="mt-0.5 h-4 w-4 accent-[var(--brand)]" type="checkbox" />
        <span className="text-xs leading-5 text-ink-muted">Confirmo que revisé el tipo de movimiento y la cantidad antes de actualizar el inventario.</span>
      </label>
      {errors.confirmed?.message ? <FieldError id="stock-adjustment-confirmed-error" message={errors.confirmed.message} /> : null}

      <div className="flex flex-col-reverse gap-2 border-t border-line/70 pt-5 sm:flex-row sm:justify-end">
        <button className="rounded-xl border border-line bg-panel-raised px-4 py-2.5 text-xs font-semibold text-ink-muted transition-colors hover:border-brand/40 hover:text-ink" onClick={onCancel} type="button">Cancelar</button>
        <div className="sm:min-w-44"><SubmitButton isSubmitting={isSubmitting}>Confirmar ajuste</SubmitButton></div>
      </div>
    </form>
  )
}
