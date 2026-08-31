import { ChevronDown, LogOut, UserRound } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { RoleBadge } from "@/components/layout/role-badge"
import { getUserInitials, type AuthSession } from "@/lib/auth/session"
import { ROLE_LABELS } from "@/lib/permissions/roles"

export function UserMenu({
  session,
  onLogout,
}: {
  session: AuthSession
  onLogout: () => void
}) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const primaryRole = session.user.roles[0]

  useEffect(() => {
    if (!open) {
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
      }
    }

    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open])

  return (
    <div className="relative" ref={menuRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-2 rounded-xl border border-line bg-panel-raised px-2 py-1.5 text-left transition-colors hover:border-brand/40 focus-visible:outline-none sm:gap-2.5 sm:pr-3"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-[0.65rem] font-bold text-brand-strong">
          {getUserInitials(session.user.fullName)}
        </span>
        <span className="hidden min-w-0 sm:block">
          <span className="block max-w-[9rem] truncate text-xs font-semibold text-ink">
            {session.user.fullName}
          </span>
          <span className="mt-0.5 block max-w-[9rem] truncate text-[0.66rem] text-ink-subtle">
            {primaryRole ? ROLE_LABELS[primaryRole] : "Personal interno"}
          </span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className="hidden h-3.5 w-3.5 text-ink-subtle sm:block"
        />
      </button>

      {open ? (
        <div
          aria-label="Menú de usuario"
          className="absolute right-0 top-[calc(100%+0.6rem)] z-50 w-64 rounded-2xl border border-line/80 bg-panel-raised p-2 shadow-[0_20px_45px_-24px_var(--ink)]"
          role="menu"
        >
          <div className="border-b border-line/70 px-3 pb-3 pt-2">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand-strong">
                {getUserInitials(session.user.fullName)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{session.user.fullName}</p>
                <p className="truncate text-xs text-ink-muted">{session.user.email}</p>
              </div>
            </div>
            {primaryRole ? (
              <div className="mt-3">
                <RoleBadge role={primaryRole} />
              </div>
            ) : null}
          </div>
          <div className="pt-2">
            <button
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-ink-muted transition-colors hover:bg-brand-soft/60 hover:text-ink focus-visible:outline-none"
              onClick={() => {
                setOpen(false)
                onLogout()
              }}
              role="menuitem"
              type="button"
            >
              <LogOut aria-hidden="true" className="h-4 w-4" />
              Cerrar sesión
            </button>
            <div className="flex items-center gap-2.5 px-3 py-2 text-xs text-ink-subtle">
              <UserRound aria-hidden="true" className="h-4 w-4" />
              Sesión protegida
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
