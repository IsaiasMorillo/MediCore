import {
  AlertTriangle,
  ArrowLeft,
  CircleAlert,
  HeartPulse,
  LockKeyhole,
  RefreshCw,
} from "lucide-react"
import { Component, type ReactNode } from "react"
import { Link } from "react-router-dom"

import { BrandMark } from "@/components/layout/brand-mark"

interface StateCardProps {
  icon: ReactNode
  eyebrow: string
  title: string
  description: string
  action?: ReactNode
}

function StateCard({ icon, eyebrow, title, description, action }: StateCardProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-5 py-10">
      <section className="w-full max-w-md rounded-[1.35rem] border border-line/80 bg-panel p-7 text-center shadow-[0_20px_55px_-38px_var(--ink)] sm:p-9">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand-strong">
          {icon}
        </div>
        <p className="mt-6 text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-brand-strong">
          {eyebrow}
        </p>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-[-0.045em] text-ink">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-6 text-ink-muted">{description}</p>
        {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
      </section>
    </main>
  )
}

export function RouteLoadingState() {
  return (
    <main
      aria-live="polite"
      aria-busy="true"
      className="flex min-h-screen items-center justify-center bg-canvas px-5"
    >
      <div className="flex items-center gap-3 rounded-2xl border border-line/80 bg-panel px-5 py-4 text-sm font-medium text-ink-muted shadow-sm">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-soft text-brand-strong">
          <HeartPulse aria-hidden="true" className="h-4 w-4" />
        </span>
        Cargando MediCore...
      </div>
    </main>
  )
}

export function PermissionDenied({
  title = "Acceso restringido",
  description = "Tu cuenta no tiene permisos para consultar esta sección.",
}: {
  title?: string
  description?: string
}) {
  return (
    <StateCard
      action={
        <Link
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_-16px_var(--brand)] transition-colors hover:bg-brand-strong"
          to="/app"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Volver al dashboard
        </Link>
      }
      description={description}
      eyebrow="Permisos"
      icon={<LockKeyhole aria-hidden="true" className="h-5 w-5" />}
      title={title}
    />
  )
}

export function NotFoundPage() {
  return (
    <StateCard
      action={
        <Link
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_-16px_var(--brand)] transition-colors hover:bg-brand-strong"
          to="/app"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Ir al dashboard
        </Link>
      }
      description="La dirección que intentaste abrir no existe o ya no está disponible."
      eyebrow="404"
      icon={<CircleAlert aria-hidden="true" className="h-5 w-5" />}
      title="Página no encontrada"
    />
  )
}

export function LoginRequiredPage() {
  return (
    <main className="min-h-screen bg-canvas px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col justify-between gap-12">
        <BrandMark />
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.65fr)] lg:items-center">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-brand-strong">
              Área interna
            </p>
            <h1 className="mt-3 max-w-xl font-display text-[clamp(2.2rem,5vw,4.5rem)] font-semibold leading-[0.98] tracking-[-0.065em] text-ink">
              Tu jornada clínica, en un solo lugar.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-ink-muted">
              Necesitas una sesión activa para acceder a las operaciones de MediCore.
              La pantalla de inicio de sesión se incorporará en el módulo de autenticación.
            </p>
          </div>
          <section className="rounded-[1.5rem] border border-line/80 bg-panel p-7 shadow-[0_20px_55px_-38px_var(--ink)] sm:p-9">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-white shadow-[0_12px_24px_-16px_var(--brand)]">
              <HeartPulse aria-hidden="true" className="h-6 w-6" />
            </div>
            <h2 className="mt-6 font-display text-xl font-semibold tracking-[-0.04em] text-ink">
              Inicio de sesión pendiente
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink-muted">
              No se ha enviado ninguna credencial. Regresa aquí cuando el módulo de acceso esté disponible.
            </p>
          </section>
        </div>
        <p className="text-xs text-ink-subtle">MediCore · Operaciones clínicas</p>
      </div>
    </main>
  )
}

export function PatientPortalPendingPage() {
  return (
    <StateCard
      description="El portal del paciente se habilitará en su módulo correspondiente. La cuenta no puede usar el área interna."
      eyebrow="Portal del paciente"
      icon={<HeartPulse aria-hidden="true" className="h-5 w-5" />}
      title="Portal en preparación"
    />
  )
}

export function GlobalErrorBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>
}

interface ErrorBoundaryState {
  hasError: boolean
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch() {
    // Keep unexpected runtime details out of the UI and avoid logging tokens or claims.
  }

  render() {
    if (this.state.hasError) {
      return (
        <StateCard
          action={
            <button
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_-16px_var(--brand)] transition-colors hover:bg-brand-strong"
              onClick={() => window.location.reload()}
              type="button"
            >
              <RefreshCw aria-hidden="true" className="h-4 w-4" />
              Recargar aplicación
            </button>
          }
          description="MediCore encontró un problema inesperado. Recarga la aplicación para intentar continuar."
          eyebrow="Error inesperado"
          icon={<AlertTriangle aria-hidden="true" className="h-5 w-5" />}
          title="No pudimos mostrar esta pantalla"
        />
      )
    }

    return this.props.children
  }
}
