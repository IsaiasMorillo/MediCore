import { Menu } from "lucide-react"
import type { RefObject } from "react"

import { Breadcrumbs } from "@/components/layout/breadcrumbs"
import { CommandSearch } from "@/components/layout/command-search"
import { RoleBadge } from "@/components/layout/role-badge"
import { SidebarToggle } from "@/components/layout/sidebar"
import { UserMenu } from "@/components/layout/user-menu"
import type { AuthSession } from "@/lib/auth/session"
import type { NavigationGroup } from "@/lib/permissions/navigation"
import { ROLE_LABELS } from "@/lib/permissions/roles"

export function Topbar({
  groups,
  context,
  session,
  sidebarCollapsed,
  mobileNavOpen,
  onToggleSidebar,
  onOpenMobileNav,
  mobileMenuButtonRef,
  onLogout,
}: {
  groups: readonly NavigationGroup[]
  context?: ReturnType<typeof import("@/lib/permissions/navigation").findNavigationItem>
  session: AuthSession
  sidebarCollapsed: boolean
  mobileNavOpen: boolean
  onToggleSidebar: () => void
  onOpenMobileNav: () => void
  mobileMenuButtonRef: RefObject<HTMLButtonElement | null>
  onLogout: () => void
}) {
  const primaryRole = session.user.roles[0]

  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-panel/80 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[4.75rem] max-w-[1680px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          aria-label="Abrir navegación"
          aria-expanded={mobileNavOpen}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-panel-raised text-ink-muted shadow-sm transition-colors hover:border-brand/40 hover:text-ink focus-visible:outline-none lg:hidden"
          onClick={onOpenMobileNav}
          ref={mobileMenuButtonRef}
          type="button"
        >
          <Menu aria-hidden="true" className="h-5 w-5" />
        </button>
        <SidebarToggle collapsed={sidebarCollapsed} onClick={onToggleSidebar} />
        <div className="min-w-0 flex-1">
          <Breadcrumbs context={context} />
        </div>
        <div className="flex items-center gap-2.5">
          <div className="hidden xl:block">
            {primaryRole ? <RoleBadge role={primaryRole} /> : null}
          </div>
          <CommandSearch groups={groups} />
          <UserMenu onLogout={onLogout} session={session} />
        </div>
      </div>
      <p className="sr-only">
        Sesión activa de {session.user.fullName}
        {primaryRole ? `, rol ${ROLE_LABELS[primaryRole]}` : ""}.
      </p>
    </header>
  )
}
