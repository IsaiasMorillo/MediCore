import { motion, useReducedMotion } from "motion/react"

import { PageHeader } from "@/components/layout/page-header"
import { PortalAppointmentsPanel, PortalInvoicesPanel, PortalLaboratoryPanel, PortalPrescriptionsPanel } from "@/features/patient-portal/components/portal-panels"
import { PortalOverview } from "@/features/patient-portal/components/portal-overview"
import { PortalPageLoadingState, PortalPrivacyNote, PortalRefreshButton, PortalUnlinkedState } from "@/features/patient-portal/components/portal-states"
import { usePatientPortal } from "@/features/patient-portal/hooks/use-patient-portal"
import type { PortalSection } from "@/features/patient-portal/types"
import { getPortalFirstName } from "@/features/patient-portal/utils/patient-portal-formatting"
import { useAuthSession } from "@/lib/auth/use-auth-session"

const pageCopy: Record<PortalSection, { description: string; eyebrow: string; title: string }> = {
  overview: {
    description: "Revisa tus citas, tratamientos, facturas y resultados desde un espacio pensado para ti.",
    eyebrow: "MediCore · Portal del paciente",
    title: "Tu portal de salud",
  },
  appointments: {
    description: "Consulta cuándo y con quién es tu próxima visita. Este portal no permite cancelar ni reprogramar citas.",
    eyebrow: "Mi salud · Citas",
    title: "Mis próximas citas",
  },
  prescriptions: {
    description: "Encuentra tus tratamientos activos y las indicaciones registradas por tu equipo médico.",
    eyebrow: "Mi salud · Tratamientos",
    title: "Mis recetas activas",
  },
  invoices: {
    description: "Consulta tus facturas, pagos registrados y saldos pendientes en modo de solo lectura.",
    eyebrow: "Mi salud · Documentos",
    title: "Mis facturas",
  },
  "laboratory-results": {
    description: "Revisa los resultados disponibles tal como fueron cargados por el laboratorio, sin interpretación clínica.",
    eyebrow: "Mi salud · Resultados",
    title: "Resultados de laboratorio",
  },
}

export function PatientPortalPage({ section }: { section: PortalSection }) {
  const { session } = useAuthSession()
  const shouldReduceMotion = useReducedMotion()
  const portal = usePatientPortal(section)

  if (!session) {
    return null
  }

  if (portal.isUnlinked) {
    return <PortalUnlinkedState />
  }

  if (portal.isInitialLoading) {
    return <PortalPageLoadingState />
  }

  const copy = pageCopy[section]
  const lastUpdatedLabel = portal.lastUpdatedAt ? `Actualizado ${formatTime(portal.lastUpdatedAt)}` : "Datos bajo demanda"

  return (
    <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }} transition={{ duration: 0.3, ease: "easeOut" }}>
      <PageHeader
        actions={
          <>
            <span aria-live="polite" className="hidden text-[0.68rem] text-ink-subtle sm:inline">{portal.isFetching ? "Actualizando información..." : lastUpdatedLabel}</span>
            <PortalRefreshButton isFetching={portal.isFetching} onRefresh={() => void portal.refresh()} />
          </>
        }
        description={section === "overview" ? `${copy.description} Hola, ${getPortalFirstName(session.user.fullName)}.` : copy.description}
        eyebrow={copy.eyebrow}
        title={copy.title}
      />

      <div className="mt-7">
        <PortalContent portal={portal} section={section} fullName={session.user.fullName} />
      </div>
      <PortalPrivacyNote />
    </motion.div>
  )
}

function PortalContent({ fullName, portal, section }: { fullName: string; portal: ReturnType<typeof usePatientPortal>; section: PortalSection }) {
  if (section === "overview") {
    return <PortalOverview fullName={fullName} portal={portal} />
  }

  if (section === "appointments") {
    return <PortalAppointmentsPanel query={portal.appointments} />
  }

  if (section === "prescriptions") {
    return <PortalPrescriptionsPanel query={portal.prescriptions} />
  }

  if (section === "invoices") {
    return <PortalInvoicesPanel query={portal.invoices} />
  }

  return <PortalLaboratoryPanel query={portal.laboratoryResults} />
}

function formatTime(timestamp: number) {
  return new Intl.DateTimeFormat("es-DO", { hour: "2-digit", minute: "2-digit" }).format(timestamp)
}
