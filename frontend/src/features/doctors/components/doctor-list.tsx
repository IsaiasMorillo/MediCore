import { ArrowUpRight, CalendarClock, FileSearch } from "lucide-react"
import { Link } from "react-router-dom"

import { DoctorStatusBadge } from "@/features/doctors/components/doctor-status-badge"
import {
  formatDoctorName,
  formatDoctorShift,
  getDoctorInitials,
} from "@/features/doctors/utils/doctor-formatting"
import type { Doctor } from "@/features/doctors/types"

export function DoctorList({ doctors }: { doctors: readonly Doctor[] }) {
  if (doctors.length === 0) {
    return (
      <div className="flex min-h-56 flex-col items-center justify-center px-6 py-12 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-soft text-brand-strong">
          <FileSearch aria-hidden="true" className="h-5 w-5" />
        </span>
        <p className="mt-4 text-sm font-semibold text-ink">No hay médicos para mostrar</p>
        <p className="mt-1 max-w-sm text-xs leading-5 text-ink-muted">
          Prueba con otro término de búsqueda o ajusta los filtros.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[800px] border-collapse text-left">
          <caption className="sr-only">Directorio de médicos</caption>
          <thead>
            <tr className="border-b border-line/80 text-[0.68rem] uppercase tracking-[0.12em] text-ink-subtle">
              <th className="px-5 py-3 font-semibold" scope="col">Médico</th>
              <th className="px-5 py-3 font-semibold" scope="col">Especialidad</th>
              <th className="px-5 py-3 font-semibold" scope="col">Licencia</th>
              <th className="px-5 py-3 font-semibold" scope="col">Agenda</th>
              <th className="px-5 py-3 font-semibold" scope="col">Estado</th>
              <th className="px-5 py-3 text-right font-semibold" scope="col">Ficha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {doctors.map((doctor) => (
              <DoctorTableRow doctor={doctor} key={doctor.id} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-4 md:hidden">
        {doctors.map((doctor) => (
          <DoctorCard doctor={doctor} key={doctor.id} />
        ))}
      </div>
    </>
  )
}

function DoctorTableRow({ doctor }: { doctor: Doctor }) {
  const name = formatDoctorName(doctor)

  return (
    <tr className="group transition-colors hover:bg-canvas/60">
      <td className="px-5 py-4">
        <Link className="flex min-w-0 items-center gap-3" to={`/app/doctors/${doctor.id}`}>
          <DoctorAvatar doctor={doctor} />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-ink group-hover:text-brand-strong">{name}</span>
            <span className="mt-0.5 block truncate font-mono text-[0.68rem] text-ink-subtle">ID {doctor.id}</span>
          </span>
        </Link>
      </td>
      <td className="px-5 py-4 text-sm text-ink-muted">{doctor.specialty}</td>
      <td className="px-5 py-4 font-mono text-xs text-ink-muted">{doctor.licenseNumber}</td>
      <td className="px-5 py-4">
        <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
          <CalendarClock aria-hidden="true" className="h-3.5 w-3.5 text-brand-strong" />
          {doctor.schedule.length} turno{doctor.schedule.length === 1 ? "" : "s"}
        </span>
      </td>
      <td className="px-5 py-4"><DoctorStatusBadge isActive={doctor.isActive} /></td>
      <td className="px-5 py-4 text-right">
        <Link
          aria-label={`Ver ficha de ${name}`}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-brand-strong transition-colors hover:bg-brand-soft/60 focus-visible:outline-none"
          to={`/app/doctors/${doctor.id}`}
        >
          Ver ficha
          <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
        </Link>
      </td>
    </tr>
  )
}

function DoctorCard({ doctor }: { doctor: Doctor }) {
  const name = formatDoctorName(doctor)

  return (
    <Link
      className="block rounded-2xl border border-line/80 bg-panel-raised p-4 transition-colors hover:border-brand/40 focus-visible:outline-none"
      to={`/app/doctors/${doctor.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <DoctorAvatar doctor={doctor} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{name}</p>
            <p className="mt-0.5 truncate text-xs text-ink-muted">{doctor.specialty}</p>
          </div>
        </div>
        <DoctorStatusBadge isActive={doctor.isActive} />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-line/60 pt-3">
        <div>
          <dt className="text-[0.65rem] uppercase tracking-[0.1em] text-ink-subtle">Licencia</dt>
          <dd className="mt-1 truncate font-mono text-xs font-medium text-ink-muted">{doctor.licenseNumber}</dd>
        </div>
        <div>
          <dt className="text-[0.65rem] uppercase tracking-[0.1em] text-ink-subtle">Agenda</dt>
          <dd className="mt-1 truncate text-xs font-medium text-ink-muted">{doctor.schedule.length} turno{doctor.schedule.length === 1 ? "" : "s"}</dd>
        </div>
      </dl>
      {doctor.schedule[0] ? <p className="mt-3 truncate text-xs text-ink-subtle">{formatDoctorShift(doctor.schedule[0])}</p> : null}
      <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-strong">
        Abrir ficha
        <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
      </span>
    </Link>
  )
}

function DoctorAvatar({ doctor }: { doctor: Doctor }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-xs font-bold text-brand-strong">
      {getDoctorInitials(doctor)}
    </span>
  )
}
