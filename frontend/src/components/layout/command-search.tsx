import { Command, Search, X } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"

import type { NavigationGroup } from "@/lib/permissions/navigation"

export function CommandSearch({ groups }: { groups: readonly NavigationGroup[] }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const items = useMemo(
    () => groups.flatMap((group) => group.items.map((item) => ({ group, item }))),
    [groups]
  )
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const filteredItems = items.filter(({ group, item }) => {
    if (!normalizedQuery) {
      return true
    }

    return `${group.label} ${item.label} ${item.description}`
      .toLocaleLowerCase()
      .includes(normalizedQuery)
  })

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setOpen(true)
      }
    }

    document.addEventListener("keydown", handleShortcut)
    return () => document.removeEventListener("keydown", handleShortcut)
  }, [])

  useEffect(() => {
    if (!open) {
      return
    }

    const previouslyFocused = document.activeElement as HTMLElement | null
    inputRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
        return
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return
      }

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          "button:not([disabled]), input:not([disabled]), a[href]"
        )
      )

      if (focusable.length === 0) {
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

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
      previouslyFocused?.focus()
    }
  }, [open])

  return (
    <>
      <button
        aria-label="Abrir búsqueda de navegación"
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-panel-raised px-3 text-ink-muted shadow-sm transition-colors hover:border-brand/40 hover:text-ink focus-visible:outline-none sm:min-w-[12rem] sm:justify-between"
        onClick={() => setOpen(true)}
        ref={triggerRef}
        type="button"
      >
        <span className="inline-flex items-center gap-2">
          <Search aria-hidden="true" className="h-4 w-4" />
          <span className="hidden text-xs sm:inline">Buscar sección</span>
        </span>
        <kbd className="hidden items-center gap-0.5 rounded-md border border-line bg-canvas px-1.5 py-0.5 text-[0.62rem] font-semibold text-ink-subtle sm:inline-flex">
          <Command aria-hidden="true" className="h-3 w-3" />K
        </kbd>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[70] flex items-start justify-center bg-ink/25 px-4 pt-[12vh] backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setOpen(false)
            }
          }}
        >
          <div
            aria-label="Búsqueda de navegación"
            aria-modal="true"
            className="w-full max-w-xl overflow-hidden rounded-[1.35rem] border border-line/80 bg-panel-raised shadow-[0_30px_80px_-35px_var(--ink)]"
            ref={dialogRef}
            role="dialog"
          >
            <div className="flex items-center gap-3 border-b border-line/70 px-4">
              <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-ink-subtle" />
              <label className="sr-only" htmlFor="command-search-input">
                Buscar sección
              </label>
              <input
                autoComplete="off"
                className="h-14 min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
                id="command-search-input"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar una sección..."
                ref={inputRef}
                type="search"
                value={query}
              />
              <button
                aria-label="Cerrar búsqueda"
                className="rounded-lg p-1.5 text-ink-subtle transition-colors hover:bg-canvas hover:text-ink focus-visible:outline-none"
                onClick={() => setOpen(false)}
                type="button"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[min(60vh,26rem)] overflow-y-auto p-2">
              {filteredItems.length > 0 ? (
                filteredItems.map(({ group, item }) => {
                  const Icon = item.icon

                  return (
                    <Link
                      className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-brand-soft/60 focus-visible:outline-none"
                      key={item.id}
                      onClick={() => {
                        setOpen(false)
                        setQuery("")
                      }}
                      to={item.path}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-canvas text-brand-strong">
                        <Icon aria-hidden="true" className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-ink">{item.label}</span>
                        <span className="mt-0.5 block truncate text-xs text-ink-muted">
                          {group.label} · {item.description}
                        </span>
                      </span>
                    </Link>
                  )
                })
              ) : (
                <div className="px-4 py-10 text-center">
                  <p className="text-sm font-semibold text-ink">No encontramos una sección</p>
                  <p className="mt-1 text-xs text-ink-muted">Prueba con otro término.</p>
                </div>
              )}
            </div>
            <div className="border-t border-line/70 px-4 py-3 text-[0.68rem] text-ink-subtle">
              Usa Tab y Enter para navegar · Esc para cerrar
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
