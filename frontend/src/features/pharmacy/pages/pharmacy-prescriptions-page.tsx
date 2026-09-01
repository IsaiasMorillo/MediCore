import { ArrowLeft, ClipboardList, FilePlus2, RefreshCw, Search, UserRound } from "lucide-react"
import { useState } from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"

import { PageHeader } from "@/components/layout/page-header"
import { FormAlert, SuccessAlert } from "@/features/auth/components/form-controls"
import { PrescriptionDispenseDialog, PrescriptionList } from "@/features/pharmacy/components/prescription-list"
import { PrescriptionForm } from "@/features/pharmacy/components/prescription-form"
import { useCreatePrescription, useDispensePrescription, usePatientPrescriptions, useMedications } from "@/features/pharmacy/hooks/use-pharmacy"
import { useDoctors } from "@/features/doctors/hooks/use-doctors"
import type { Prescription } from "@/features/pharmacy/types"
import type { PrescriptionFormValues } from "@/features/pharmacy/schemas/pharmacy-schemas"
import { getPharmacyErrorMessage } from "@/features/pharmacy/utils/pharmacy-errors"
import { formatPatientName } from "@/features/patients/utils/patient-formatting"
import { usePatients } from "@/features/patients/hooks/use-patients"
import { hasAnyRole } from "@/lib/permissions/roles"
import { PHARMACY_MANAGE_ROLES, PRESCRIPTION_WRITE_ROLES } from "@/lib/permissions/route-roles"
import { useAuthSession } from "@/lib/auth/use-auth-session"

