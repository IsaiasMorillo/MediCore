import { ArrowLeft, Pencil, Trash2 } from "lucide-react"
import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { PageHeader } from "@/components/layout/page-header"
import { FormAlert } from "@/features/auth/components/form-controls"
import { PatientDetailSections } from "@/features/patients/components/patient-detail-sections"
import { PatientStatusBadge } from "@/features/patients/components/patient-status-badge"
import { useDeletePatient, usePatient } from "@/features/patients/hooks/use-patients"
import { getPatientErrorMessage } from "@/features/patients/utils/patient-errors"
import { formatPatientName } from "@/features/patients/utils/patient-formatting"
import { hasAnyRole } from "@/lib/permissions/roles"
import { PATIENT_DELETE_ROLES, PATIENT_WRITE_ROLES } from "@/lib/permissions/route-roles"
import { useAuthSession } from "@/lib/auth/use-auth-session"

export function PatientDetailPage() {
  const { session } = useAuthSession()
  const navigate = useNavigate()
  const { patientId } = useParams()
  const patientQuery = usePatient(patientId)
  const deleteMutation = useDeletePatient()
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false)

  if (!patientId) {
    return <PatientDetailState message="La ficha no tiene un identificador válido." />
  }

  if (patientQuery.isPending) {
    return <PatientDetailLoadingState />
  }

  if (patientQuery.isError || !patientQuery.data) {
    return (
      <PatientDetailState
        message={getPatientErrorMessage(patientQuery.error, "No pudimos cargar la ficha del paciente.")}
        onRetry={() => void patientQuery.refetch()}
      />
    )
  }

  const patient = patientQuery.data
  const canEdit = session ? hasAnyRole(session.user.roles, PATIENT_WRITE_ROLES) : false
  const canDelete = session ? hasAnyRole(session.user.roles, PATIENT_DELETE_ROLES) : false
  const patientName = formatPatientName(patient)

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(patientId)
      navigate("/app/patients", { replace: true })
    } catch {
      setIsDeleteConfirmationOpen(true)
    }
  }

  return (
    <div className="space-y-7">
      <Link
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-strong transition-colors hover:text-brand focus-visible:outline-none"
        to="/app/patients"
      >
        <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
        Volver a pacientes
      </Link>
      <PageHeader
        actions={
          <>
            <PatientStatusBadge isActive={patient.isActive} />
            {canEdit ? (
              <Link
                className="inline-flex items-center gap-2 rounded-xl border border-line bg-panel px-3.5 py-2.5 text-xs font-semibold text-ink-muted transition-colors hover:border-brand/40 hover:text-ink"
                to={`/app/patients/${patient.id}/edit`}
              >
                <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
                Editar ficha
              </Link>
            ) : null}
            {canDelete ? (
              <button
                className="inline-flex items-center gap-2 rounded-xl border border-rose/25 bg-rose-soft/50 px-3.5 py-2.5 text-xs font-semibold text-rose-strong transition-colors hover:border-rose/45 hover:bg-rose-soft"
                onClick={() => {
                  deleteMutation.reset()
                  setIsDeleteConfirmationOpen(true)
                }}
                type="button"
              >
                <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                Eliminar
              </button>
            ) : null}
          </>
        }
        description={`Documento ${patient.personalData.documentId}. Consulta la información registrada sin salir del área operativa.`}
        eyebrow="Atención · Ficha de paciente"
        title={patientName}
      />

      {isDeleteConfirmationOpen && canDelete ? (
        <section
          aria-describedby="delete-patient-description"
          aria-labelledby="delete-patient-title"
          className="flex flex-col gap-4 rounded-2xl border border-rose/25 bg-rose-soft/55 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
          role="alertdialog"
        >
          <div>
            <h2 className="text-sm font-semibold text-ink" id="delete-patient-title">¿Eliminar este paciente?</h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-ink-muted" id="delete-patient-description">
              Esta acción elimina el registro del paciente y no se puede deshacer desde MediCore. Confirma solo si estás seguro.
            </p>
            {deleteMutation.isError ? (
              <div className="mt-3 max-w-xl">
                <FormAlert message={getPatientErrorMessage(deleteMutation.error, "No pudimos eliminar el paciente.")} />
              </div>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
            <button
              className="rounded-xl border border-line bg-panel-raised px-3.5 py-2.5 text-xs font-semibold text-ink-muted transition-colors hover:border-brand/40 hover:text-ink"
              onClick={() => setIsDeleteConfirmationOpen(false)}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-xl bg-rose-strong px-3.5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-rose disabled:cursor-wait disabled:opacity-60"
              disabled={deleteMutation.isPending}
              onClick={() => void handleDelete()}
              type="button"
            >
              <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
              {deleteMutation.isPending ? "Eliminando..." : "Sí, eliminar paciente"}
            </button>
          </div>
        </section>
      ) : null}

      <PatientDetailSections patient={patient} />
    </div>
  )
}

function PatientDetailLoadingState() {
  return (
    <div aria-busy="true" aria-live="polite" className="space-y-6">
      <span className="block h-4 w-32 animate-pulse rounded-full bg-line/60" />
      <div className="space-y-3">
        <span className="block h-3 w-32 animate-pulse rounded-full bg-line/60" />
        <span className="block h-10 w-2/3 animate-pulse rounded-xl bg-line/60" />
        <span className="block h-4 w-full max-w-xl animate-pulse rounded-full bg-line/60" />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {[0, 1, 2, 3].map((card) => (
          <div className="h-52 animate-pulse rounded-[1.35rem] border border-line/70 bg-panel" key={card} />
        ))}
      </div>
    </div>
  )
}

function PatientDetailState({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center" role={onRetry ? "alert" : undefined}>
      <p className="text-sm font-semibold text-ink">No pudimos mostrar la ficha</p>
      <p className="mt-2 max-w-sm text-xs leading-5 text-ink-muted">{message}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2.5">
        {onRetry ? (
          <button
            className="rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-strong"
            onClick={onRetry}
            type="button"
          >
            Intentar nuevamente
          </button>
        ) : null}
        <Link
          className="rounded-xl border border-line bg-panel-raised px-4 py-2.5 text-xs font-semibold text-ink-muted transition-colors hover:border-brand/40 hover:text-ink"
          to="/app/patients"
        >
          Volver a pacientes
        </Link>
      </div>
    </div>
  )
}
