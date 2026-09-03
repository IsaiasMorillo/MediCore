import { AlertCircle, Plus, Trash2 } from "lucide-react"
import { useState, type InputHTMLAttributes, type ReactNode } from "react"
import type { UseFormRegisterReturn } from "react-hook-form"

import { cn } from "@/lib/utils"

export function FormField({ children, description, error, id, label, required = false }: { children: ReactNode; description?: string; error?: string; id: string; label: string; required?: boolean }) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-ink" htmlFor={id}>{label}{required ? <span aria-hidden="true" className="ml-1 text-rose-strong">*</span> : null}</label>
      {children}
      {description && !error ? <p className="text-[0.68rem] leading-5 text-ink-subtle" id={`${id}-description`}>{description}</p> : null}
      {error ? <FieldError id={`${id}-error`} message={error} /> : null}
    </div>
  )
}

export function FieldError({ id, message }: { id: string; message: string }) {
  return <p className="flex items-start gap-1.5 text-[0.68rem] leading-5 text-rose-strong" id={id}><AlertCircle aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{message}</span></p>
}

export function FormErrorSummary({ messages }: { messages: readonly string[] }) {
  if (messages.length === 0) {
    return null
  }

  return <div aria-live="assertive" className="rounded-xl border border-rose/20 bg-rose-soft/60 px-4 py-3" role="alert"><p className="text-xs font-semibold text-ink">Revisa los datos del formulario</p><ul className="mt-1 space-y-0.5 text-xs text-ink-muted">{messages.map((message, index) => <li key={`${message}-${index}`}>{message}</li>)}</ul></div>
}

export function FormSection({ children, description, title }: { children: ReactNode; description?: string; title: string }) {
  return <section className="space-y-4 border-t border-line/70 pt-5 first:border-t-0 first:pt-0"><div><h2 className="text-sm font-semibold text-ink">{title}</h2>{description ? <p className="mt-1 text-xs leading-5 text-ink-muted">{description}</p> : null}</div>{children}</section>
}

type BasicInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "type"> & {
  id: string
  label: string
  error?: string
  hint?: string
  registration?: UseFormRegisterReturn
}

export function DateField({ error, hint, id, label, registration, ...inputProps }: BasicInputProps) {
  return <FormField description={hint} error={error} id={id} label={label}><input {...registration} {...inputProps} aria-describedby={error ? `${id}-error` : hint ? `${id}-description` : undefined} aria-invalid={Boolean(error)} className={fieldClassName(error)} id={id} type="date" /></FormField>
}

export function TimeField({ error, hint, id, label, registration, ...inputProps }: BasicInputProps) {
  return <FormField description={hint} error={error} id={id} label={label}><input {...registration} {...inputProps} aria-describedby={error ? `${id}-error` : hint ? `${id}-description` : undefined} aria-invalid={Boolean(error)} className={fieldClassName(error)} id={id} type="time" /></FormField>
}

export function CurrencyField({ currency = "DOP", error, hint, id, label, registration, ...inputProps }: BasicInputProps & { currency?: string }) {
  return <FormField description={hint} error={error} id={id} label={label}><div className="relative"><span aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-ink-subtle">{currency}</span><input {...registration} {...inputProps} aria-describedby={error ? `${id}-error` : hint ? `${id}-description` : undefined} aria-invalid={Boolean(error)} className={cn(fieldClassName(error), "pl-14")} id={id} inputMode="decimal" min="0" step="0.01" type="number" /></div></FormField>
}

