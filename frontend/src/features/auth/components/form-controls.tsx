import { AlertCircle, CheckCircle2, Eye, EyeOff, LoaderCircle } from "lucide-react"
import { useState, type InputHTMLAttributes } from "react"
import type { UseFormRegisterReturn } from "react-hook-form"

import { FieldError, FormErrorSummary, FormSection } from "@/components/ui/form-fields"
import { cn } from "@/lib/utils"

export { FieldError, FormErrorSummary, FormSection }

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  id: string
  label: string
  error?: string
  hint?: string
  registration?: UseFormRegisterReturn
}

export function TextField({
  id,
  label,
  error,
  hint,
  registration,
  className,
  ...inputProps
}: TextFieldProps) {
  const descriptionId = error ? `${id}-error` : hint ? `${id}-hint` : undefined

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-ink" htmlFor={id}>
        {label}
      </label>
      <input
        {...registration}
        {...inputProps}
        aria-describedby={descriptionId}
        aria-invalid={Boolean(error)}
        className={cn(
          "h-11 w-full rounded-xl border bg-panel-raised px-3.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-brand/60 focus:ring-2 focus:ring-brand/10",
          error ? "border-rose/60" : "border-line",
          className
        )}
        id={id}
      />
      {hint && !error ? <p className="text-[0.68rem] leading-5 text-ink-subtle" id={`${id}-hint`}>{hint}</p> : null}
      {error ? <FieldError id={`${id}-error`} message={error} /> : null}
    </div>
  )
}

export function PasswordField({
  id,
  label,
  error,
  hint,
  registration,
  autoComplete,
}: {
  id: string
  label: string
  error?: string
  hint?: string
  registration?: UseFormRegisterReturn
  autoComplete?: string
}) {
  const [visible, setVisible] = useState(false)
  const descriptionId = error ? `${id}-error` : hint ? `${id}-hint` : undefined

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-ink" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <input
          {...registration}
          aria-describedby={descriptionId}
          aria-invalid={Boolean(error)}
          autoComplete={autoComplete}
          className={cn(
            "h-11 w-full rounded-xl border bg-panel-raised px-3.5 pr-11 text-sm text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-brand/60 focus:ring-2 focus:ring-brand/10",
            error ? "border-rose/60" : "border-line"
          )}
          id={id}
          type={visible ? "text" : "password"}
        />
        <button
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={visible}
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-ink-subtle transition-colors hover:bg-canvas hover:text-ink focus-visible:outline-none"
          onClick={() => setVisible((current) => !current)}
          type="button"
        >
          {visible ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}
        </button>
      </div>
      {hint && !error ? <p className="text-[0.68rem] leading-5 text-ink-subtle" id={`${id}-hint`}>{hint}</p> : null}
      {error ? <FieldError id={`${id}-error`} message={error} /> : null}
    </div>
  )
}

export function FormAlert({ message }: { message: string }) {
  return (
    <div aria-live="assertive" className="flex items-start gap-2.5 rounded-xl border border-rose/20 bg-rose-soft/60 px-4 py-3" role="alert">
      <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-rose-strong" />
      <p className="text-xs leading-5 text-ink">{message}</p>
    </div>
  )
}

export function SuccessAlert({ message }: { message: string }) {
  return (
    <div aria-live="polite" className="flex items-start gap-2.5 rounded-xl border border-brand/20 bg-brand-soft/70 px-4 py-3" role="status">
      <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-brand-strong" />
      <p className="text-xs leading-5 text-ink">{message}</p>
    </div>
  )
}

export function SubmitButton({
  children,
  isSubmitting,
}: {
  children: string
  isSubmitting: boolean
}) {
  return (
    <button
      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white shadow-[0_12px_24px_-16px_var(--brand)] transition-colors hover:bg-brand-strong focus-visible:outline-none disabled:cursor-wait disabled:opacity-65"
      disabled={isSubmitting}
      type="submit"
    >
      {isSubmitting ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : null}
      {isSubmitting ? "Procesando..." : children}
    </button>
  )
}

export function FormDivider({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-3 py-1 text-[0.68rem] font-medium uppercase tracking-[0.12em] text-ink-subtle">
      <span className="h-px flex-1 bg-line" />
      <span>{children}</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  )
}
