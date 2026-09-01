import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarDays, CircleDollarSign, Package, Tag } from "lucide-react"
import { useForm, type SubmitHandler, type UseFormRegisterReturn } from "react-hook-form"

import { FieldError, FormAlert, FormErrorSummary, FormSection, SubmitButton } from "@/features/auth/components/form-controls"
import { getFormErrorMessages } from "@/features/auth/utils/form-errors"
import { medicationFormSchema, type MedicationFormValues } from "@/features/pharmacy/schemas/pharmacy-schemas"

interface MedicationFormProps {
  initialValues?: Partial<MedicationFormValues>
  isEditing?: boolean
  onSubmit: SubmitHandler<MedicationFormValues>
  serverError?: string | null
}

export function MedicationForm({ initialValues, isEditing = false, onSubmit, serverError }: MedicationFormProps) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<MedicationFormValues>({
    defaultValues: {
      category: initialValues?.category ?? "",
      code: initialValues?.code ?? "",
      expirationDate: initialValues?.expirationDate ?? "",
      isActive: initialValues?.isActive ?? true,
      name: initialValues?.name ?? "",
      price: initialValues?.price ?? 0,
      reorderLevel: initialValues?.reorderLevel ?? 10,
      stockQuantity: initialValues?.stockQuantity ?? 0,
    },
    mode: "onBlur",
    resolver: zodResolver(medicationFormSchema),
    shouldFocusError: true,
  })
  const validationMessages = getFormErrorMessages(errors)

  return (
    <form className="space-y-7" noValidate onSubmit={handleSubmit(onSubmit)}>
      <FormErrorSummary messages={validationMessages} />
      {serverError ? <FormAlert message={serverError} /> : null}

      <FormSection description="Usa el nombre y código que identifican el medicamento en el inventario operativo." title="Identificación">
        <div className="grid gap-4 sm:grid-cols-2">
          <PharmacyInput error={errors.name?.message} id="medication-name" label="Nombre" placeholder="Ej. Metformina 850 mg" registration={register("name")} />
          <PharmacyInput error={errors.code?.message} hint="El backend normaliza el código a mayúsculas." id="medication-code" label="Código" placeholder="Ej. MET-850" registration={register("code")} />
          <PharmacyInput error={errors.category?.message} id="medication-category" label="Categoría" placeholder="Ej. Antidiabéticos" registration={register("category")} />
        </div>
      </FormSection>

      <FormSection description="Define el precio y los umbrales que ayudan a detectar reposición a tiempo." title="Control de inventario">
        <div className="grid gap-4 sm:grid-cols-2">
          <PharmacyInput error={errors.stockQuantity?.message} hint={isEditing ? "El stock se modifica desde Ajustar stock para conservar el delta." : "Unidades disponibles al registrar el medicamento."} id="medication-stock" label="Stock inicial" min="0" readOnly={isEditing} registration={register("stockQuantity", { valueAsNumber: true })} step="1" type="number" />
          <PharmacyInput error={errors.reorderLevel?.message} hint="Se considera stock bajo cuando llega a este nivel o menos." id="medication-reorder-level" label="Nivel de reposición" min="0" registration={register("reorderLevel", { valueAsNumber: true })} step="1" type="number" />
          <PharmacyInput error={errors.price?.message} id="medication-price" label="Precio unitario" min="0" registration={register("price", { valueAsNumber: true })} step="0.01" type="number" />
          <PharmacyInput error={errors.expirationDate?.message} hint="Opcional. Se muestra en zona operativa UTC." id="medication-expiration" label="Fecha de expiración" registration={register("expirationDate")} type="date" />
        </div>
        {isEditing ? <p className="rounded-xl border border-brand/20 bg-brand-soft/55 px-3.5 py-3 text-xs leading-5 text-ink-muted">El stock actual se conserva en esta edición. Para entradas o salidas usa el ajuste con delta y su confirmación explícita.</p> : null}
      </FormSection>

      {isEditing ? (
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line/80 bg-canvas/45 px-4 py-3">
          <input {...register("isActive")} className="mt-0.5 h-4 w-4 accent-[var(--brand)]" type="checkbox" />
          <span><span className="block text-xs font-semibold text-ink">Medicamento activo</span><span className="mt-1 block text-xs leading-5 text-ink-muted">Los medicamentos inactivos no deberían seleccionarse para nuevas recetas.</span></span>
        </label>
      ) : null}

      <div className="border-t border-line/70 pt-5">
        <SubmitButton isSubmitting={isSubmitting}>{isEditing ? "Guardar cambios" : "Registrar medicamento"}</SubmitButton>
      </div>
    </form>
  )
}

function PharmacyInput({ error, hint, id, label, registration, ...inputProps }: {
  error?: string
  hint?: string
  id: string
  label: string
  min?: string
  placeholder?: string
  readOnly?: boolean
  registration?: UseFormRegisterReturn
  step?: string
  type?: string
}) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-ink" htmlFor={id}>{label}</label>
      <input
        {...registration}
        {...inputProps}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        aria-invalid={Boolean(error)}
        className="h-11 w-full rounded-xl border border-line bg-panel-raised px-3.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-brand/60 focus:ring-2 focus:ring-brand/10 read-only:cursor-not-allowed read-only:bg-canvas/60"
        id={id}
      />
      {hint && !error ? <p className="text-[0.68rem] leading-5 text-ink-subtle" id={`${id}-hint`}>{hint}</p> : null}
      {error ? <FieldError id={`${id}-error`} message={error} /> : null}
    </div>
  )
}

export function MedicationFormGuidance({ isEditing }: { isEditing: boolean }) {
  return (
    <aside className="h-fit rounded-[1.35rem] border border-line/80 bg-ink p-5 text-white shadow-[0_20px_55px_-38px_var(--ink)] sm:p-6">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-brand-soft"><Package aria-hidden="true" className="h-5 w-5" /></span>
      <p className="mt-5 text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-brand-soft">Inventario operativo</p>
      <h2 className="mt-1.5 font-display text-lg font-semibold tracking-[-0.035em]">{isEditing ? "Actualiza con cuidado" : "Registra una referencia clara"}</h2>
      <ul className="mt-4 space-y-3 text-xs leading-5 text-white/65">
        <li className="flex gap-2.5"><Tag aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-soft" />Mantén el código único y consistente con el inventario institucional.</li>
        <li className="flex gap-2.5"><CircleDollarSign aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-soft" />El precio se muestra en pesos dominicanos y acepta centavos.</li>
        <li className="flex gap-2.5"><CalendarDays aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-soft" />La fecha de expiración es opcional y se muestra en UTC.</li>
      </ul>
      {isEditing ? <p className="mt-5 border-t border-white/10 pt-4 text-[0.68rem] leading-5 text-white/50">Las entradas y salidas de stock tienen un flujo separado para no reemplazar cantidades por accidente.</p> : null}
    </aside>
  )
}
