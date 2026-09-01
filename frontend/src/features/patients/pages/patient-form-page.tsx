import { ArrowLeft } from "lucide-react"
import type { ReactNode } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { PageHeader } from "@/components/layout/page-header"
import { PatientForm } from "@/features/patients/components/patient-form"
import {
  useCreatePatient,
  usePatient,
  useUpdatePatient,
} from "@/features/patients/hooks/use-patients"
import { getPatientErrorMessage } from "@/features/patients/utils/patient-errors"
import { toCreatePatientInput, toUpdatePatientInput } from "@/features/patients/utils/patient-form"
import type { PatientFormValues } from "@/features/patients/schemas/patient-schemas"

export function PatientCreatePage() {
  const navigate = useNavigate()
  const createMutation = useCreatePatient()

  const onSubmit = async (values: PatientFormValues) => {
    createMutation.reset()

    try {
      const response = await createMutation.mutateAsync(toCreatePatientInput(values))
      navigate(`/app/patients/${response.id}`, { replace: true })
    } catch {
      // The mutation error is rendered by PatientForm.
    }
  }

  return (
    <PatientFormPageLayout
      backTo="/app/patients"
      description="Registra la información base del paciente para centralizar su atención en MediCore."
      eyebrow="Atención · Nuevo registro"
      title="Registrar paciente"
    >
      <PatientForm
        mode="create"
        onSubmit={onSubmit}
        serverError={createMutation.isError ? getPatientErrorMessage(createMutation.error, "No pudimos registrar el paciente.") : null}
      />
    </PatientFormPageLayout>
  )
}

export function PatientEditPage() {
  const navigate = useNavigate()
  const { patientId } = useParams()
  const patientQuery = usePatient(patientId)
  const updateMutation = useUpdatePatient()

  if (!patientId) {
    return <PatientFormState message="La ficha no tiene un identificador válido." />
  }

  if (patientQuery.isPending) {
    return <PatientFormLoadingState />
  }

  if (patientQuery.isError || !patientQuery.data) {
    return (
      <PatientFormState
        message={getPatientErrorMessage(patientQuery.error, "No pudimos cargar los datos para editar.")}
        onRetry={() => void patientQuery.refetch()}
      />
    )
  }

  const onSubmit = async (values: PatientFormValues) => {
    updateMutation.reset()

    try {
      await updateMutation.mutateAsync({ id: patientId, input: toUpdatePatientInput(values) })
      navigate(`/app/patients/${patientId}`, { replace: true })
    } catch {
      // The mutation error is rendered by PatientForm.
    }
  }

  return (
    <PatientFormPageLayout
      backTo={`/app/patients/${patientId}`}
      description="Actualiza la información demográfica y clínica inicial sin perder la continuidad del registro."
      eyebrow="Atención · Editar ficha"
      title={`Editar ${patientQuery.data.personalData.firstName} ${patientQuery.data.personalData.lastName}`}
    >
      <PatientForm
        mode="edit"
        onSubmit={onSubmit}
        patient={patientQuery.data}
        serverError={updateMutation.isError ? getPatientErrorMessage(updateMutation.error, "No pudimos guardar los cambios.") : null}
      />
    </PatientFormPageLayout>
  )
}

function PatientFormPageLayout({
  backTo,
  children,
  description,
  eyebrow,
  title,
}: {
  backTo: string
  children: ReactNode
  description: string
  eyebrow: string
  title: string
}) {
  return (
    <div className="space-y-6">
      <Link
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-strong transition-colors hover:text-brand focus-visible:outline-none"
        to={backTo}
      >
        <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
        Volver
      </Link>
      <PageHeader description={description} eyebrow={eyebrow} title={title} />
      <section className="max-w-4xl rounded-[1.35rem] border border-line/80 bg-panel p-5 shadow-[0_20px_55px_-38px_var(--ink)] sm:p-7">
        {children}
      </section>
    </div>
  )
}

function PatientFormLoadingState() {
  return (
    <div aria-busy="true" aria-live="polite" className="space-y-6">
      <span className="block h-4 w-20 animate-pulse rounded-full bg-line/60" />
      <span className="block h-10 w-2/3 animate-pulse rounded-xl bg-line/60" />
      <div className="h-[42rem] max-w-4xl animate-pulse rounded-[1.35rem] border border-line/70 bg-panel" />
    </div>
  )
}

function PatientFormState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center" role={onRetry ? "alert" : undefined}>
      <p className="text-sm font-semibold text-ink">No pudimos abrir el formulario</p>
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
