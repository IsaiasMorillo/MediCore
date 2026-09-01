import { ArrowLeft } from "lucide-react"
import type { ReactNode } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { PageHeader } from "@/components/layout/page-header"
import { DoctorForm } from "@/features/doctors/components/doctor-form"
import type { DoctorFormValues } from "@/features/doctors/schemas/doctor-schemas"
import { useCreateDoctor, useDoctor, useUpdateDoctor } from "@/features/doctors/hooks/use-doctors"
import { getDoctorErrorMessage } from "@/features/doctors/utils/doctor-errors"
import { toCreateDoctorInput, toUpdateDoctorInput } from "@/features/doctors/utils/doctor-form"

export function DoctorCreatePage() {
  const navigate = useNavigate()
  const createMutation = useCreateDoctor()

  const onSubmit = async (values: DoctorFormValues) => {
    createMutation.reset()

    try {
      const response = await createMutation.mutateAsync(toCreateDoctorInput(values))
      navigate(`/app/doctors/${response.id}`, { replace: true })
    } catch {
      // The mutation error is rendered by DoctorForm.
    }
  }

  return (
    <DoctorFormPageLayout
      backTo="/app/doctors"
      description="Registra un especialista y define los turnos que utilizará la operación clínica."
      eyebrow="Atención · Nuevo registro"
      title="Registrar médico"
    >
      <DoctorForm
        mode="create"
        onSubmit={onSubmit}
        serverError={createMutation.isError ? getDoctorErrorMessage(createMutation.error, "No pudimos registrar el médico.") : null}
      />
    </DoctorFormPageLayout>
  )
}

export function DoctorEditPage() {
  const navigate = useNavigate()
  const { doctorId } = useParams()
  const doctorQuery = useDoctor(doctorId)
  const updateMutation = useUpdateDoctor()

  if (!doctorId) {
    return <DoctorFormState message="La ficha no tiene un identificador válido." />
  }

  if (doctorQuery.isPending) {
    return <DoctorFormLoadingState />
  }

  if (doctorQuery.isError || !doctorQuery.data) {
    return (
      <DoctorFormState
        message={getDoctorErrorMessage(doctorQuery.error, "No pudimos cargar los datos para editar.")}
        onRetry={() => void doctorQuery.refetch()}
      />
    )
  }

  const onSubmit = async (values: DoctorFormValues) => {
    updateMutation.reset()

    try {
      await updateMutation.mutateAsync({ id: doctorId, input: toUpdateDoctorInput(values) })
      navigate(`/app/doctors/${doctorId}`, { replace: true })
    } catch {
      // The mutation error is rendered by DoctorForm.
    }
  }

  return (
    <DoctorFormPageLayout
      backTo={`/app/doctors/${doctorId}`}
      description="Actualiza el perfil profesional y la agenda sin perder la continuidad del registro."
      eyebrow="Atención · Editar ficha"
      title={`Editar ${doctorQuery.data.firstName} ${doctorQuery.data.lastName}`}
    >
      <DoctorForm
        doctor={doctorQuery.data}
        mode="edit"
        onSubmit={onSubmit}
        serverError={updateMutation.isError ? getDoctorErrorMessage(updateMutation.error, "No pudimos guardar los cambios.") : null}
      />
    </DoctorFormPageLayout>
  )
}

function DoctorFormPageLayout({
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

function DoctorFormLoadingState() {
  return (
    <div aria-busy="true" aria-live="polite" className="space-y-6">
      <span className="block h-4 w-20 animate-pulse rounded-full bg-line/60" />
      <span className="block h-10 w-2/3 animate-pulse rounded-xl bg-line/60" />
      <div className="h-[34rem] max-w-4xl animate-pulse rounded-[1.35rem] border border-line/70 bg-panel" />
    </div>
  )
}

function DoctorFormState({ message, onRetry }: { message: string; onRetry?: () => void }) {
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
          to="/app/doctors"
        >
          Volver a médicos
        </Link>
      </div>
    </div>
  )
}
