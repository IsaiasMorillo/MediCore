import { ArrowLeft } from "lucide-react"
import type { ReactNode } from "react"
import { Link } from "react-router-dom"

import { PageHeader } from "@/components/layout/page-header"

export function AccountPageLayout({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="space-y-6">
      <Link
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-strong transition-colors hover:text-brand focus-visible:outline-none"
        to="/app"
      >
        <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
        Volver al dashboard
      </Link>
      <PageHeader description={description} eyebrow={eyebrow} title={title} />
      <section className="max-w-3xl rounded-[1.35rem] border border-line/80 bg-panel p-5 shadow-[0_20px_55px_-38px_var(--ink)] sm:p-7">
        {children}
      </section>
    </div>
  )
}
