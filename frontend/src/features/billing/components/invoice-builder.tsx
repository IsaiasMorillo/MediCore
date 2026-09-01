import { zodResolver } from "@hookform/resolvers/zod"
import { FilePlus2, Plus, ReceiptText, Search, Trash2 } from "lucide-react"
import { useState, type ReactNode } from "react"
import { useForm, type SubmitHandler, type UseFormRegisterReturn } from "react-hook-form"

import { FieldError, FormAlert, FormErrorSummary, FormSection } from "@/features/auth/components/form-controls"
import { getFormErrorMessages } from "@/features/auth/utils/form-errors"
import {
  invoiceItemFormSchema,
  type InvoiceItemFormValues,
} from "@/features/billing/schemas/billing-schemas"
import type { InvoiceItemInput } from "@/features/billing/types"
import {
  calculateInvoicePreview,
  formatBillingCurrency,
  formatInvoiceItemType,
  normalizeCoverageType,
} from "@/features/billing/utils/billing-formatting"
import type { Patient } from "@/features/patients/types"
import { formatPatientName } from "@/features/patients/utils/patient-formatting"

interface InvoiceBuilderSubmit {
  items: InvoiceItemInput[]
  patientId: string
}

interface InvoiceBuilderProps {
  initialPatientId?: string
  isSubmitting: boolean
  onPatientChange?: (patientId: string) => void
  onSubmit: (value: InvoiceBuilderSubmit) => void | Promise<void>
  patients: readonly Patient[]
  serverError?: string | null
}

export function InvoiceBuilder({
  initialPatientId,
  isSubmitting,
  onPatientChange,
  onSubmit,
  patients,
  serverError,
}: InvoiceBuilderProps) {
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId ?? "")
  const [patientSearch, setPatientSearch] = useState("")
  const [items, setItems] = useState<InvoiceItemInput[]>([])
  const [builderError, setBuilderError] = useState<string | null>(null)
  const selectedPatient = patients.find((patient) => patient.id === selectedPatientId)
  const activePatients = patients.filter((patient) => patient.isActive)
  const normalizedPatientSearch = patientSearch.trim().toLocaleLowerCase("es")
  const matchingPatients = activePatients.filter((patient) => `${formatPatientName(patient)} ${patient.personalData.documentId}`.toLocaleLowerCase("es").includes(normalizedPatientSearch))
  const patientOptions = selectedPatient && !matchingPatients.some((patient) => patient.id === selectedPatient.id) ? [selectedPatient, ...matchingPatients] : matchingPatients
  const preview = calculateInvoicePreview(items, selectedPatient)

  const handlePatientChange = (patientId: string) => {
    setSelectedPatientId(patientId)
    setBuilderError(null)
    onPatientChange?.(patientId)
  }

  const handleAddItem = (value: InvoiceItemFormValues) => {
    setItems((currentItems) => [...currentItems, toInvoiceItemInput(value)])
    setBuilderError(null)
  }

  const handleCreate = () => {
    if (!selectedPatientId) {
      setBuilderError("Selecciona un paciente antes de crear la factura.")
      return
    }

    if (items.length === 0) {
      setBuilderError("Agrega al menos un item antes de crear la factura.")
      return
    }

    setBuilderError(null)
    void onSubmit({ items, patientId: selectedPatientId })
  }

  return (
    <section className="rounded-[1.35rem] border border-line/80 bg-panel p-5 shadow-[0_20px_55px_-38px_var(--ink)] sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-strong">
            <ReceiptText aria-hidden="true" className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-brand-strong">Recepción · Nueva factura</p>
            <h2 className="mt-1.5 font-display text-lg font-semibold tracking-[-0.035em] text-ink">Construir factura</h2>
            <p className="mt-1 text-xs leading-5 text-ink-muted">Agrega los conceptos facturables y revisa la estimación antes de enviarla al servidor.</p>
          </div>
        </div>
      </div>

      {serverError ? <div className="mb-5"><FormAlert message={serverError} /></div> : null}
      {builderError ? <div className="mb-5"><FormAlert message={builderError} /></div> : null}

      <FormSection description="La cobertura se obtiene del seguro registrado en la ficha del paciente." title="Paciente">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-ink" htmlFor="invoice-patient-search">Buscar paciente</label>
            <div className="relative">
              <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
              <input aria-label="Buscar paciente para factura" className="h-11 w-full rounded-xl border border-line bg-panel-raised pl-10 pr-3.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-brand/60 focus:ring-2 focus:ring-brand/10" id="invoice-patient-search" onChange={(event) => setPatientSearch(event.target.value)} placeholder="Nombre o documento" type="search" value={patientSearch} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-ink" htmlFor="invoice-patient">Paciente</label>
            <select aria-describedby={selectedPatientId ? "invoice-patient-hint" : undefined} aria-invalid={Boolean(builderError && !selectedPatientId)} className="h-11 w-full rounded-xl border border-line bg-panel-raised px-3.5 text-sm text-ink outline-none transition-colors focus:border-brand/60 focus:ring-2 focus:ring-brand/10" id="invoice-patient" onChange={(event) => handlePatientChange(event.target.value)} value={selectedPatientId}>
              <option value="">Selecciona un paciente</option>
              {patientOptions.map((patient) => <option key={patient.id} value={patient.id}>{formatPatientName(patient)} · {patient.personalData.documentId}</option>)}
              {patientOptions.length === 0 ? <option disabled value="">No encontramos pacientes activos</option> : null}
            </select>
            {selectedPatient ? <p className="text-[0.68rem] leading-5 text-ink-subtle" id="invoice-patient-hint">Cobertura: <span className="font-semibold text-ink">{formatCoverageLabel(selectedPatient.medicalInsurance?.coverageType)}</span></p> : null}
          </div>
        </div>
      </FormSection>

      <div className="mt-7">
        <InvoiceItemEditor onAdd={handleAddItem} />
      </div>

      <FormSection description="Los importes mostrados aquí son una referencia. El backend devuelve el desglose y total oficiales." title={`Items de la factura (${items.length})`}>
        {items.length > 0 ? <div className="space-y-2">{items.map((item, index) => <InvoiceItemRow index={index} item={item} key={`${item.type}-${item.description}-${index}`} onRemove={() => setItems((currentItems) => currentItems.filter((_, itemIndex) => itemIndex !== index))} />)}</div> : <div className="rounded-2xl border border-dashed border-line bg-canvas/35 px-4 py-7 text-center text-xs text-ink-muted">Todavía no hay items. Usa el formulario anterior para agregar el primer concepto.</div>}
      </FormSection>

      <div className="mt-7 grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex items-start gap-3 rounded-2xl border border-amber/25 bg-amber-soft/65 px-4 py-3.5" role="note">
          <ReceiptText aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-amber-strong" />
          <p className="text-xs leading-5 text-ink">La factura quedará pendiente hasta que recepción registre un pago. El cálculo definitivo pertenece al servidor.</p>
        </div>
        <InvoicePreview coverageType={preview.coverageType} discount={preview.discount} insuranceCoverage={preview.insuranceCoverage} subtotal={preview.subtotal} taxes={preview.taxes} total={preview.total} />
      </div>

      <div className="mt-6 border-t border-line/70 pt-5">
        <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white shadow-[0_12px_24px_-16px_var(--brand)] transition-colors hover:bg-brand-strong disabled:cursor-wait disabled:opacity-65" disabled={isSubmitting} onClick={handleCreate} type="button">
          <FilePlus2 aria-hidden="true" className={isSubmitting ? "h-4 w-4 animate-pulse" : "h-4 w-4"} />
          {isSubmitting ? "Creando factura..." : "Crear factura"}
        </button>
      </div>
    </section>
  )
}

