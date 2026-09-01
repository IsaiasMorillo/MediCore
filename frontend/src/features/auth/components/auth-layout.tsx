import { ArrowRight, HeartPulse, ShieldCheck } from "lucide-react"
import type { ReactNode } from "react"
import { Link } from "react-router-dom"

import { BrandMark } from "@/components/layout/brand-mark"

interface AuthLayoutProps {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthLayout({
  eyebrow,
  title,
  description,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-canvas">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,0.78fr)_minmax(440px,1.22fr)]">
        <aside className="relative hidden overflow-hidden bg-ink px-10 py-10 text-white lg:flex lg:flex-col lg:justify-between xl:px-14">
          <BrandMark inverse />
          <div className="relative z-10 max-w-lg">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-brand-soft">
              Hospital Management System
            </p>
            <h2 className="mt-4 max-w-md font-display text-[clamp(2.2rem,4.5vw,4.25rem)] font-semibold leading-[0.98] tracking-[-0.065em]">
              Claridad para cada decisión de cuidado.
            </h2>
            <p className="mt-6 max-w-md text-sm leading-7 text-white/60">
              Un espacio operativo para coordinar atención, expedientes y servicios hospitalarios con precisión.
            </p>
            <div className="mt-10 grid max-w-md gap-3 sm:grid-cols-2">
              <Feature icon={<ShieldCheck />} label="Acceso por rol" />
              <Feature icon={<HeartPulse />} label="Operación clínica" />
            </div>
          </div>
          <p className="text-xs text-white/40">MediCore · Datos protegidos por sesión</p>
          <div className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full border border-brand/20 bg-brand/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-32 top-24 h-64 w-64 rounded-full border border-white/5 bg-white/5 blur-3xl" />
        </aside>

        <main className="flex min-h-screen items-center px-5 py-8 sm:px-10 sm:py-12">
          <div className="mx-auto w-full max-w-[29rem]">
            <div className="lg:hidden">
              <BrandMark />
            </div>
            <div className="mt-10 sm:mt-14 lg:mt-0">
              <div className="mb-8">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-brand-strong">
                  {eyebrow}
                </p>
                <h1 className="mt-2.5 font-display text-[clamp(2rem,5vw,3rem)] font-semibold leading-[1.02] tracking-[-0.06em] text-ink">
                  {title}
                </h1>
                <p className="mt-3 max-w-md text-sm leading-6 text-ink-muted">{description}</p>
              </div>
              {children}
              {footer ? <div className="mt-7">{footer}</div> : null}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function Feature({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-xs font-medium text-white/75">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/20 text-brand-soft">
        {icon}
      </span>
      {label}
    </div>
  )
}

export function AuthBackLink({ to = "/login", children }: { to?: string; children: string }) {
  return (
    <Link className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-strong transition-colors hover:text-brand" to={to}>
      {children}
      <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
    </Link>
  )
}
