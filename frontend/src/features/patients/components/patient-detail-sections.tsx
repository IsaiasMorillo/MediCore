import { FileHeart, HeartPulse, Mail, Phone, ShieldCheck, UserRound } from "lucide-react"
import type { ReactNode } from "react"

import { PatientStatusBadge } from "@/features/patients/components/patient-status-badge"
import {
  formatPatientDate,
  formatPatientName,
} from "@/features/patients/utils/patient-formatting"
import type { Patient } from "@/features/patients/types"

export function PatientDetailSections({ patient }: { patient: Patient }) {
  return (
    <div className="space-y-5">
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
        <DetailPanel icon={<UserRound aria-hidden="true" className="h-4 w-4" />} title="Datos personales">
          <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
            <DetailValue label="Nombre completo" value={formatPatientName(patient)} />
            <DetailValue label="Documento de identidad" value={patient.personalData.documentId} />
            <DetailValue label="Fecha de nacimiento" value={formatPatientDate(patient.personalData.dateOfBirth)} />
            <DetailValue label="Género" value={patient.personalData.gender || "No registrado"} />
          </dl>
        </DetailPanel>
        <DetailPanel icon={<ShieldCheck aria-hidden="true" className="h-4 w-4" />} title="Estado del registro">
          <div className="flex items-center justify-between gap-4 rounded-2xl bg-canvas/65 px-4 py-4">
            <div>
              <p className="text-sm font-semibold text-ink">Paciente en MediCore</p>
              <p className="mt-1 text-xs leading-5 text-ink-muted">
                {patient.isActive ? "Disponible para la operación clínica." : "Conservado como registro histórico."}
              </p>
            </div>
            <PatientStatusBadge isActive={patient.isActive} />
          </div>
          <div className="mt-4 rounded-2xl border border-line/70 px-4 py-3">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-ink-subtle">ID interno</p>
            <p className="mt-1 break-all font-mono text-xs text-ink-muted">{patient.id}</p>
          </div>
        </DetailPanel>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <DetailPanel icon={<Phone aria-hidden="true" className="h-4 w-4" />} title="Contactos">
          {patient.contacts.length > 0 ? (
            <div className="space-y-3">
              {patient.contacts.map((contact, index) => (
                <div className="flex items-start gap-3 rounded-2xl bg-canvas/65 px-4 py-3" key={`${contact.type}-${index}`}>
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-panel-raised text-brand-strong">
                    {contact.type === "Email" ? <Mail aria-hidden="true" className="h-4 w-4" /> : <Phone aria-hidden="true" className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-ink">{contact.name || getContactLabel(contact.type)}</p>
                    <p className="mt-1 break-words text-sm text-ink-muted">{contact.phone || contact.value || "Sin valor registrado"}</p>
                    {contact.name && contact.type === "Emergency" ? (
                      <p className="mt-0.5 text-[0.68rem] text-ink-subtle">Contacto de emergencia</p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <DetailEmpty text="No hay contactos registrados para este paciente." />
          )}
        </DetailPanel>
        <DetailPanel icon={<FileHeart aria-hidden="true" className="h-4 w-4" />} title="Seguro médico">
          {patient.medicalInsurance ? (
            <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-3">
              <DetailValue label="Aseguradora" value={patient.medicalInsurance.provider || "No registrada"} />
              <DetailValue label="Póliza" value={patient.medicalInsurance.policyNumber || "No registrada"} />
              <DetailValue label="Cobertura" value={patient.medicalInsurance.coverageType || "No registrada"} />
            </dl>
          ) : (
            <DetailEmpty text="Este paciente no tiene un seguro médico registrado." />
          )}
        </DetailPanel>
      </section>

      <DetailPanel icon={<HeartPulse aria-hidden="true" className="h-4 w-4" />} title="Historia clínica inicial">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <HistoryList label="Alergias" values={patient.clinicalHistory.allergies} />
          <HistoryList label="Enfermedades crónicas" values={patient.clinicalHistory.chronicDiseases} />
          <HistoryList label="Medicamentos actuales" values={patient.clinicalHistory.currentMedications} />
          <HistoryList label="Antecedentes familiares" values={patient.clinicalHistory.familyHistory} />
        </div>
      </DetailPanel>
    </div>
  )
}

function DetailPanel({
  children,
  icon,
  title,
}: {
  children: ReactNode
  icon: ReactNode
  title: string
}) {
  return (
    <section className="rounded-[1.35rem] border border-line/80 bg-panel p-5 shadow-[0_20px_55px_-38px_var(--ink)] sm:p-6">
      <div className="flex items-center gap-2.5 border-b border-line/70 pb-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-soft text-brand-strong">{icon}</span>
        <h2 className="font-display text-base font-semibold tracking-[-0.025em] text-ink">{title}</h2>
      </div>
      <div className="pt-5">{children}</div>
    </section>
  )
}

function DetailValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-ink-subtle">{label}</dt>
      <dd className="mt-1.5 break-words text-sm font-medium text-ink">{value}</dd>
    </div>
  )
}

function HistoryList({ label, values }: { label: string; values: readonly string[] }) {
  return (
    <div>
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-ink-subtle">{label}</p>
      {values.length > 0 ? (
        <ul className="mt-2 space-y-1.5">
          {values.map((value) => (
            <li className="flex items-start gap-2 text-sm leading-5 text-ink" key={value}>
              <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
              <span>{value}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-ink-subtle">Sin información registrada.</p>
      )}
    </div>
  )
}

function DetailEmpty({ text }: { text: string }) {
  return <p className="rounded-2xl bg-canvas/65 px-4 py-4 text-xs leading-5 text-ink-muted">{text}</p>
}

function getContactLabel(type: string) {
  if (type === "Emergency") {
    return "Contacto de emergencia"
  }

  if (type === "Email") {
    return "Correo electrónico"
  }

  return type || "Contacto"
}
