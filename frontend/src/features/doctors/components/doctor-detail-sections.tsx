import { BriefcaseBusiness, CalendarClock, IdCard, Stethoscope } from "lucide-react"
import type { ReactNode } from "react"

import { DoctorStatusBadge } from "@/features/doctors/components/doctor-status-badge"
import {
  formatDoctorDay,
  formatDoctorTime,
  getSortedDoctorSchedule,
} from "@/features/doctors/utils/doctor-formatting"
import type { Doctor } from "@/features/doctors/types"

export function DoctorDetailSections({ doctor }: { doctor: Doctor }) {
  return (
    <div className="space-y-5">
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
        <DetailPanel icon={<Stethoscope aria-hidden="true" className="h-4 w-4" />} title="Perfil profesional">
          <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
            <DetailValue label="Especialidad" value={doctor.specialty} />
            <DetailValue label="Licencia médica" value={doctor.licenseNumber} />
            <DetailValue label="Consultorio" value={doctor.office || "No registrado"} />
            <DetailValue label="Experiencia" value={`${doctor.experienceYears} año${doctor.experienceYears === 1 ? "" : "s"}`} />
          </dl>
        </DetailPanel>
        <DetailPanel icon={<BriefcaseBusiness aria-hidden="true" className="h-4 w-4" />} title="Estado del registro">
          <div className="flex items-center justify-between gap-4 rounded-2xl bg-canvas/65 px-4 py-4">
            <div>
              <p className="text-sm font-semibold text-ink">Especialista en MediCore</p>
              <p className="mt-1 text-xs leading-5 text-ink-muted">
                {doctor.isActive ? "Disponible para la operación clínica." : "Conservado como registro histórico."}
              </p>
            </div>
            <DoctorStatusBadge isActive={doctor.isActive} />
          </div>
          <div className="mt-4 rounded-2xl border border-line/70 px-4 py-3">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-ink-subtle">ID interno</p>
            <p className="mt-1 break-all font-mono text-xs text-ink-muted">{doctor.id}</p>
          </div>
        </DetailPanel>
      </section>

      <DetailPanel icon={<CalendarClock aria-hidden="true" className="h-4 w-4" />} title="Agenda semanal">
        {doctor.schedule.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {getSortedDoctorSchedule(doctor.schedule).map((shift, index) => (
              <div className="rounded-2xl bg-canvas/65 px-4 py-3" key={`${shift.day}-${shift.startTime}-${index}`}>
                <p className="text-xs font-semibold text-ink">{formatDoctorDay(shift.day)}</p>
                <p className="mt-1 text-sm text-ink-muted">
                  {formatDoctorTime(shift.startTime)} – {formatDoctorTime(shift.endTime)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <DetailEmpty text="No hay turnos registrados para este médico." />
        )}
      </DetailPanel>

      <section className="grid gap-5 lg:grid-cols-2">
        <DetailPanel icon={<IdCard aria-hidden="true" className="h-4 w-4" />} title="Identificación">
          <div className="rounded-2xl bg-canvas/65 px-4 py-4">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-ink-subtle">Nombre completo</p>
            <p className="mt-1.5 text-sm font-semibold text-ink">{doctor.firstName} {doctor.lastName}</p>
            <p className="mt-2 text-xs leading-5 text-ink-muted">
              La licencia identifica la autorización profesional registrada en MediCore.
            </p>
          </div>
        </DetailPanel>
        <DetailPanel icon={<CalendarClock aria-hidden="true" className="h-4 w-4" />} title="Resumen de disponibilidad">
          <div className="flex items-end justify-between gap-4 rounded-2xl bg-ink px-4 py-4 text-white">
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-brand-soft">Turnos configurados</p>
              <p className="mt-2 font-display text-3xl font-semibold tracking-[-0.06em]">{doctor.schedule.length}</p>
            </div>
            <p className="max-w-[10rem] text-right text-xs leading-5 text-white/60">
              La disponibilidad efectiva se valida al gestionar citas.
            </p>
          </div>
        </DetailPanel>
      </section>
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

function DetailEmpty({ text }: { text: string }) {
  return <p className="rounded-2xl bg-canvas/65 px-4 py-4 text-xs leading-5 text-ink-muted">{text}</p>
}
