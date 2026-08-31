import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { useEffect, useRef, useState } from "react"
import { Outlet, useLocation } from "react-router-dom"

import { Topbar } from "@/components/layout/topbar"
import { Sidebar } from "@/components/layout/sidebar"
import { useAuthSession } from "@/lib/auth/use-auth-session"
import {
  findNavigationItem,
  getVisibleNavigation,
} from "@/lib/permissions/navigation"

export function InternalAppShell() {
  const { session, clearSession } = useAuthSession()
  const location = useLocation()
  const shouldReduceMotion = useReducedMotion()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const mobileSidebarRef = useRef<HTMLElement | null>(null)
  const mobileMenuButtonRef = useRef<HTMLButtonElement | null>(null)
  const visibleGroups = getVisibleNavigation(session?.user.roles ?? [])
  const context = findNavigationItem(location.pathname)

  useEffect(() => {
    if (!mobileNavOpen) {
      if (mobileSidebarRef.current === null) {
        return
      }

      mobileMenuButtonRef.current?.focus()
      return
    }

    const container = mobileSidebarRef.current

    if (!container) {
      return
    }

    const previouslyFocused = document.activeElement as HTMLElement | null
    const getFocusableElements = () =>
      Array.from(
        container.querySelectorAll<HTMLElement>(
          "button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex='-1'])"
        )
      )
    const focusable = getFocusableElements()
    focusable[0]?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileNavOpen(false)
        return
      }

      if (event.key !== "Tab") {
        return
      }

      const currentFocusable = getFocusableElements()
      const first = currentFocusable[0]
      const last = currentFocusable[currentFocusable.length - 1]

      if (!first || !last) {
        return
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      if (mobileNavOpen) {
        previouslyFocused?.focus()
      }
    }
  }, [mobileNavOpen])

  if (!session) {
    return null
  }

  return (
    <div className="dashboard-shell min-h-screen text-ink">
      <div className="flex min-h-screen">
        <aside
          aria-label="Navegación lateral"
          className={sidebarCollapsed ? "hidden w-[80px] shrink-0 lg:flex" : "hidden w-[252px] shrink-0 lg:flex"}
        >
          <Sidebar collapsed={sidebarCollapsed} groups={visibleGroups} />
        </aside>

        <AnimatePresence>
          {mobileNavOpen ? (
            <>
              <motion.button
                aria-label="Cerrar navegación"
                className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-sm lg:hidden"
                exit={{ opacity: 0 }}
                initial={{ opacity: shouldReduceMotion ? 1 : 0 }}
                onClick={() => setMobileNavOpen(false)}
                type="button"
              />
              <motion.aside
                animate={{ x: 0 }}
                aria-label="Navegación móvil"
                className="fixed inset-y-0 left-0 z-50 lg:hidden"
                data-mobile-sidebar="true"
                exit={{ x: shouldReduceMotion ? 0 : "-100%" }}
                initial={{ x: shouldReduceMotion ? 0 : "-100%" }}
                ref={mobileSidebarRef}
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : { damping: 30, stiffness: 320, type: "spring" }
                }
              >
                <Sidebar groups={visibleGroups} mobile onClose={() => setMobileNavOpen(false)} />
              </motion.aside>
            </>
          ) : null}
        </AnimatePresence>

        <main className="min-w-0 flex-1">
          <Topbar
            context={context}
            groups={visibleGroups}
            mobileMenuButtonRef={mobileMenuButtonRef}
            mobileNavOpen={mobileNavOpen}
            onLogout={clearSession}
            onOpenMobileNav={() => setMobileNavOpen(true)}
            onToggleSidebar={() => setSidebarCollapsed((current) => !current)}
            session={session}
            sidebarCollapsed={sidebarCollapsed}
          />
          <div className="mx-auto max-w-[1680px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