export function TagListField({ addLabel = "Añadir etiqueta", error, hint, id, label, onChange, placeholder = "Escribe una etiqueta", value }: { addLabel?: string; error?: string; hint?: string; id: string; label: string; onChange: (value: string[]) => void; placeholder?: string; value: readonly string[] }) {
  const [draft, setDraft] = useState("")

  const addTag = () => {
    const nextTag = draft.trim()

    if (!nextTag || value.some((tag) => tag.toLocaleLowerCase("es") === nextTag.toLocaleLowerCase("es"))) {
      return
    }

    onChange([...value, nextTag])
    setDraft("")
  }

  return (
    <FormField description={hint} error={error} id={id} label={label}>
      <div className="flex gap-2">
        <input aria-describedby={error ? `${id}-error` : hint ? `${id}-description` : undefined} aria-invalid={Boolean(error)} className={cn(fieldClassName(error), "min-w-0 flex-1")} id={id} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addTag() } }} placeholder={placeholder} type="text" value={draft} />
        <button aria-label={addLabel} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-panel-raised text-brand-strong transition-colors hover:border-brand/40 hover:bg-brand-soft" onClick={addTag} type="button"><Plus aria-hidden="true" className="h-4 w-4" /></button>
      </div>
      {value.length > 0 ? <ul aria-label={`${label} seleccionadas`} className="flex flex-wrap gap-2">{value.map((tag) => <li className="inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand-strong" key={tag}>{tag}<button aria-label={`Eliminar etiqueta ${tag}`} className="rounded-full p-0.5 transition-colors hover:bg-brand/15" onClick={() => onChange(value.filter((currentTag) => currentTag !== tag))} type="button"><Trash2 aria-hidden="true" className="h-3 w-3" /></button></li>)}</ul> : null}
    </FormField>
  )
}

export function DynamicKeyValueField({ addLabel = "Añadir valor", error, hint, id, label, onChange, value }: { addLabel?: string; error?: string; hint?: string; id: string; label: string; onChange: (value: Record<string, string>) => void; value: Readonly<Record<string, string>> }) {
  const [draftKey, setDraftKey] = useState("")
  const [draftValue, setDraftValue] = useState("")
  const entries = Object.entries(value)

  const addEntry = () => {
    const key = draftKey.trim()

    if (!key) {
      return
    }

    onChange({ ...value, [key]: draftValue.trim() })
    setDraftKey("")
    setDraftValue("")
  }

  return (
    <FormField description={hint} error={error} id={id} label={label}>
      <div className="space-y-3">
        {entries.map(([key, entryValue]) => <div className="grid gap-2 sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)_auto]" key={key}><input aria-label={`Clave ${key}`} className={fieldClassName()} onChange={(event) => { const nextValue = { ...value }; delete nextValue[key]; nextValue[event.target.value] = entryValue; onChange(nextValue) }} value={key} /><input aria-label={`Valor ${key}`} className={fieldClassName()} onChange={(event) => onChange({ ...value, [key]: event.target.value })} value={entryValue} /><button aria-label={`Eliminar ${key}`} className="flex h-11 w-11 items-center justify-center rounded-xl border border-rose/20 bg-rose-soft/50 text-rose-strong transition-colors hover:border-rose/40" onClick={() => { const nextValue = { ...value }; delete nextValue[key]; onChange(nextValue) }} type="button"><Trash2 aria-hidden="true" className="h-4 w-4" /></button></div>)}
        <div className="grid gap-2 rounded-2xl border border-dashed border-line bg-canvas/35 p-3 sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)_auto] sm:items-end"><label className="space-y-1.5"><span className="block text-[0.68rem] font-semibold text-ink-muted">Clave</span><input aria-label={`${label}: nueva clave`} className={fieldClassName()} onChange={(event) => setDraftKey(event.target.value)} placeholder="Ej. alergia" value={draftKey} /></label><label className="space-y-1.5"><span className="block text-[0.68rem] font-semibold text-ink-muted">Valor</span><input aria-label={`${label}: nuevo valor`} className={fieldClassName()} onChange={(event) => setDraftValue(event.target.value)} placeholder="Ej. penicilina" value={draftValue} /></label><button className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand px-3.5 text-xs font-semibold text-white transition-colors hover:bg-brand-strong" onClick={addEntry} type="button"><Plus aria-hidden="true" className="h-3.5 w-3.5" />{addLabel}</button></div>
      </div>
    </FormField>
  )
}

function fieldClassName(error?: string) {
  return cn("h-11 w-full rounded-xl border bg-panel-raised px-3.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-brand/60 focus:ring-2 focus:ring-brand/10", error ? "border-rose/60" : "border-line")
}
