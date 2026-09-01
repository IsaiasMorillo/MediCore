import { ArrowLeft, Package } from "lucide-react"
import { useNavigate, useParams, Link } from "react-router-dom"
import type { SubmitHandler } from "react-hook-form"

import { PageHeader } from "@/components/layout/page-header"
import { FormAlert } from "@/features/auth/components/form-controls"
import { MedicationForm, MedicationFormGuidance } from "@/features/pharmacy/components/medication-form"
import { useMedications, useUpdateMedication } from "@/features/pharmacy/hooks/use-pharmacy"
import type { MedicationFormValues } from "@/features/pharmacy/schemas/pharmacy-schemas"
import { getPharmacyErrorMessage } from "@/features/pharmacy/utils/pharmacy-errors"

export function PharmacyMedicationEditPage() {
  const navigate = useNavigate()
  const { medicationId } = useParams()
  const medicationsQuery = useMedications("")
  const updateMutation = useUpdateMedication()
  const medication = medicationsQuery.data?.find((item) => item.id === medicationId)

  const handleSubmit: SubmitHandler<MedicationFormValues> = async (values) => {
    if (!medicationId) {
      return
    }

    try {
      await updateMutation.mutateAsync({
        id: medicationId,
        input: {
          category: values.category,
          code: values.code,
          expirationDate: values.expirationDate || null,
          isActive: values.isActive,
          name: values.name,
          price: values.price,
          reorderLevel: values.reorderLevel,
          stockQuantity: values.stockQuantity,
        },
      })
      navigate("/app/pharmacy/medications", { replace: true })
    } catch {
      // The mutation state renders the server response below the page header.
    }
  }

  if (!medicationId) {
    return <PharmacyMedicationState message="El medicamento no tiene un identificador válido." />
  }

  if (medicationsQuery.isPending) {
    return <PharmacyMedicationLoadingState />
  }

  if (medicationsQuery.isError) {
    return <PharmacyMedicationState message={getPharmacyErrorMessage(medicationsQuery.error, "No pudimos cargar el medicamento.")} onRetry={() => void medicationsQuery.refetch()} />
  }

  if (!medication) {
    return <PharmacyMedicationState message="No encontramos ese medicamento en el inventario." />
  }

  return (
    <div className="space-y-7">
      <Link className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-strong transition-colors hover:text-brand focus-visible:outline-none" to="/app/pharmacy/medications"><ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />Volver al inventario</Link>
      <PageHeader description={`Actualiza la ficha de ${medication.name}. Las entradas y salidas de stock usan un flujo separado.`} eyebrow="Operación · Editar medicamento" title="Editar medicamento" />
      {updateMutation.isError ? <FormAlert message={getPharmacyErrorMessage(updateMutation.error, "No pudimos actualizar el medicamento.")} /> : null}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
        <section className="rounded-[1.35rem] border border-line/80 bg-panel p-5 shadow-[0_20px_55px_-38px_var(--ink)] sm:p-6"><MedicationForm initialValues={{ category: medication.category, code: medication.code, expirationDate: medication.expirationDate?.slice(0, 10) ?? "", isActive: medication.isActive, name: medication.name, price: medication.price, reorderLevel: medication.reorderLevel, stockQuantity: medication.stockQuantity }} isEditing onSubmit={handleSubmit} serverError={null} /></section>
        <div className="space-y-4"><MedicationFormGuidance isEditing /><div className="rounded-2xl border border-line/80 bg-panel p-4 text-xs leading-5 text-ink-muted"><div className="flex items-center gap-2 font-semibold text-ink"><Package aria-hidden="true" className="h-4 w-4 text-brand-strong" />Referencia actual</div><p className="mt-2 break-all font-mono text-[0.68rem] text-ink-subtle">ID {medication.id}</p></div></div>
      </div>
    </div>
  )
}

function PharmacyMedicationLoadingState() {
  return <div aria-busy="true" aria-live="polite" className="space-y-6"><span className="block h-4 w-40 animate-pulse rounded-full bg-line/60" /><div className="space-y-3"><span className="block h-3 w-36 animate-pulse rounded-full bg-line/60" /><span className="block h-10 w-2/3 animate-pulse rounded-xl bg-line/60" /><span className="block h-4 w-full max-w-2xl animate-pulse rounded-full bg-line/60" /></div><div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]"><div className="h-[38rem] animate-pulse rounded-[1.35rem] border border-line/70 bg-panel" /><div className="h-72 animate-pulse rounded-[1.35rem] border border-line/70 bg-panel" /></div></div>
}

function PharmacyMedicationState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center" role={onRetry ? "alert" : undefined}><p className="text-sm font-semibold text-ink">No pudimos preparar el medicamento</p><p className="mt-2 max-w-sm text-xs leading-5 text-ink-muted">{message}</p><div className="mt-5 flex flex-wrap justify-center gap-2.5">{onRetry ? <button className="rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-strong" onClick={onRetry} type="button">Intentar nuevamente</button> : null}<Link className="rounded-xl border border-line bg-panel-raised px-4 py-2.5 text-xs font-semibold text-ink-muted transition-colors hover:border-brand/40 hover:text-ink" to="/app/pharmacy/medications">Volver al inventario</Link></div></div>
}
