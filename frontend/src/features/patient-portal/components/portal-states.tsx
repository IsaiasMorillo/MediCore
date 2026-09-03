import { HeartPulse, RefreshCw, ShieldAlert } from "lucide-react"

export function PortalUnlinkedState() {
  return (
    <section className="flex min-h-[min(32rem,70vh)] items-center justify-center py-8" role="alert">
      <div className="w-full max-w-lg rounded-[1.6rem] border border-amber/25 bg-panel p-6 text-center shadow-[0_24px_60px_-38px_var(--ink)] sm:p-9">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-soft text-amber-strong">
          <ShieldAlert aria-hidden="true" className="h-6 w-6" />
        </span>
        <p className="mt-6 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-amber-strong">Cuenta pendiente de vinculación</p>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-[-0.045em] text-ink">Tu cuenta todavía no está vinculada</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-ink-muted">Tu cuenta todavía no está vinculada a un expediente de paciente. Contacta con administración.</p>
      </div>
    </section>
  )
}

export function PortalPageLoadingState() {
  return (
    <div aria-busy="true" aria-live="polite" className="space-y-6" role="status">
      <div className="space-y-3">
        <span className="block h-3 w-36 animate-pulse rounded-full bg-line/60" />
        <span className="block h-10 w-2/3 max-w-md animate-pulse rounded-xl bg-line/60" />
        <span className="block h-4 w-full max-w-2xl animate-pulse rounded-full bg-line/60" />
      </div>
      <div className="h-44 animate-pulse rounded-[1.6rem] border border-line/70 bg-panel" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => <div className="h-32 animate-pulse rounded-2xl border border-line/70 bg-panel" key={item} />)}
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        {[0, 1, 2, 3].map((item) => <div className="h-72 animate-pulse rounded-[1.45rem] border border-line/70 bg-panel" key={item} />)}
      </div>
    </div>
  )
}

export function PortalRefreshButton({ isFetching, onRefresh }: { isFetching: boolean; onRefresh: () => void }) {
  return (
    <button
      aria-label="Actualizar información del portal"
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-panel text-ink-muted shadow-sm transition-colors hover:border-brand/40 hover:text-ink disabled:cursor-wait disabled:opacity-60"
      disabled={isFetching}
      onClick={onRefresh}
      title="Actualizar información"
      type="button"
    >
      <RefreshCw aria-hidden="true" className={isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
    </button>
  )
}

export function PortalPrivacyNote() {
  return (
    <footer className="mt-7 flex items-start gap-2 border-t border-line/70 pt-4 text-[0.68rem] leading-5 text-ink-subtle">
      <HeartPulse aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-strong" />
      <span>Esta información es personal y se muestra únicamente desde tu sesión protegida.</span>
    </footer>
  )
}
