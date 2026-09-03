import { CalendarClock, Check, ChevronDown, CircleCheck, CircleX, Search, Stethoscope, UserRound, X } from "lucide-react"
import { useEffect, useRef, useState, type ReactNode } from "react"

import { DetailList, FormField, StatusBadge } from "@/components/ui"
import type { Doctor } from "@/features/doctors/types"
import { formatDoctorName } from "@/features/doctors/utils/doctor-formatting"
import type { Patient } from "@/features/patients/types"
import { formatPatientContact, formatPatientDate, formatPatientName } from "@/features/patients/utils/patient-formatting"
import type { VitalSigns } from "@/features/medical-records/types"
import { formatVitalSign } from "@/features/medical-records/utils/medical-record-formatting"

interface SearchOption {
  id: string
  label: string
  detail: string
}

interface EntitySearchComboboxProps {
  id: string
  label: string
  options: readonly SearchOption[]
  value: string
  onChange: (value: string) => void
  error?: string
  hint?: string
  placeholder?: string
}

export function PatientSearchCombobox({ error, hint, id = "patient-search", includeInactive = false, label = "Paciente", onChange, patients, placeholder = "Buscar por nombre o documento", value }: { error?: string; hint?: string; id?: string; includeInactive?: boolean; label?: string; onChange: (value: string) => void; patients: readonly Patient[]; placeholder?: string; value: string }) {
  const selectedPatient = patients.find((patient) => patient.id === value)
  const options = patients.filter((patient) => includeInactive || patient.isActive || patient.id === value).map((patient) => ({ detail: patient.personalData.documentId, id: patient.id, label: formatPatientName(patient) }))

  return <EntitySearchCombobox error={error} hint={hint} id={id} label={label} onChange={onChange} options={options} placeholder={placeholder} value={selectedPatient?.id ?? value} />
}

export function DoctorSearchCombobox({ doctors, error, hint, id = "doctor-search", includeInactive = false, label = "Médico", onChange, placeholder = "Buscar por nombre o especialidad", value }: { doctors: readonly Doctor[]; error?: string; hint?: string; id?: string; includeInactive?: boolean; label?: string; onChange: (value: string) => void; placeholder?: string; value: string }) {
  const selectedDoctor = doctors.find((doctor) => doctor.id === value)
  const options = doctors.filter((doctor) => includeInactive || doctor.isActive || doctor.id === value).map((doctor) => ({ detail: doctor.specialty, id: doctor.id, label: formatDoctorName(doctor) }))

  return <EntitySearchCombobox error={error} hint={hint} id={id} label={label} onChange={onChange} options={options} placeholder={placeholder} value={selectedDoctor?.id ?? value} />
}

