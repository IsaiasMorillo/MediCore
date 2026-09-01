import { Plus, Trash2 } from "lucide-react"
import { useState, type FormEvent } from "react"
import { useForm, type SubmitHandler } from "react-hook-form"

import { FormAlert, FormErrorSummary, SubmitButton } from "@/features/auth/components/form-controls"
import type { LaboratoryResultField } from "@/features/laboratory/utils/laboratory-result-templates"

interface LaboratoryResultsFormProps {
  fields: readonly LaboratoryResultField[]
  onSubmit: (results: Record<string, unknown>) => Promise<void>
  serverError?: string | null
}

type LaboratoryResultFormValues = Record<string, string>

interface ManualResultRow {
  id: number
  key: string
  value: string
}

export function LaboratoryResultsForm({ fields, onSubmit, serverError }: LaboratoryResultsFormProps) {
  const defaultValues = Object.fromEntries(fields.map((field) => [field.key, ""]))
  const { formState: { isSubmitting }, handleSubmit, register } = useForm<LaboratoryResultFormValues>({ defaultValues })
  const [manualRows, setManualRows] = useState<ManualResultRow[]>([{ id: 1, key: "", value: "" }])
  const [resultError, setResultError] = useState<string | null>(null)
  const [nextRowId, setNextRowId] = useState(2)

  const handleTypedSubmit: SubmitHandler<LaboratoryResultFormValues> = async (values) => {
    const results: Record<string, unknown> = {}
    let hasInvalidNumber = false

    for (const field of fields) {
      const value = values[field.key]?.trim() ?? ""

      if (!value) {
        continue
      }

      if (field.kind === "number") {
        const numericValue = Number(value)

        if (!Number.isFinite(numericValue)) {
          hasInvalidNumber = true
          continue
        }

        results[field.key] = numericValue
      } else if (field.kind === "boolean") {
        results[field.key] = value === "true"
      } else {
        results[field.key] = value
      }
    }

    if (hasInvalidNumber) {
      setResultError("Revisa los valores numéricos antes de guardar.")
      return
    }

    await submitResults(results)
  }

  const handleManualSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const results: Record<string, unknown> = {}
    let hasDuplicateKey = false

    for (const row of manualRows) {
      const key = row.key.trim()
      const value = row.value.trim()

      if (!key && !value) {
        continue
      }

      if (!key || !value) {
        setResultError("Completa la clave y el valor de cada resultado, o elimina la fila vacía.")
        return
      }

      if (key in results) {
        hasDuplicateKey = true
        continue
      }

      results[key] = value
    }

    if (hasDuplicateKey) {
      setResultError("Cada resultado debe tener una clave única.")
      return
    }

    await submitResults(results)
  }

  async function submitResults(results: Record<string, unknown>) {
    if (Object.keys(results).length === 0) {
      setResultError("Ingresa al menos un resultado antes de guardar.")
      return
    }

    setResultError(null)
    try {
      await onSubmit(results)
    } catch {
      // The parent mutation owns the server error state.
    }
  }

  if (fields.length === 0) {
    return (
      <form className="space-y-5" noValidate onSubmit={handleManualSubmit}>
        {resultError ? <FormAlert message={resultError} /> : null}
        {serverError ? <FormAlert message={serverError} /> : null}
        <p className="text-xs leading-5 text-ink-muted">Este tipo de prueba no tiene una plantilla conocida en MediCore. Añade los resultados como pares de clave y valor estructurados.</p>
        <div className="space-y-3">
          {manualRows.map((row, index) => (
            <div className="grid gap-2 sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)_auto]" key={row.id}>
              <label className="sr-only" htmlFor={`laboratory-result-key-${row.id}`}>Clave del resultado {index + 1}</label>
              <input className="h-11 rounded-xl border border-line bg-panel-raised px-3.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-brand/60 focus:ring-2 focus:ring-brand/10" id={`laboratory-result-key-${row.id}`} onChange={(event) => updateManualRow(row.id, "key", event.target.value)} placeholder="Clave" value={row.key} />
              <label className="sr-only" htmlFor={`laboratory-result-value-${row.id}`}>Valor del resultado {index + 1}</label>
              <input className="h-11 rounded-xl border border-line bg-panel-raised px-3.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-brand/60 focus:ring-2 focus:ring-brand/10" id={`laboratory-result-value-${row.id}`} onChange={(event) => updateManualRow(row.id, "value", event.target.value)} placeholder="Valor" value={row.value} />
              <button aria-label={`Eliminar resultado ${index + 1}`} className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line text-ink-muted transition-colors hover:border-rose/40 hover:bg-rose-soft hover:text-rose-strong disabled:cursor-not-allowed disabled:opacity-40" disabled={manualRows.length === 1} onClick={() => setManualRows((rows) => rows.filter((candidate) => candidate.id !== row.id))} type="button"><Trash2 aria-hidden="true" className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl border border-line px-3.5 py-2.5 text-xs font-semibold text-ink-muted transition-colors hover:border-brand/40 hover:text-ink" onClick={() => { setManualRows((rows) => [...rows, { id: nextRowId, key: "", value: "" }]); setNextRowId((id) => id + 1) }} type="button"><Plus aria-hidden="true" className="h-3.5 w-3.5" />Añadir resultado</button>
        <SubmitButton isSubmitting={isSubmitting}>Guardar resultados</SubmitButton>
      </form>
    )
  }

  return (
    <form className="space-y-6" noValidate onSubmit={handleSubmit(handleTypedSubmit)}>
      <FormErrorSummary messages={resultError ? [resultError] : []} />
      {serverError ? <FormAlert message={serverError} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <ResultFieldInput field={field} key={field.key} register={register} />
        ))}
      </div>
      <SubmitButton isSubmitting={isSubmitting}>Guardar resultados</SubmitButton>
    </form>
  )

  function updateManualRow(id: number, property: "key" | "value", value: string) {
    setManualRows((rows) => rows.map((row) => row.id === id ? { ...row, [property]: value } : row))
  }
}