export function PharmacyPrescriptionsPage() {
  const { session } = useAuthSession()
  const navigate = useNavigate()
  const { patientId: routePatientId } = useParams()
  const [searchParams] = useSearchParams()
  const initialPatientId = routePatientId?.trim() || searchParams.get("patientId")?.trim() || ""
  const initialMedicalRecordId = searchParams.get("medicalRecordId")?.trim() || undefined
  const [patientSearch, setPatientSearch] = useState("")
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId)
  const [isComposerOpen, setIsComposerOpen] = useState(searchParams.get("mode") === "new")
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const patientsQuery = usePatients("")
  const prescriptionsQuery = usePatientPrescriptions(selectedPatientId)
  const dispenseMutation = useDispensePrescription()
  const canCreate = session ? hasAnyRole(session.user.roles, PRESCRIPTION_WRITE_ROLES) : false
  const canDispense = session ? hasAnyRole(session.user.roles, PHARMACY_MANAGE_ROLES) : false
  const activePatients = (patientsQuery.data ?? []).filter((patient) => patient.isActive)
  const selectedPatient = (patientsQuery.data ?? []).find((patient) => patient.id === selectedPatientId)
  const normalizedSearch = patientSearch.trim().toLocaleLowerCase("es")
  const matchingPatients = activePatients.filter((patient) => `${formatPatientName(patient)} ${patient.personalData.documentId}`.toLocaleLowerCase("es").includes(normalizedSearch))
  const patientOptions = selectedPatient && !matchingPatients.some((patient) => patient.id === selectedPatient.id) ? [selectedPatient, ...matchingPatients] : matchingPatients
  const prescriptions = prescriptionsQuery.data ?? []

  const handlePatientChange = (patientId: string) => {
    setSelectedPatientId(patientId)
    setSuccessMessage(null)
    setIsComposerOpen(false)
    if (routePatientId) {
      navigate(patientId ? `/app/pharmacy/prescriptions?patientId=${encodeURIComponent(patientId)}` : "/app/pharmacy/prescriptions", { replace: true })
    }
  }

  const handleConfirmDispense = async () => {
    if (!selectedPrescription) {
      return
    }

    try {
      await dispenseMutation.mutateAsync({ id: selectedPrescription.id, dispensedBy: session?.user.fullName || null })
      setSelectedPrescription(null)
      setSuccessMessage("La receta fue dispensada y el inventario se actualizó.")
    } catch {
      // The dialog remains open so pharmacy can retry after a conflict.
    }
  }

  return (
    <div className="space-y-7">
      {routePatientId ? <Link className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-strong transition-colors hover:text-brand focus-visible:outline-none" to={`/app/patients/${encodeURIComponent(routePatientId)}`}><ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />Volver al paciente</Link> : null}
      <PageHeader actions={canCreate ? <button className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_-16px_var(--brand)] transition-colors hover:bg-brand-strong" onClick={() => { setSuccessMessage(null); setIsComposerOpen(true) }} type="button"><FilePlus2 aria-hidden="true" className="h-4 w-4" />Nueva receta</button> : null} description="Consulta recetas por paciente. MediCore no simula una cola global que la API todavía no expone." eyebrow="Operación · Farmacia" title="Prescripciones" />

      <section className="rounded-[1.35rem] border border-line/80 bg-panel p-4 shadow-[0_20px_55px_-38px_var(--ink)] sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-brand-strong">Contexto de consulta</p><h2 className="mt-1.5 font-display text-lg font-semibold tracking-[-0.035em] text-ink">Localiza las recetas de un paciente</h2><p className="mt-1 max-w-2xl text-xs leading-5 text-ink-muted">Selecciona un paciente para ver sus recetas emitidas y su estado de dispensación.</p></div><div className="grid w-full gap-3 sm:grid-cols-2 lg:max-w-[34rem]"><label><span className="mb-2 block text-xs font-semibold text-ink">Buscar paciente</span><div className="relative"><Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" /><input aria-label="Buscar paciente en farmacia" className="h-11 w-full rounded-xl border border-line bg-panel-raised pl-10 pr-3.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-brand/60 focus:ring-2 focus:ring-brand/10" onChange={(event) => setPatientSearch(event.target.value)} placeholder="Nombre o documento" type="search" value={patientSearch} /></div></label><label><span className="mb-2 block text-xs font-semibold text-ink">Paciente</span><select aria-label="Paciente para recetas" className="h-11 w-full rounded-xl border border-line bg-panel-raised px-3.5 text-sm text-ink outline-none transition-colors focus:border-brand/60 focus:ring-2 focus:ring-brand/10" onChange={(event) => handlePatientChange(event.target.value)} value={selectedPatientId}><option value="">Selecciona un paciente</option>{patientOptions.map((patient) => <option key={patient.id} value={patient.id}>{formatPatientName(patient)} · {patient.personalData.documentId}</option>)}{patientOptions.length === 0 ? <option disabled value="">No encontramos pacientes activos</option> : null}</select></label></div></div>
        {patientsQuery.isPending ? <p aria-live="polite" className="mt-4 text-xs text-ink-subtle">Cargando pacientes...</p> : null}
        {patientsQuery.isError ? <div className="mt-4 space-y-3"><FormAlert message={getPharmacyErrorMessage(patientsQuery.error, "No pudimos cargar los pacientes.")} /><button className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-strong" onClick={() => void patientsQuery.refetch()} type="button"><RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />Intentar nuevamente</button></div> : null}
      </section>

      {isComposerOpen && canCreate ? <PrescriptionComposer initialMedicalRecordId={selectedPatientId === initialPatientId ? initialMedicalRecordId : undefined} initialPatientId={selectedPatientId} onCancel={() => setIsComposerOpen(false)} onCreated={() => { setIsComposerOpen(false); setSuccessMessage("La receta fue emitida correctamente.") }} patients={patientsQuery.data ?? []} /> : null}
      {successMessage ? <SuccessAlert message={successMessage} /> : null}
      {!selectedPatientId ? <PrescriptionPrompt canCreate={canCreate} onCreate={() => setIsComposerOpen(true)} /> : null}
      {selectedPatientId && prescriptionsQuery.isPending ? <PrescriptionsLoadingState /> : null}
      {selectedPatientId && prescriptionsQuery.isError ? <section className="rounded-[1.35rem] border border-rose/20 bg-rose-soft/45 p-5" role="alert"><FormAlert message={getPharmacyErrorMessage(prescriptionsQuery.error, "No pudimos cargar las recetas del paciente.")} /><button className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-strong" onClick={() => void prescriptionsQuery.refetch()} type="button"><RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />Intentar nuevamente</button></section> : null}
      {selectedPatientId && !prescriptionsQuery.isPending && !prescriptionsQuery.isError ? <section aria-labelledby="pharmacy-prescriptions-title" className="space-y-4"><div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><div className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-brand-strong"><UserRound aria-hidden="true" className="h-3.5 w-3.5" />{selectedPatient ? formatPatientName(selectedPatient) : "Paciente seleccionado"}</div><h2 className="mt-1.5 font-display text-lg font-semibold tracking-[-0.035em] text-ink" id="pharmacy-prescriptions-title">Recetas del paciente</h2></div><p className="text-xs text-ink-muted">{prescriptions.length} receta{prescriptions.length === 1 ? "" : "s"}</p></div><PrescriptionList canDispense={canDispense} onDispense={(prescription) => { dispenseMutation.reset(); setSuccessMessage(null); setSelectedPrescription(prescription) }} prescriptions={prescriptions} /></section> : null}
      {selectedPrescription ? <PrescriptionDispenseDialog error={dispenseMutation.isError ? getPharmacyErrorMessage(dispenseMutation.error, "No pudimos dispensar la receta.") : null} isPending={dispenseMutation.isPending} onCancel={() => { dispenseMutation.reset(); setSelectedPrescription(null) }} onConfirm={() => void handleConfirmDispense()} prescription={selectedPrescription} /> : null}
    </div>
  )
}

function PrescriptionComposer({ initialMedicalRecordId, initialPatientId, onCancel, onCreated, patients }: { initialMedicalRecordId?: string; initialPatientId?: string; onCancel: () => void; onCreated: () => void; patients: ReturnType<typeof usePatients>["data"] }) {
  const doctorsQuery = useDoctors({})
  const medicationsQuery = useMedications("")
  const createMutation = useCreatePrescription()
  const hasResourceError = doctorsQuery.isError || medicationsQuery.isError
  const isLoadingResources = doctorsQuery.isPending || medicationsQuery.isPending

  const handleSubmit = async (values: PrescriptionFormValues) => {
    try {
      await createMutation.mutateAsync({
        dosage: values.dosage,
        doctorId: values.doctorId,
        frequency: values.frequency,
        instructions: values.instructions,
        medicalRecordId: values.medicalRecordId || null,
        medicationId: values.medicationId,
        patientId: values.patientId,
        quantity: values.quantity,
      })
      onCreated()
    } catch {
      // The mutation state renders the server response in this composer.
    }
  }

  return <section className="rounded-[1.35rem] border border-line/80 bg-panel p-5 shadow-[0_20px_55px_-38px_var(--ink)] sm:p-6"><div className="mb-5 flex items-start justify-between gap-4"><div><p className="text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-brand-strong">Médico · Nueva prescripción</p><h2 className="mt-1.5 font-display text-lg font-semibold tracking-[-0.035em] text-ink">Emitir receta</h2><p className="mt-1 text-xs leading-5 text-ink-muted">Completa las indicaciones y verifica el paciente antes de emitir.</p></div><button aria-label="Cerrar formulario de receta" className="rounded-lg px-2 py-1 text-sm font-semibold text-ink-subtle transition-colors hover:bg-canvas hover:text-ink" onClick={onCancel} type="button">Cerrar</button></div>{createMutation.isError ? <div className="mb-5"><FormAlert message={getPharmacyErrorMessage(createMutation.error, "No pudimos emitir la receta.")} /></div> : null}{isLoadingResources ? <ComposerLoadingState /> : null}{hasResourceError ? <ComposerErrorState message={getPharmacyErrorMessage(doctorsQuery.error ?? medicationsQuery.error, "No pudimos cargar los recursos para crear la receta.")} onRetry={() => void Promise.all([doctorsQuery.refetch(), medicationsQuery.refetch()])} /> : null}{!isLoadingResources && !hasResourceError ? <PrescriptionForm doctors={doctorsQuery.data ?? []} initialMedicalRecordId={initialMedicalRecordId} initialPatientId={initialPatientId} medications={medicationsQuery.data ?? []} onSubmit={handleSubmit} patients={patients ?? []} serverError={null} /> : null}</section>
}

function PrescriptionPrompt({ canCreate, onCreate }: { canCreate: boolean; onCreate: () => void }) {
  return <div className="flex min-h-56 flex-col items-center justify-center rounded-[1.35rem] border border-dashed border-line px-6 py-12 text-center"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand-strong"><ClipboardList aria-hidden="true" className="h-5 w-5" /></span><p className="mt-5 text-sm font-semibold text-ink">Selecciona un paciente para consultar sus recetas</p><p className="mt-1 max-w-md text-xs leading-5 text-ink-muted">La consulta por paciente reemplaza una cola global hasta que el backend exponga un endpoint para ella.</p>{canCreate ? <button className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-strong" onClick={onCreate} type="button"><FilePlus2 aria-hidden="true" className="h-3.5 w-3.5" />Emitir receta</button> : null}</div>
}

function PrescriptionsLoadingState() {
  return <div aria-busy="true" aria-live="polite" className="space-y-3">{[0, 1].map((item) => <div className="h-44 animate-pulse rounded-2xl border border-line/70 bg-panel" key={item} />)}</div>
}

function ComposerLoadingState() {
  return <div aria-busy="true" aria-live="polite" className="space-y-3"><div className="h-24 animate-pulse rounded-2xl border border-line/70 bg-canvas/45" /><div className="h-56 animate-pulse rounded-2xl border border-line/70 bg-canvas/45" /></div>
}

function ComposerErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="rounded-2xl border border-rose/20 bg-rose-soft/45 p-4" role="alert"><FormAlert message={message} /><button className="mt-4 rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-strong" onClick={onRetry} type="button">Intentar nuevamente</button></div>
}