function EntitySearchCombobox({ error, hint, id, label, onChange, options, placeholder, value }: EntitySearchComboboxProps) {
  const listboxId = `${id}-options`
  const containerRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [activeIndex, setActiveIndex] = useState(0)
  const selected = options.find((option) => option.id === value)

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
        setQuery(selected?.label ?? "")
      }
    }

    document.addEventListener("pointerdown", handlePointerDown)
    return () => document.removeEventListener("pointerdown", handlePointerDown)
  }, [selected?.label])

  const normalizedQuery = query.trim().toLocaleLowerCase("es")
  const filteredOptions = options.filter((option) => `${option.label} ${option.detail}`.toLocaleLowerCase("es").includes(normalizedQuery))
  const safeActiveIndex = Math.min(activeIndex, Math.max(filteredOptions.length - 1, 0))

  const selectOption = (option: SearchOption) => {
    onChange(option.id)
    setQuery(option.label)
    setOpen(false)
    setActiveIndex(0)
  }

  const clearSelection = () => {
    onChange("")
    setQuery("")
    setOpen(false)
    inputRef.current?.focus()
  }

  return (
    <FormField description={hint} error={error} id={id} label={label}>
      <div className="relative" ref={containerRef}>
        <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
        <input
          aria-activedescendant={open && filteredOptions[safeActiveIndex] ? `${listboxId}-${filteredOptions[safeActiveIndex].id}` : undefined}
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-description` : undefined}
          aria-expanded={open}
          aria-invalid={Boolean(error)}
          aria-label={label}
          className="h-11 w-full rounded-xl border border-line bg-panel-raised pl-10 pr-16 text-sm text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-brand/60 focus:ring-2 focus:ring-brand/10"
          id={id}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
            setActiveIndex(0)
            if (value) {
              onChange("")
            }
          }}
           onFocus={() => {
             setQuery(selected?.label ?? "")
             setOpen(true)
           }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault()
              setOpen(true)
              setActiveIndex((index) => Math.min(index + 1, Math.max(filteredOptions.length - 1, 0)))
            } else if (event.key === "ArrowUp") {
              event.preventDefault()
              setActiveIndex((index) => Math.max(index - 1, 0))
            } else if (event.key === "Enter" && open && filteredOptions[safeActiveIndex]) {
              event.preventDefault()
              selectOption(filteredOptions[safeActiveIndex])
            } else if (event.key === "Escape") {
              setOpen(false)
              setQuery(selected?.label ?? "")
            }
          }}
          placeholder={placeholder}
          ref={inputRef}
          role="combobox"
          type="search"
           value={open ? query : selected?.label ?? ""}
        />
        {query ? <button aria-label={`Limpiar ${label.toLocaleLowerCase("es")}`} className="absolute right-8 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-ink-subtle hover:bg-canvas hover:text-ink" onClick={clearSelection} type="button"><X aria-hidden="true" className="h-3.5 w-3.5" /></button> : null}
        <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
        {open ? <ul aria-label={`Opciones de ${label.toLocaleLowerCase("es")}`} className="absolute inset-x-0 top-[calc(100%+0.4rem)] z-40 max-h-64 overflow-y-auto rounded-2xl border border-line/80 bg-panel-raised p-1.5 shadow-[0_20px_45px_-24px_var(--ink)]" id={listboxId} role="listbox">
          {filteredOptions.length > 0 ? filteredOptions.map((option, index) => <li aria-selected={option.id === value} className={index === safeActiveIndex ? "rounded-xl bg-brand-soft/70" : "rounded-xl"} id={`${listboxId}-${option.id}`} key={option.id} role="option"><button className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left" onMouseDown={(event) => { event.preventDefault(); selectOption(option) }} type="button"><span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-strong"><UserRound aria-hidden="true" className="h-3.5 w-3.5" /></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-ink">{option.label}</span><span className="mt-0.5 block truncate text-[0.68rem] text-ink-muted">{option.detail}</span></span>{option.id === value ? <Check aria-hidden="true" className="mt-1 h-3.5 w-3.5 shrink-0 text-brand-strong" /> : null}</button></li>) : <li className="px-3 py-3 text-xs text-ink-muted">No encontramos opciones con ese criterio.</li>}
        </ul> : null}
      </div>
    </FormField>
  )
}

export function PatientSummary({ patient }: { patient: Patient }) {
  return <SummaryCard icon={<UserRound aria-hidden="true" className="h-4 w-4" />} title="Paciente"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-xs font-bold text-brand-strong">{patient.personalData.firstName.charAt(0)}{patient.personalData.lastName.charAt(0)}</span><div className="min-w-0"><p className="truncate text-sm font-semibold text-ink">{formatPatientName(patient)}</p><p className="mt-1 truncate font-mono text-[0.68rem] text-ink-subtle">{patient.personalData.documentId}</p></div></div><DetailList columns={2} items={[{ label: "Contacto", value: formatPatientContact(patient) }, { label: "Nacimiento", value: formatPatientDate(patient.personalData.dateOfBirth) }]} /></SummaryCard>
}

export function DoctorSummary({ doctor }: { doctor: Doctor }) {
  return <SummaryCard icon={<Stethoscope aria-hidden="true" className="h-4 w-4" />} title="Médico"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-xs font-bold text-brand-strong">{doctor.firstName.charAt(0)}{doctor.lastName.charAt(0)}</span><div className="min-w-0"><p className="truncate text-sm font-semibold text-ink">{formatDoctorName(doctor)}</p><p className="mt-1 truncate text-xs text-ink-muted">{doctor.specialty}</p></div></div><DetailList columns={2} items={[{ label: "Licencia", value: doctor.licenseNumber }, { label: "Consultorio", value: doctor.office || "No registrado" }]} /></SummaryCard>
}

function SummaryCard({ children, icon, title }: { children: ReactNode; icon: ReactNode; title: string }) {
  return <section className="rounded-[1.35rem] border border-line/80 bg-panel p-5 shadow-[0_20px_55px_-38px_var(--ink)]"><div className="flex items-center gap-2.5 border-b border-line/70 pb-4"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-soft text-brand-strong">{icon}</span><h2 className="font-display text-base font-semibold tracking-[-0.025em] text-ink">{title}</h2></div><div className="space-y-5 pt-5">{children}</div></section>
}

export function VitalSignsDisplay({ vitalSigns }: { vitalSigns: VitalSigns }) {
  return <section aria-label="Signos vitales" className="rounded-2xl border border-line/70 bg-canvas/45 p-4 sm:p-5"><div className="flex items-center gap-2 text-xs font-semibold text-ink"><ActivityIcon /><span>Signos vitales registrados</span></div><div className="mt-4"><DetailList columns={4} items={[{ label: "Presión arterial", value: vitalSigns.bloodPressure || "No registrada" }, { label: "Frecuencia cardiaca", value: formatVitalSign(vitalSigns.heartRate, "bpm") }, { label: "Temperatura", value: formatVitalSign(vitalSigns.temperature, "°C") }, { label: "Peso", value: formatVitalSign(vitalSigns.weightKg, "kg") }]} /></div><p className="mt-4 border-t border-line/70 pt-3 text-[0.68rem] leading-5 text-ink-subtle">MediCore muestra los valores registrados y no agrega interpretación clínica.</p></section>
}

function ActivityIcon() {
  return <CalendarClock aria-hidden="true" className="h-4 w-4 text-brand-strong" />
}

export function ActiveRecordBadge({ isActive }: { isActive: boolean }) {
  return <StatusBadge icon={isActive ? <CircleCheck aria-hidden="true" className="h-3.5 w-3.5" /> : <CircleX aria-hidden="true" className="h-3.5 w-3.5" />} label={isActive ? "Activo" : "Inactivo"} tone={isActive ? "success" : "danger"} />
}