function InvoiceItemEditor({ onAdd }: { onAdd: SubmitHandler<InvoiceItemFormValues> }) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<InvoiceItemFormValues>({
    defaultValues: {
      appointmentId: "",
      description: "",
      laboratoryOrderId: "",
      prescriptionId: "",
      quantity: 1,
      type: "Consulta",
      unitPrice: 0,
    },
    mode: "onBlur",
    resolver: zodResolver(invoiceItemFormSchema),
    shouldFocusError: true,
  })
  const validationMessages = getFormErrorMessages(errors)

  const handleFormSubmit = (values: InvoiceItemFormValues) => {
    onAdd(values)
    reset()
  }

  return (
    <FormSection description="Las referencias son opcionales y permiten enlazar la línea con una cita, una orden de laboratorio o una prescripción." title="Agregar item">
      <form className="space-y-4" noValidate onSubmit={handleSubmit(handleFormSubmit)}>
        <FormErrorSummary messages={validationMessages} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <InvoiceSelect error={errors.type?.message} id="invoice-item-type" label="Tipo" registration={register("type")}>
            <option value="Consulta">Consulta</option>
            <option value="Examen">Examen</option>
            <option value="Medicamento">Medicamento</option>
          </InvoiceSelect>
          <InvoiceInput error={errors.description?.message} id="invoice-item-description" label="Descripción" placeholder="Ej. Consulta general" registration={register("description")} />
          <InvoiceInput error={errors.quantity?.message} id="invoice-item-quantity" label="Cantidad" min="1" registration={register("quantity", { valueAsNumber: true })} step="1" type="number" />
          <InvoiceInput error={errors.unitPrice?.message} id="invoice-item-unit-price" label="Precio unitario" min="0" registration={register("unitPrice", { valueAsNumber: true })} step="0.01" type="number" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <InvoiceInput id="invoice-item-appointment" label="ID de cita (opcional)" placeholder="appointmentId" registration={register("appointmentId")} />
          <InvoiceInput id="invoice-item-laboratory" label="ID de laboratorio (opcional)" placeholder="laboratoryOrderId" registration={register("laboratoryOrderId")} />
          <InvoiceInput id="invoice-item-prescription" label="ID de receta (opcional)" placeholder="prescriptionId" registration={register("prescriptionId")} />
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl border border-line bg-panel-raised px-3.5 py-2.5 text-xs font-semibold text-ink-muted transition-colors hover:border-brand/40 hover:text-ink disabled:cursor-wait disabled:opacity-60" disabled={isSubmitting} type="submit">
          <Plus aria-hidden="true" className="h-3.5 w-3.5" />
          Agregar item
        </button>
      </form>
    </FormSection>
  )
}

