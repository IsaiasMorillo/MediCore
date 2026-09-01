import { ArrowUpRight, FileSearch } from "lucide-react"
import { Link } from "react-router-dom"

import { PatientStatusBadge } from "@/features/patients/components/patient-status-badge"
import {
  formatPatientContact,
  formatPatientName,
  getPatientInitials,
} from "@/features/patients/utils/patient-formatting"
import type { Patient } from "@/features/patients/types"

export function PatientList({ patients }: { patients: readonly Patient[] }) {
  if (patients.length === 0) {
    return (
      <div className="flex min-h-56 flex-col items-center justify-center px-6 py-12 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-soft text-brand-strong">
          <FileSearch aria-hidden="true" className="h-5 w-5" />
        </span>
        <p className="mt-4 text-sm font-semibold text-ink">No hay pacientes para mostrar</p>
        <p className="mt-1 max-w-sm text-xs leading-5 text-ink-muted">
          Prueba con otro término de búsqueda o ajusta el filtro de estado.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[700px] border-collapse text-left">
          <caption className="sr-only">Listado de pacientes</caption>
          <thead>
            <tr className="border-b border-line/80 text-[0.68rem] uppercase tracking-[0.12em] text-ink-subtle">
              <th className="px-5 py-3 font-semibold" scope="col">Paciente</th>
              <th className="px-5 py-3 font-semibold" scope="col">Documento</th>
              <th className="px-5 py-3 font-semibold" scope="col">Contacto principal</th>
              <th className="px-5 py-3 font-semibold" scope="col">Estado</th>
              <th className="px-5 py-3 text-right font-semibold" scope="col">Ficha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {patients.map((patient) => (
              <PatientTableRow key={patient.id} patient={patient} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-4 md:hidden">
        {patients.map((patient) => (
          <PatientCard key={patient.id} patient={patient} />
        ))}
      </div>
    </>
  )
}

function PatientTableRow({ patient }: { patient: Patient }) {
  const name = formatPatientName(patient)

  return (
    <tr className="group transition-colors hover:bg-canvas/60">
      <td className="px-5 py-4">
        <Link className="flex min-w-0 items-center gap-3" to={`/app/patients/${patient.id}`}>
          <PatientAvatar patient={patient} />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-ink group-hover:text-brand-strong">{name}</span>
            <span className="mt-0.5 block truncate font-mono text-[0.68rem] text-ink-subtle">ID {patient.id}</span>
          </span>
        </Link>
      </td>
      <td className="px-5 py-4 text-sm text-ink-muted">{patient.personalData.documentId}</td>
      <td className="px-5 py-4 text-sm text-ink-muted">{formatPatientContact(patient)}</td>
      <td className="px-5 py-4"><PatientStatusBadge isActive={patient.isActive} /></td>
      <td className="px-5 py-4 text-right">
        <Link
          aria-label={`Ver ficha de ${name}`}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-brand-strong transition-colors hover:bg-brand-soft/60 focus-visible:outline-none"
          to={`/app/patients/${patient.id}`}
        >
          Ver ficha
          <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
        </Link>
      </td>
    </tr>
  )
}

function PatientCard({ patient }: { patient: Patient }) {
  const name = formatPatientName(patient)

  return (
    <Link
      className="block rounded-2xl border border-line/80 bg-panel-raised p-4 transition-colors hover:border-brand/40 focus-visible:outline-none"
      to={`/app/patients/${patient.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <PatientAvatar patient={patient} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{name}</p>
            <p className="mt-0.5 truncate font-mono text-[0.68rem] text-ink-subtle">ID {patient.id}</p>
          </div>
        </div>
        <PatientStatusBadge isActive={patient.isActive} />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-line/60 pt-3">
        <div>
          <dt className="text-[0.65rem] uppercase tracking-[0.1em] text-ink-subtle">Documento</dt>
          <dd className="mt-1 truncate text-xs font-medium text-ink-muted">{patient.personalData.documentId}</dd>
        </div>
        <div>
          <dt className="text-[0.65rem] uppercase tracking-[0.1em] text-ink-subtle">Contacto</dt>
          <dd className="mt-1 truncate text-xs font-medium text-ink-muted">{formatPatientContact(patient)}</dd>
        </div>
      </dl>
      <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-strong">
        Abrir ficha
        <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
      </span>
    </Link>
  )
}

function PatientAvatar({ patient }: { patient: Patient }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-xs font-bold text-brand-strong">
      {getPatientInitials(patient)}
    </span>
  )
}
