import { ChevronRight, Home } from "lucide-react"
import { Link } from "react-router-dom"

import type { NavigationGroup, NavigationItem } from "@/lib/permissions/navigation"

export function Breadcrumbs({
  context,
}: {
  context?: { group: NavigationGroup; item: NavigationItem }
}) {
  return (
    <nav aria-label="Ruta de navegación" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1.5 text-xs text-ink-subtle">
        <li>
          <Link
            aria-label="Ir al dashboard"
            className="inline-flex items-center rounded-md p-1 transition-colors hover:bg-brand-soft hover:text-brand-strong"
            to="/app"
          >
            <Home aria-hidden="true" className="h-3.5 w-3.5" />
          </Link>
        </li>
        {context ? (
          <>
            <li aria-hidden="true">
              <ChevronRight className="h-3.5 w-3.5 text-line" />
            </li>
            <li className="truncate font-medium text-ink-muted">{context.group.label}</li>
            {context.item.path !== "/app" ? (
              <>
                <li aria-hidden="true">
                  <ChevronRight className="h-3.5 w-3.5 text-line" />
                </li>
                <li aria-current="page" className="truncate font-semibold text-ink">
                  {context.item.label}
                </li>
              </>
            ) : null}
          </>
        ) : null}
      </ol>
    </nav>
  )
}