function ResultFieldInput({ field, register }: { field: LaboratoryResultField; register: ReturnType<typeof useForm<LaboratoryResultFormValues>>["register"] }) {
  if (field.kind === "boolean") {
    return (
      <div className="space-y-2 sm:col-span-2">
        <label className="block text-xs font-semibold text-ink" htmlFor={`laboratory-result-${field.key}`}>{field.label}</label>
        <select {...register(field.key)} className="h-11 w-full rounded-xl border border-line bg-panel-raised px-3.5 text-sm text-ink outline-none transition-colors focus:border-brand/60 focus:ring-2 focus:ring-brand/10" id={`laboratory-result-${field.key}`}>
          <option value="">Selecciona una opción</option>
          <option value="true">Sí</option>
          <option value="false">No</option>
        </select>
      </div>
    )
  }

  return (
    <div className={field.kind === "text" ? "space-y-2 sm:col-span-2" : "space-y-2"}>
      <label className="block text-xs font-semibold text-ink" htmlFor={`laboratory-result-${field.key}`}>{field.label}</label>
      {field.kind === "text" ? (
        <textarea {...register(field.key)} className="min-h-24 w-full resize-y rounded-xl border border-line bg-panel-raised px-3.5 py-3 text-sm leading-6 text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-brand/60 focus:ring-2 focus:ring-brand/10" id={`laboratory-result-${field.key}`} placeholder="Ingresa el resultado" rows={3} />
      ) : (
        <input {...register(field.key)} className="h-11 w-full rounded-xl border border-line bg-panel-raised px-3.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-brand/60 focus:ring-2 focus:ring-brand/10" id={`laboratory-result-${field.key}`} inputMode="decimal" placeholder="Valor numérico" type="number" />
      )}
      {field.kind === "number" ? <p className="text-[0.68rem] text-ink-subtle">Valor numérico sin rango de referencia automático.</p> : null}
    </div>
  )
}
