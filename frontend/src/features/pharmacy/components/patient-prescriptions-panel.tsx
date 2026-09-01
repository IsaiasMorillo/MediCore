import { ArrowUpRight, FilePlus2, Pill } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"

import { FormAlert, SuccessAlert } from "@/features/auth/components/form-controls"
import { PrescriptionDispenseDialog, PrescriptionList } from "@/features/pharmacy/components/prescription-list"
import { useDispensePrescription, usePatientPrescriptions } from "@/features/pharmacy/hooks/use-pharmacy"
import type { Prescription } from "@/features/pharmacy/types"
import { getPharmacyErrorMessage } from "@/features/pharmacy/utils/pharmacy-errors"
import { useAuthSession } from "@/lib/auth/use-auth-session"

export function PatientPrescriptionsPanel({ canCreate, canDispense, patientId }: { canCreate: boolean; canDispense: boolean; patientId: string }) {
  const { session } = useAuthSession()
  const prescriptionsQuery = usePatientPrescriptions(patientId)
  const dispenseMutation = useDispensePrescription()
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const prescriptions = prescriptionsQuery.data ?? []

  const handleConfirmDispense = async () => {
    if (!selectedPrescription) {
      return
    }

    try {
      await dispenseMutation.mutateAsync({ id: selectedPrescription.id, dispensedBy: session?.user.fullName || null })
      setSelectedPrescription(null)
      setSuccessMessage("La receta fue dispensada y el inventario se actualizó.")
    } catch {
      // The dialog keeps the failed operation visible so it can be retried.
    }
  }

  return (
    <section className="rounded-[1.35rem] border border-line/80 bg-panel p-5 shadow-[0_20px_55px_-38px_var(--ink)] sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-strong"><Pill aria-hidden="true" className="h-4 w-4" /></span><div><h2 className="font-display text-base font-semibold tracking-[-0.025em] text-ink">Recetas</h2><p className="mt-1 text-xs leading-5 text-ink-muted">Prescripciones emitidas y estado de dispensación de este paciente.</p></div></div>
        <div className="flex shrink-0 flex-wrap gap-2">{canCreate ? <Link className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-panel-raised px-3 py-2 text-xs font-semibold text-ink-muted transition-colors hover:border-brand/40 hover:text-ink" to={`/app/pharmacy/prescriptions?patientId=${encodeURIComponent(patientId)}&mode=new`}><FilePlus2 aria-hidden="true" className="h-3.5 w-3.5" />Crear receta</Link> : null}<Link className="inline-flex items-center gap-1.5 rounded-xl bg-brand-soft px-3 py-2 text-xs font-semibold text-brand-strong transition-colors hover:bg-brand-soft/70" to={`/app/pharmacy/prescriptions/patient/${encodeURIComponent(patientId)}`}>Ver recetas <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" /></Link></div>
      </div>
      {successMessage ? <div className="mt-5"><SuccessAlert message={successMessage} /></div> : null}
      {prescriptionsQuery.isPending ? <PrescriptionsPanelLoadingState /> : null}
      {prescriptionsQuery.isError ? <div className="mt-5"><FormAlert message={getPharmacyErrorMessage(prescriptionsQuery.error, "No pudimos cargar las recetas del paciente.")} /><button className="mt-4 rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-strong" onClick={() => void prescriptionsQuery.refetch()} type="button">Intentar nuevamente</button></div> : null}
      {!prescriptionsQuery.isPending && !prescriptionsQuery.isError ? <div className="mt-5"><PrescriptionList canDispense={canDispense} onDispense={(prescription) => { dispenseMutation.reset(); setSuccessMessage(null); setSelectedPrescription(prescription) }} prescriptions={prescriptions} /></div> : null}
      {selectedPrescription ? <PrescriptionDispenseDialog error={dispenseMutation.isError ? getPharmacyErrorMessage(dispenseMutation.error, "No pudimos dispensar la receta.") : null} isPending={dispenseMutation.isPending} onCancel={() => { dispenseMutation.reset(); setSelectedPrescription(null) }} onConfirm={() => void handleConfirmDispense()} prescription={selectedPrescription} /> : null}
    </section>
  )
}

function PrescriptionsPanelLoadingState() {
  return <div aria-busy="true" aria-live="polite" className="mt-5 space-y-3">{[0, 1].map((item) => <div className="h-44 animate-pulse rounded-2xl border border-line/70 bg-canvas/45" key={item} />)}</div>
}
