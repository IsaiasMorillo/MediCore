import { AlertCircle, CheckCircle2, Info, WifiOff, X } from "lucide-react"

import { ConfirmActionDialog } from "@/components/ui"
export { NotFoundPage as NotFound, PermissionDenied } from "@/components/feedback/feedback-states"

export function InlineError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div aria-live="assertive" className="flex items-start gap-2.5 rounded-xl border border-rose/20 bg-rose-soft/60 px-4 py-3" role="alert"><AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-rose-strong" /><div className="min-w-0"><p className="text-xs leading-5 text-ink">{message}</p>{onRetry ? <button className="mt-2 text-xs font-semibold text-brand-strong transition-colors hover:text-brand" onClick={onRetry} type="button">Intentar nuevamente</button> : null}</div></div>
}

export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return <div className="rounded-2xl border border-amber/25 bg-amber-soft/55 p-4" role="alert"><div className="flex items-start gap-3"><WifiOff aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-amber-strong" /><div><p className="text-xs font-semibold text-ink">No pudimos conectar con MediCore</p><p className="mt-1 text-xs leading-5 text-ink-muted">Revisa tu conexión o intenta nuevamente en unos segundos.</p>{onRetry ? <button className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-strong hover:text-brand" onClick={onRetry} type="button">Intentar nuevamente</button> : null}</div></div></div>
}

export function Toast({ message, onDismiss, title, tone = "info" }: { message: string; onDismiss?: () => void; title?: string; tone?: "info" | "success" | "danger" }) {
  const toneClasses = tone === "success" ? "border-brand/25 bg-brand-soft text-brand-strong" : tone === "danger" ? "border-rose/25 bg-rose-soft text-rose-strong" : "border-indigo/25 bg-indigo-soft text-indigo"
  const Icon = tone === "success" ? CheckCircle2 : tone === "danger" ? AlertCircle : Info

  return <div aria-live={tone === "danger" ? "assertive" : "polite"} className={`flex w-full max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 shadow-[0_18px_40px_-24px_var(--ink)] ${toneClasses}`} role={tone === "danger" ? "alert" : "status"}><Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" /><div className="min-w-0 flex-1"><p className="text-xs font-semibold">{title ?? (tone === "success" ? "Listo" : tone === "danger" ? "No se pudo completar" : "Información")}</p><p className="mt-1 text-xs leading-5 text-ink-muted">{message}</p></div>{onDismiss ? <button aria-label="Cerrar notificación" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-ink-subtle hover:bg-panel/60 hover:text-ink" onClick={onDismiss} type="button"><X aria-hidden="true" className="h-3.5 w-3.5" /></button> : null}</div>
}

export function SessionExpiredDialog({ onLogin, open }: { onLogin: () => void; open: boolean }) {
  return <ConfirmActionDialog cancelLabel="Cerrar" confirmLabel="Iniciar sesión" description="Por seguridad, tu sesión terminó. Inicia sesión nuevamente para continuar trabajando en MediCore." onClose={onLogin} onConfirm={onLogin} open={open} title="Tu sesión terminó" />
}