function InvoiceItemRow({ index, item, onRemove }: { index: number; item: InvoiceItemInput; onRemove: () => void }) {
  const lineTotal = item.quantity * item.unitPrice

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line/70 bg-canvas/45 p-3.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-brand/20 bg-brand-soft px-2 py-1 text-[0.65rem] font-semibold text-brand-strong">{formatInvoiceItemType(item.type)}</span>
          <span className="text-[0.68rem] text-ink-subtle">Item {index + 1}</span>
        </div>
        <p className="mt-1.5 truncate text-sm font-semibold text-ink">{item.description}</p>
        <p className="mt-1 text-xs text-ink-muted">{item.quantity} × {formatBillingCurrency(item.unitPrice)}</p>
      </div>
      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <span className="text-sm font-semibold text-ink">{formatBillingCurrency(lineTotal)}</span>
        <button aria-label={`Eliminar item ${index + 1}`} className="rounded-lg p-2 text-ink-subtle transition-colors hover:bg-rose-soft hover:text-rose-strong" onClick={onRemove} type="button">
          <Trash2 aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function InvoicePreview({ coverageType, discount, insuranceCoverage, subtotal, taxes, total }: { coverageType: string; discount: number; insuranceCoverage: number; subtotal: number; taxes: number; total: number }) {
  return (
    <aside className="rounded-2xl border border-line/70 bg-canvas/45 p-4" aria-label="Estimación de factura">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-brand-strong">Estimación</p>
      <dl className="mt-3 space-y-2.5 text-xs">
        <PreviewValue label="Subtotal" value={subtotal} />
        <PreviewValue label={`Cobertura · ${formatCoverageLabel(coverageType)}`} value={-insuranceCoverage} />
        <PreviewValue label="Descuento" value={-discount} />
        <PreviewValue label="ITBIS estimado" value={taxes} />
        <div className="flex items-center justify-between gap-3 border-t border-line/70 pt-3 text-sm font-semibold text-ink"><dt>Total estimado</dt><dd>{formatBillingCurrency(total)}</dd></div>
      </dl>
    </aside>
  )
}

function PreviewValue({ label, value }: { label: string; value: number }) {
  return <div className="flex items-center justify-between gap-3"><dt className="text-ink-muted">{label}</dt><dd className="font-medium text-ink">{formatBillingCurrency(value)}</dd></div>
}

function InvoiceInput({ error, id, label, registration, ...inputProps }: { error?: string; id: string; label: string; min?: string; placeholder?: string; registration?: UseFormRegisterReturn; step?: string; type?: string }) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-ink" htmlFor={id}>{label}</label>
      <input {...registration} {...inputProps} aria-describedby={error ? `${id}-error` : undefined} aria-invalid={Boolean(error)} className="h-11 w-full rounded-xl border border-line bg-panel-raised px-3.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-brand/60 focus:ring-2 focus:ring-brand/10" id={id} />
      {error ? <FieldError id={`${id}-error`} message={error} /> : null}
    </div>
  )
}

function InvoiceSelect({ children, error, id, label, registration }: { children: ReactNode; error?: string; id: string; label: string; registration?: UseFormRegisterReturn }) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-ink" htmlFor={id}>{label}</label>
      <select {...registration} aria-describedby={error ? `${id}-error` : undefined} aria-invalid={Boolean(error)} className="h-11 w-full rounded-xl border border-line bg-panel-raised px-3.5 text-sm text-ink outline-none transition-colors focus:border-brand/60 focus:ring-2 focus:ring-brand/10" id={id}>{children}</select>
      {error ? <FieldError id={`${id}-error`} message={error} /> : null}
    </div>
  )
}

function toInvoiceItemInput(value: InvoiceItemFormValues): InvoiceItemInput {
  return {
    appointmentId: value.appointmentId || null,
    description: value.description.trim(),
    laboratoryOrderId: value.laboratoryOrderId || null,
    prescriptionId: value.prescriptionId || null,
    quantity: value.quantity,
    type: value.type,
    unitPrice: value.unitPrice,
  }
}

function formatCoverageLabel(value: string | null | undefined) {
  const coverageType = normalizeCoverageType(value)

  if (coverageType === "Premium") {
    return "Premium"
  }

  if (coverageType === "Basica") {
    return "Básica"
  }

  return "Sin seguro"
}
