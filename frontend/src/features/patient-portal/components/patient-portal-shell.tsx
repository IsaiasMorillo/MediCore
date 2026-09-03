import { CalendarDays, FileText, FlaskConical, HeartPulse, House, LogOut, Pill } from "lucide-react"
import type { ReactNode } from "react"
import { Link, NavLink, Outlet } from "react-router-dom"

import { getUserInitials } from "@/lib/auth/session"
import { useAuthSession } from "@/lib/auth/use-auth-session"

const portalNavigation = [
  { label: "Inicio", path: "/portal", icon: House, end: true },
  { label: "Citas", path: "/portal/appointments", icon: CalendarDays, end: false },
  { label: "Recetas", path: "/portal/prescriptions", icon: Pill, end: false },
  { label: "Facturas", path: "/portal/invoices", icon: FileText, end: false },
  { label: "Resultados", path: "/portal/laboratory-results", icon: FlaskConical, end: false },
] as const

export function PatientPortalShell() {
  const { clearSession, session } = useAuthSession()

  if (!session) {
    return null
  }

  const firstName = session.user.fullName.trim().split(/\s+/)[0] || "Paciente"

  return (
    <div className="portal-shell min-h-screen text-ink">
      <header className="border-b border-line/70 bg-panel/80 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[4.75rem] max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link className="flex min-w-0 items-center gap-3" to="/portal">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand text-white shadow-[0_12px_24px_-16px_var(--brand)]">
              <HeartPulse aria-hidden="true" className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block font-display text-base font-semibold tracking-[-0.03em] text-ink">MediCore</span>
              <span className="block truncate text-[0.68rem] font-medium text-ink-muted">Portal del paciente</span>
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-2.5">
            <div className="hidden text-right sm:block">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-strong">Tu espacio de salud</p>
              <p className="mt-0.5 max-w-40 truncate text-xs text-ink-muted">Hola, {firstName}</p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand-strong">
              {getUserInitials(session.user.fullName)}
            </span>
            <button
              aria-label="Cerrar sesión"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-panel-raised text-ink-muted shadow-sm transition-colors hover:border-rose/35 hover:text-rose-strong"
              onClick={clearSession}
              title="Cerrar sesión"
              type="button"
            >
              <LogOut aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid min-h-[calc(100vh-4.75rem)] max-w-7xl lg:grid-cols-[14.5rem_minmax(0,1fr)] lg:gap-10 lg:px-8">
        <aside className="hidden border-r border-line/60 py-10 lg:block">
          <div className="sticky top-10 pr-5">
            <p className="px-3 text-[0.66rem] font-semibold uppercase tracking-[0.15em] text-ink-subtle">Mi salud</p>
            <nav aria-label="Navegación del portal" className="mt-3 space-y-1.5">
              {portalNavigation.map((item) => <PortalNavLink end={item.end} icon={<item.icon aria-hidden="true" className="h-4 w-4" />} key={item.path} label={item.label} path={item.path} />)}
            </nav>
            <div className="mt-10 rounded-2xl border border-brand/15 bg-brand-soft/55 p-4">
              <HeartPulse aria-hidden="true" className="h-4 w-4 text-brand-strong" />
              <p className="mt-3 text-xs font-semibold text-ink">Información protegida</p>
              <p className="mt-1 text-[0.68rem] leading-5 text-ink-muted">Consulta tus datos desde un espacio separado del área operativa.</p>
            </div>
          </div>
        </aside>

        <main className="min-w-0 px-4 pb-24 pt-6 sm:px-6 sm:pt-8 lg:px-0 lg:py-10">
          <Outlet />
        </main>
      </div>

      <nav aria-label="Navegación móvil del portal" className="fixed inset-x-0 bottom-0 z-30 border-t border-line/80 bg-panel/95 px-2 py-2 shadow-[0_-16px_35px_-28px_var(--ink)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
          {portalNavigation.map((item) => <PortalNavLink end={item.end} icon={<item.icon aria-hidden="true" className="h-4 w-4" />} key={item.path} label={item.label} path={item.path} mobile />)}
        </div>
      </nav>
    </div>
  )
}

function PortalNavLink({ end, icon, label, mobile = false, path }: { end: boolean; icon: ReactNode; label: string; mobile?: boolean; path: string }) {
  return (
    <NavLink
      aria-label={mobile ? label : undefined}
      className={({ isActive }) => mobile
        ? `flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[0.62rem] font-semibold transition-colors ${isActive ? "bg-brand-soft text-brand-strong" : "text-ink-subtle hover:bg-canvas hover:text-ink"}`
        : `flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors ${isActive ? "bg-brand-soft text-brand-strong" : "text-ink-muted hover:bg-canvas hover:text-ink"}`}
      end={end}
      to={path}
    >
      {icon}
      <span className={mobile ? "truncate" : undefined}>{label}</span>
    </NavLink>
  )
}
