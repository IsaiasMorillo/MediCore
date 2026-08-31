import { ChevronLeft, ChevronRight, Hospital, X } from "lucide-react"
import { NavLink } from "react-router-dom"

import { BrandMark } from "@/components/layout/brand-mark"
import type { NavigationGroup } from "@/lib/permissions/navigation"
import { cn } from "@/lib/utils"

interface SidebarProps {
  groups: readonly NavigationGroup[]
  collapsed?: boolean
  mobile?: boolean
  onClose?: () => void
}

export function Sidebar({ groups, collapsed = false, mobile = false, onClose }: SidebarProps) {
  const compact = collapsed && !mobile

  return (
    <div
      className={cn(
        "flex h-full min-h-screen flex-col border-r border-line/80 bg-panel/90 px-3 py-5 backdrop-blur-xl",
        mobile ? "w-[min(82vw,300px)]" : "w-full",
        compact ? "items-center" : "px-4"
      )}
    >
      <div className={cn("flex w-full items-center", compact ? "justify-center" : "justify-between") }>
        <BrandMark compact={compact} />
        {mobile ? (
          <button
            aria-label="Cerrar navegación"
            className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink focus-visible:outline-none"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      <div
        className={cn(
          "mt-8 flex w-full items-center rounded-2xl border border-line/70 bg-canvas/70 py-3",
          compact ? "justify-center px-2" : "gap-3 px-3"
        )}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-panel-raised text-brand-strong shadow-sm">
          <Hospital aria-hidden="true" className="h-4 w-4" />
        </span>
        {!compact ? (
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-ink">MediCore Hospital</p>
            <p className="truncate text-[0.68rem] text-ink-subtle">Área interna</p>
          </div>
        ) : null}
      </div>

      <nav
        aria-label="Navegación principal"
        className={cn("mt-8 w-full flex-1", compact ? "space-y-5" : "space-y-7")}
      >
        {groups.map((group) => (
          <div key={group.id}>
            {!compact ? (
              <p className="mb-2 px-3 text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-ink-subtle">
                {group.label}
              </p>
            ) : null}
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon

                return (
                  <NavLink
                    aria-label={compact ? item.label : undefined}
                    className={({ isActive }) =>
                      cn(
                        "group flex w-full items-center rounded-xl text-sm font-medium transition-colors focus-visible:outline-none",
                        compact ? "justify-center px-2.5 py-2.5" : "gap-3 px-3 py-2.5",
                        isActive
                          ? "bg-brand text-white shadow-[0_10px_22px_-15px_var(--brand)]"
                          : "text-ink-muted hover:bg-brand-soft/55 hover:text-ink"
                      )
                    }
                    end={item.path === "/app"}
                    key={item.id}
                    onClick={onClose}
                    title={compact ? item.label : undefined}
                    to={item.path}
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          aria-hidden="true"
                          className="h-[1.05rem] w-[1.05rem] shrink-0"
                          strokeWidth={isActive ? 2.2 : 1.9}
                        />
                        {!compact ? <span className="min-w-0 flex-1 truncate">{item.label}</span> : null}
                      </>
                    )}
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {!compact ? (
        <div className="mt-8 rounded-2xl bg-ink px-3.5 py-3.5 text-white">
          <p className="text-xs font-semibold">Espacio de trabajo protegido</p>
          <p className="mt-1 text-[0.7rem] leading-5 text-white/60">
            Los permisos de tu cuenta determinan las secciones disponibles.
          </p>
          <div className="mt-3 flex items-center gap-2 text-[0.67rem] text-white/60">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            <span>Acceso controlado por rol</span>
          </div>
        </div>
      ) : null}

      {!mobile && !compact ? (
        <div className="mt-4 flex items-center gap-2 border-t border-line/80 px-2 pt-4 text-[0.68rem] text-ink-subtle">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-soft text-brand-strong">
            <Hospital aria-hidden="true" className="h-3.5 w-3.5" />
          </span>
          <span>MediCore · Área interna</span>
        </div>
      ) : null}
    </div>
  )
}

export function SidebarToggle({
  collapsed,
  onClick,
}: {
  collapsed: boolean
  onClick: () => void
}) {
  const Icon = collapsed ? ChevronRight : ChevronLeft

  return (
    <button
      aria-label={collapsed ? "Expandir navegación" : "Colapsar navegación"}
      aria-pressed={collapsed}
      className="hidden h-9 w-9 items-center justify-center rounded-xl border border-line bg-panel-raised text-ink-muted shadow-sm transition-colors hover:border-brand/40 hover:text-ink focus-visible:outline-none lg:inline-flex"
      onClick={onClick}
      type="button"
    >
      <Icon aria-hidden="true" className="h-4 w-4" />
    </button>
  )
}
