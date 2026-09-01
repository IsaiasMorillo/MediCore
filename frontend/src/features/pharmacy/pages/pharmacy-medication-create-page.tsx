import { ArrowLeft } from "lucide-react"
import { useNavigate, Link } from "react-router-dom"
import type { SubmitHandler } from "react-hook-form"

import { PageHeader } from "@/components/layout/page-header"
import { FormAlert } from "@/features/auth/components/form-controls"
import { MedicationForm, MedicationFormGuidance } from "@/features/pharmacy/components/medication-form"
import { useCreateMedication } from "@/features/pharmacy/hooks/use-pharmacy"
import type { MedicationFormValues } from "@/features/pharmacy/schemas/pharmacy-schemas"
import { getPharmacyErrorMessage } from "@/features/pharmacy/utils/pharmacy-errors"

export function PharmacyMedicationCreatePage() {
  const navigate = useNavigate()
  const createMutation = useCreateMedication()

  const handleSubmit: SubmitHandler<MedicationFormValues> = async (values) => {
    try {
      await createMutation.mutateAsync({
        category: values.category,
        code: values.code,
        expirationDate: values.expirationDate || null,
        name: values.name,
        price: values.price,
        reorderLevel: values.reorderLevel,
        stockQuantity: values.stockQuantity,
      })
      navigate("/app/pharmacy/medications", { replace: true })
    } catch {
      // The mutation state renders the server response below the page header.
    }
  }

  return (
    <div className="space-y-7">
      <Link className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-strong transition-colors hover:text-brand focus-visible:outline-none" to="/app/pharmacy/medications"><ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />Volver al inventario</Link>
      <PageHeader description="Registra una referencia de medicamento para que farmacia pueda controlar existencias, reposición y expiración." eyebrow="Operación · Nuevo medicamento" title="Registrar medicamento" />
      {createMutation.isError ? <FormAlert message={getPharmacyErrorMessage(createMutation.error, "No pudimos registrar el medicamento.")} /> : null}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
        <section className="rounded-[1.35rem] border border-line/80 bg-panel p-5 shadow-[0_20px_55px_-38px_var(--ink)] sm:p-6"><MedicationForm onSubmit={handleSubmit} serverError={null} /></section>
        <MedicationFormGuidance isEditing={false} />
      </div>
    </div>
  )
}
