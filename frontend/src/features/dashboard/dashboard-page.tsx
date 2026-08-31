import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  ClipboardList,
  Clock3,
  Download,
  FileText,
  HeartPulse,
  LayoutDashboard,
  LoaderCircle,
  Menu,
  MessageSquare,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  SlidersHorizontal,
  Stethoscope,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { useEffect, useMemo, useRef, useState } from "react"

import { Area, AreaChart } from "@/components/charts/area-chart"
import { Bar, BarChart } from "@/components/charts/bar-chart"
import { chartCssVars } from "@/components/charts/chart-context"
import { Grid } from "@/components/charts/grid"
import { BarXAxis } from "@/components/charts/bar-x-axis"
import { ChartTooltip } from "@/components/charts/tooltip"
import { XAxis } from "@/components/charts/x-axis"
import { cn } from "@/lib/utils"

type Period = "7D" | "30D" | "90D"
type PatientStatus = "Stable" | "Needs follow-up" | "New patient"
type AppointmentStatus = "Confirmed" | "Check-in" | "Waiting"

interface NavItem {
  label: string
  icon: LucideIcon
  badge?: string
}

interface NavGroup {
  label: string
  items: NavItem[]
}

interface Metric {
  label: string
  value: string
  change: string
  context: string
  trend: "up" | "down"
  icon: LucideIcon
  iconClassName: string
  sparkline: number[]
}

interface Patient {
  name: string
  initials: string
  id: string
  lastVisit: string
  careTeam: string
  status: PatientStatus
  avatarClassName: string
}

const navigationGroups: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      { label: "Overview", icon: LayoutDashboard },
      { label: "Patients", icon: UsersRound, badge: "2.4k" },
      { label: "Appointments", icon: CalendarDays, badge: "4" },
    ],
  },
  {
    label: "Clinical",
    items: [
      { label: "Care plans", icon: ClipboardList },
      { label: "Messages", icon: MessageSquare, badge: "6" },
      { label: "Reports", icon: FileText },
    ],
  },
  {
    label: "Manage",
    items: [{ label: "Team settings", icon: Settings2 }],
  },
]

const metrics: Metric[] = [
  {
    label: "Active patients",
    value: "2,481",
    change: "+8.4%",
    context: "vs. last month",
    trend: "up",
    icon: UsersRound,
    iconClassName: "bg-brand-soft text-brand-strong",
    sparkline: [38, 48, 44, 57, 51, 64, 70, 78],
  },
  {
    label: "Appointments today",
    value: "42",
    change: "+12.5%",
    context: "vs. same day last week",
    trend: "up",
    icon: CalendarDays,
    iconClassName: "bg-indigo-soft text-indigo",
    sparkline: [30, 44, 35, 48, 54, 46, 63, 74],
  },
  {
    label: "Avg. wait time",
    value: "18 min",
    change: "-4.2%",
    context: "better than target",
    trend: "down",
    icon: Clock3,
    iconClassName: "bg-amber-soft text-amber-strong",
    sparkline: [72, 67, 75, 57, 61, 49, 44, 39],
  },
  {
    label: "Collection rate",
    value: "94.8%",
    change: "+2.1%",
    context: "of billed services",
    trend: "up",
    icon: Activity,
    iconClassName: "bg-rose-soft text-rose-strong",
    sparkline: [45, 49, 53, 51, 63, 65, 72, 80],
  },
]

const visitDataByPeriod: Record<Period, Record<string, unknown>[]> = {
  "7D": [
    { date: new Date("2024-06-12"), visits: 38 },
    { date: new Date("2024-06-13"), visits: 46 },
    { date: new Date("2024-06-14"), visits: 41 },
    { date: new Date("2024-06-15"), visits: 58 },
    { date: new Date("2024-06-16"), visits: 49 },
    { date: new Date("2024-06-17"), visits: 68 },
    { date: new Date("2024-06-18"), visits: 74 },
  ],
  "30D": [
    { date: new Date("2024-05-20"), visits: 51 },
    { date: new Date("2024-05-25"), visits: 66 },
    { date: new Date("2024-05-30"), visits: 58 },
    { date: new Date("2024-06-04"), visits: 73 },
    { date: new Date("2024-06-09"), visits: 69 },
    { date: new Date("2024-06-14"), visits: 81 },
    { date: new Date("2024-06-18"), visits: 88 },
  ],
  "90D": [
    { date: new Date("2024-03-22"), visits: 64 },
    { date: new Date("2024-04-06"), visits: 71 },
    { date: new Date("2024-04-21"), visits: 78 },
    { date: new Date("2024-05-06"), visits: 74 },
    { date: new Date("2024-05-21"), visits: 86 },
    { date: new Date("2024-06-05"), visits: 91 },
    { date: new Date("2024-06-18"), visits: 104 },
  ],
}

const volumeSummaries: Record<
  Period,
  { value: string; label: string; change: string }
> = {
  "7D": { value: "126", label: "visits this week", change: "+14.8%" },
  "30D": { value: "512", label: "visits this month", change: "+9.6%" },
  "90D": { value: "1,486", label: "visits this quarter", change: "+18.2%" },
}

const capacityData: Record<string, unknown>[] = [
  { day: "Mon", scheduled: 36, capacity: 48 },
  { day: "Tue", scheduled: 42, capacity: 48 },
  { day: "Wed", scheduled: 31, capacity: 44 },
  { day: "Thu", scheduled: 39, capacity: 46 },
  { day: "Fri", scheduled: 28, capacity: 40 },
]

const patients: Patient[] = [
  {
    name: "Amelia Thompson",
    initials: "AT",
    id: "MC-20481",
    lastVisit: "Jun 18, 2024",
    careTeam: "Dr. Maya Chen",
    status: "Stable",
    avatarClassName: "bg-[#d8ebe7] text-[#1a7468]",
  },
  {
    name: "Noah Williams",
    initials: "NW",
    id: "MC-20476",
    lastVisit: "Jun 17, 2024",
    careTeam: "Dr. Elias Reed",
    status: "Needs follow-up",
    avatarClassName: "bg-[#f8e7c9] text-[#a16118]",
  },
  {
    name: "Sofia Martinez",
    initials: "SM",
    id: "MC-20470",
    lastVisit: "Jun 17, 2024",
    careTeam: "Dr. Maya Chen",
    status: "Stable",
    avatarClassName: "bg-[#e1e1f5] text-[#5554a4]",
  },
  {
    name: "Oliver Brown",
    initials: "OB",
    id: "MC-20466",
    lastVisit: "Jun 16, 2024",
    careTeam: "Dr. Priya Shah",
    status: "New patient",
    avatarClassName: "bg-[#f5dfe1] text-[#a44c58]",
  },
  {
    name: "Mia Anderson",
    initials: "MA",
    id: "MC-20452",
    lastVisit: "Jun 15, 2024",
    careTeam: "Dr. Elias Reed",
    status: "Stable",
    avatarClassName: "bg-[#dce8f4] text-[#3f6b96]",
  },
]

const appointmentDays = [
  { key: "Mon", date: "17" },
  { key: "Tue", date: "18" },
  { key: "Wed", date: "19" },
  { key: "Thu", date: "20" },
  { key: "Fri", date: "21" },
] as const

type AppointmentDay = (typeof appointmentDays)[number]["key"]

interface Appointment {
  id: string
  day: AppointmentDay
  time: string
  duration: string
  patient: string
  initials: string
  visitType: string
  clinician: string
  status: AppointmentStatus
  avatarClassName: string
}

const appointments: Appointment[] = [
  {
    id: "apt-1",
    day: "Tue",
    time: "09:00",
    duration: "30 min",
    patient: "Amelia Thompson",
    initials: "AT",
    visitType: "Follow-up",
    clinician: "Dr. Maya Chen",
    status: "Confirmed",
    avatarClassName: "bg-[#d8ebe7] text-[#1a7468]",
  },
  {
    id: "apt-2",
    day: "Tue",
    time: "10:15",
    duration: "45 min",
    patient: "Oliver Brown",
    initials: "OB",
    visitType: "New patient",
    clinician: "Dr. Priya Shah",
    status: "Check-in",
    avatarClassName: "bg-[#f5dfe1] text-[#a44c58]",
  },
  {
    id: "apt-3",
    day: "Tue",
    time: "11:30",
    duration: "30 min",
    patient: "Noah Williams",
    initials: "NW",
    visitType: "Care review",
    clinician: "Dr. Elias Reed",
    status: "Waiting",
    avatarClassName: "bg-[#f8e7c9] text-[#a16118]",
  },
  {
    id: "apt-4",
    day: "Tue",
    time: "13:45",
    duration: "30 min",
    patient: "Sofia Martinez",
    initials: "SM",
    visitType: "Routine check",
    clinician: "Dr. Maya Chen",
    status: "Confirmed",
    avatarClassName: "bg-[#e1e1f5] text-[#5554a4]",
  },
  {
    id: "apt-5",
    day: "Mon",
    time: "14:00",
    duration: "30 min",
    patient: "Mia Anderson",
    initials: "MA",
    visitType: "Follow-up",
    clinician: "Dr. Elias Reed",
    status: "Confirmed",
    avatarClassName: "bg-[#dce8f4] text-[#3f6b96]",
  },
  {
    id: "apt-6",
    day: "Wed",
    time: "08:30",
    duration: "45 min",
    patient: "Liam Davis",
    initials: "LD",
    visitType: "New patient",
    clinician: "Dr. Priya Shah",
    status: "Confirmed",
    avatarClassName: "bg-[#e7e0f4] text-[#7055a6]",
  },
  {
    id: "apt-7",
    day: "Thu",
    time: "15:15",
    duration: "30 min",
    patient: "Emma Wilson",
    initials: "EW",
    visitType: "Routine check",
    clinician: "Dr. Maya Chen",
    status: "Confirmed",
    avatarClassName: "bg-[#dceee3] text-[#397854]",
  },
]

const patientStatusClassName: Record<PatientStatus, string> = {
  Stable: "bg-brand-soft text-brand-strong",
  "Needs follow-up": "bg-amber-soft text-amber-strong",
  "New patient": "bg-indigo-soft text-indigo",
}

const appointmentStatusClassName: Record<AppointmentStatus, string> = {
  Confirmed: "bg-brand-soft text-brand-strong",
  "Check-in": "bg-indigo-soft text-indigo",
  Waiting: "bg-amber-soft text-amber-strong",
}

const panelClassName =
  "panel-shadow rounded-[1.35rem] border border-line/80 bg-panel"
const secondaryButtonClassName =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-panel-raised px-3.5 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:border-brand/40 hover:bg-brand-soft/40 hover:text-ink focus-visible:outline-none"

function SidebarContent({
  activeItem,
  onNavigate,
  onClose,
}: {
  activeItem: string
  onNavigate: (label: string) => void
  onClose?: () => void
}) {
  const handleNavigate = (label: string) => {
    onNavigate(label)
    onClose?.()
  }

  return (
    <div className="flex min-h-screen flex-col border-r border-line/80 bg-panel/80 px-4 py-5 backdrop-blur-xl lg:w-[252px]">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white shadow-[0_8px_18px_-10px_var(--brand)]">
            <HeartPulse aria-hidden="true" className="h-5 w-5" strokeWidth={2.3} />
          </span>
          <div>
            <p className="font-display text-[1.05rem] font-semibold tracking-[-0.03em] text-ink">
              MediCore
            </p>
            <p className="text-[0.65rem] font-medium uppercase tracking-[0.16em] text-ink-subtle">
              Care operations
            </p>
          </div>
        </div>
        {onClose ? (
          <button
            aria-label="Close navigation"
            className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink lg:hidden"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      <div className="mt-8 flex items-center gap-3 rounded-2xl border border-line/70 bg-canvas/70 px-3 py-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-brand shadow-sm">
          <Stethoscope aria-hidden="true" className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-ink">Northstar Clinic</p>
          <p className="truncate text-[0.68rem] text-ink-subtle">Main workspace</p>
        </div>
        <ChevronDown aria-hidden="true" className="h-4 w-4 text-ink-subtle" />
      </div>

      <nav aria-label="Primary navigation" className="mt-8 flex-1 space-y-7">
        {navigationGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-3 text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-ink-subtle">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = item.label === activeItem

                return (
                  <button
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors focus-visible:outline-none",
                      isActive
                        ? "bg-brand text-white shadow-[0_10px_22px_-15px_var(--brand)]"
                        : "text-ink-muted hover:bg-brand-soft/55 hover:text-ink"
                    )}
                    key={item.label}
                    onClick={() => handleNavigate(item.label)}
                    type="button"
                  >
                    <Icon aria-hidden="true" className="h-[1.05rem] w-[1.05rem]" strokeWidth={isActive ? 2.2 : 1.9} />
                    <span className="flex-1">{item.label}</span>
                    {item.badge ? (
                      <span
                        className={cn(
                          "rounded-md px-1.5 py-0.5 text-[0.65rem] font-semibold tabular-nums",
                          isActive ? "bg-white/15 text-white" : "bg-ink/5 text-ink-subtle"
                        )}
                      >
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-8 rounded-2xl bg-ink px-3.5 py-3.5 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold">Care team status</p>
            <p className="mt-1 text-[0.7rem] leading-5 text-white/60">
              Everyone is on schedule today.
            </p>
          </div>
          <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-brand/20 text-brand-soft">
            <Check aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2.5} />
          </span>
        </div>
        <div className="mt-3 flex items-center gap-2 text-[0.67rem] text-white/60">
          <span className="h-1.5 w-1.5 rounded-full bg-[#7ce0b3]" />
          <span>12 clinicians online</span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 border-t border-line/80 px-2 pt-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#dce8f4] text-xs font-bold text-[#3f6b96]">
          JR
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-ink">Jordan Reyes</p>
          <p className="truncate text-[0.68rem] text-ink-subtle">Clinic administrator</p>
        </div>
        <button
          aria-label="Open profile menu"
          className="rounded-lg p-1.5 text-ink-subtle transition-colors hover:bg-ink/5 hover:text-ink"
          onClick={() => handleNavigate("Profile")}
          type="button"
        >
          <MoreHorizontal aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function KpiCard({
  metric,
  index,
  shouldReduceMotion,
}: {
  metric: Metric
  index: number
  shouldReduceMotion: boolean | null
}) {
  const MetricIcon = metric.icon
  const TrendIcon = metric.trend === "up" ? ArrowUpRight : ArrowDownRight

  return (
    <motion.article
      animate={{ opacity: 1, y: 0 }}
      className={`${panelClassName} group relative overflow-hidden p-5`}
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
      transition={{ delay: index * 0.06, duration: 0.42, ease: "easeOut" }}
      whileHover={shouldReduceMotion ? undefined : { y: -3 }}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", metric.iconClassName)}>
            <MetricIcon aria-hidden="true" className="h-[1.1rem] w-[1.1rem]" strokeWidth={2} />
          </span>
          <p className="truncate text-xs font-semibold text-ink-muted">{metric.label}</p>
        </div>
        <button
          aria-label={`More options for ${metric.label}`}
          className="rounded-lg p-1.5 text-ink-subtle opacity-60 transition-colors hover:bg-ink/5 hover:text-ink group-hover:opacity-100"
          type="button"
        >
          <MoreHorizontal aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-5 flex items-end justify-between gap-3">
        <p className="font-display text-[1.85rem] font-semibold tracking-[-0.045em] text-ink tabular-nums">
          {metric.value}
        </p>
        <span className="mb-1 inline-flex items-center gap-0.5 text-xs font-semibold text-brand-strong">
          <TrendIcon aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2.4} />
          {metric.change}
        </span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-4">
        <p className="text-[0.68rem] text-ink-subtle">{metric.context}</p>
        <div aria-hidden="true" className="flex h-7 items-end gap-1">
          {metric.sparkline.map((height, sparklineIndex) => (
            <span
              className={cn(
                "w-1.5 rounded-full transition-[height] duration-300",
                sparklineIndex === metric.sparkline.length - 1 ? "bg-brand" : "bg-brand/20"
              )}
              key={`${metric.label}-${sparklineIndex}`}
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </div>
    </motion.article>
  )
}

function VisitsChart({ period }: { period: Period }) {
  const summary = volumeSummaries[period]

  return (
    <section aria-labelledby="visit-volume-title" className={`${panelClassName} overflow-hidden`}>
      <div className="flex flex-col gap-4 p-5 pb-0 sm:flex-row sm:items-start sm:justify-between sm:p-6 sm:pb-0">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-brand-strong">
            Clinic activity
          </p>
          <h2 className="mt-1.5 font-display text-lg font-semibold tracking-[-0.035em] text-ink" id="visit-volume-title">
            Patient visits
          </h2>
        </div>
        <div aria-label="Visit volume period" className="flex w-fit items-center gap-1 rounded-xl bg-canvas p-1" role="group">
          {(["7D", "30D", "90D"] as Period[]).map((option) => (
            <span className={cn("rounded-lg px-2.5 py-1.5 text-[0.68rem] font-semibold", option === period ? "bg-panel-raised text-ink shadow-sm" : "text-ink-subtle")} key={option}>
              {option}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-x-4 gap-y-2 px-5 pt-5 sm:px-6">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-3xl font-semibold tracking-[-0.055em] text-ink tabular-nums">{summary.value}</span>
          <span className="text-xs text-ink-muted">{summary.label}</span>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-1 text-[0.68rem] font-semibold text-brand-strong">
          <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
          {summary.change}
        </span>
      </div>

      <div aria-label={`Area chart showing ${summary.label}`} className="h-[250px] w-full px-1 pt-2 sm:h-[270px]" role="img">
        <AreaChart
          aspectRatio="auto"
          className="h-full"
          data={visitDataByPeriod[period]}
          margin={{ bottom: 38, left: 14, right: 16, top: 20 }}
        >
          <Grid fadeHorizontal={false} hideHorizontalEdgeLines horizontal numTicksRows={4} stroke={chartCssVars.grid} strokeDasharray="3,6" />
          <Area dataKey="visits" fill={chartCssVars.linePrimary} fillOpacity={0.3} gradientToOpacity={0} stroke={chartCssVars.linePrimary} strokeWidth={2.5} />
          <XAxis numTicks={period === "7D" ? 7 : 5} />
          <ChartTooltip
            rows={(point) => [
              {
                color: chartCssVars.linePrimary,
                label: "Patient visits",
                value: typeof point.visits === "number" ? point.visits : 0,
              },
            ]}
          />
        </AreaChart>
      </div>
    </section>
  )
}

function AppointmentPanel({
  selectedDay,
  onDayChange,
  onViewSchedule,
  shouldReduceMotion,
}: {
  selectedDay: AppointmentDay
  onDayChange: (day: AppointmentDay) => void
  onViewSchedule: () => void
  shouldReduceMotion: boolean | null
}) {
  const selectedAppointments = appointments.filter((appointment) => appointment.day === selectedDay)
  const selectedDate = appointmentDays.find((day) => day.key === selectedDay)?.date

  return (
    <section aria-labelledby="appointments-title" className={`${panelClassName} flex flex-col p-5 sm:p-6`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-brand-strong">Schedule</p>
          <h2 className="mt-1.5 font-display text-lg font-semibold tracking-[-0.035em] text-ink" id="appointments-title">Today's appointments</h2>
        </div>
        <button aria-label="More appointment options" className="rounded-lg p-1.5 text-ink-subtle transition-colors hover:bg-ink/5 hover:text-ink" type="button">
          <MoreHorizontal aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>

      <div aria-label="Select appointment day" className="mt-5 grid grid-cols-5 gap-1.5 rounded-2xl bg-canvas p-1.5" role="tablist">
        {appointmentDays.map((day) => {
          const isSelected = day.key === selectedDay

          return (
            <button
              aria-selected={isSelected}
              className={cn("rounded-xl px-1 py-2 text-center transition-colors focus-visible:outline-none", isSelected ? "bg-brand text-white shadow-sm" : "text-ink-subtle hover:bg-panel-raised hover:text-ink")}
              key={day.key}
              onClick={() => onDayChange(day.key)}
              role="tab"
              type="button"
            >
              <span className="block text-[0.65rem] font-semibold">{day.key}</span>
              <span className={cn("mt-0.5 block font-display text-sm font-semibold tabular-nums", isSelected ? "text-white" : "text-ink")}>{day.date}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs font-semibold text-ink">Tuesday, June {selectedDate}</p>
        <span className="text-[0.68rem] text-ink-subtle">{selectedAppointments.length} scheduled</span>
      </div>

      <div className="mt-3 min-h-[270px] flex-1">
        {selectedAppointments.length > 0 ? (
          <AnimatePresence initial={false}>
            <ul className="space-y-2.5" key={selectedDay}>
              {selectedAppointments.map((appointment, index) => (
                <motion.li
                  animate={{ opacity: 1, x: 0 }}
                  className="group flex gap-3 rounded-xl border border-line/70 bg-panel-raised p-3 transition-colors hover:border-brand/30 hover:bg-brand-soft/20"
                  exit={{ opacity: 0, x: shouldReduceMotion ? 0 : -8 }}
                  initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 8 }}
                  key={appointment.id}
                  transition={{ delay: shouldReduceMotion ? 0 : index * 0.045, duration: 0.24, ease: "easeOut" }}
                >
                  <div className="w-11 shrink-0 pt-0.5">
                    <p className="text-xs font-semibold tabular-nums text-ink">{appointment.time}</p>
                    <p className="mt-1 text-[0.62rem] text-ink-subtle">{appointment.duration}</p>
                  </div>
                  <div className="flex min-w-0 flex-1 items-start gap-2.5">
                    <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[0.62rem] font-bold", appointment.avatarClassName)}>{appointment.initials}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-xs font-semibold text-ink">{appointment.patient}</p>
                        <span className={cn("hidden shrink-0 rounded-md px-1.5 py-0.5 text-[0.58rem] font-semibold sm:inline-flex", appointmentStatusClassName[appointment.status])}>{appointment.status}</span>
                      </div>
                      <p className="mt-1 truncate text-[0.68rem] text-ink-muted">{appointment.visitType} · {appointment.clinician}</p>
                    </div>
                    <span className={cn("mt-1 h-1.5 w-1.5 shrink-0 rounded-full", appointment.status === "Waiting" ? "bg-amber" : appointment.status === "Check-in" ? "bg-indigo" : "bg-success")} />
                  </div>
                </motion.li>
              ))}
            </ul>
          </AnimatePresence>
        ) : (
          <div className="flex min-h-[270px] flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-canvas/50 px-6 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-panel-raised text-ink-subtle shadow-sm">
              <CalendarDays aria-hidden="true" className="h-5 w-5" />
            </span>
            <p className="mt-3 text-sm font-semibold text-ink">No appointments scheduled</p>
            <p className="mt-1 max-w-[210px] text-xs leading-5 text-ink-muted">This day is open for follow-ups or admin time.</p>
          </div>
        )}
      </div>

      <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-canvas px-3 py-2.5 text-xs font-semibold text-ink-muted transition-colors hover:border-brand/40 hover:bg-brand-soft/40 hover:text-ink focus-visible:outline-none" onClick={onViewSchedule} type="button">
        View full schedule
        <ChevronRight aria-hidden="true" className="h-4 w-4" />
      </button>
    </section>
  )
}

function PatientTable({
  onNotice,
  shouldReduceMotion,
}: {
  onNotice: (message: string) => void
  shouldReduceMotion: boolean | null
}) {
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<PatientStatus | "All">("All")
  const filteredPatients = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return patients.filter((patient) => {
      const matchesQuery = normalizedQuery.length === 0 || `${patient.name} ${patient.id} ${patient.careTeam}`.toLowerCase().includes(normalizedQuery)
      const matchesStatus = statusFilter === "All" || patient.status === statusFilter
      return matchesQuery && matchesStatus
    })
  }, [query, statusFilter])

  return (
    <section aria-labelledby="patients-title" className={`${panelClassName} overflow-hidden`}>
      <div className="flex flex-col gap-4 p-5 sm:p-6 sm:pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-brand-strong">Patient directory</p>
          <div className="mt-1.5 flex items-baseline gap-2">
            <h2 className="font-display text-lg font-semibold tracking-[-0.035em] text-ink" id="patients-title">Recent patients</h2>
            <span className="text-xs text-ink-subtle">{filteredPatients.length} of {patients.length}</span>
          </div>
        </div>
        <button className={secondaryButtonClassName} onClick={() => onNotice("Patient directory selected. Showing the latest records.")} type="button">
          View all patients
          <ChevronRight aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-col gap-2.5 px-5 pb-4 sm:flex-row sm:px-6">
        <div className="relative min-w-0 flex-1">
          <label className="sr-only" htmlFor="patient-search">Search patients</label>
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
          <input className="h-10 w-full rounded-xl border border-line bg-canvas pl-9 pr-3 text-xs text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-brand/50 focus:ring-2 focus:ring-brand/10" id="patient-search" onChange={(event) => setQuery(event.target.value)} placeholder="Search patients, ID, or clinician" type="search" value={query} />
        </div>
        <div className="relative shrink-0">
          <label className="sr-only" htmlFor="patient-status">Filter patient status</label>
          <SlidersHorizontal aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-subtle" />
          <select className="h-10 w-full appearance-none rounded-xl border border-line bg-canvas pl-9 pr-9 text-xs font-medium text-ink-muted outline-none transition-colors focus:border-brand/50 focus:ring-2 focus:ring-brand/10 sm:w-[155px]" id="patient-status" onChange={(event) => setStatusFilter(event.target.value as PatientStatus | "All")} value={statusFilter}>
            <option value="All">All statuses</option>
            <option value="Stable">Stable</option>
            <option value="Needs follow-up">Needs follow-up</option>
            <option value="New patient">New patient</option>
          </select>
          <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-subtle" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-left">
          <caption className="sr-only">Recent patient records and care status</caption>
          <thead>
            <tr className="border-y border-line/70 bg-canvas/60 text-[0.64rem] font-semibold uppercase tracking-[0.12em] text-ink-subtle">
              <th className="px-5 py-3 font-semibold sm:px-6" scope="col">Patient</th>
              <th className="px-3 py-3 font-semibold" scope="col">Patient ID</th>
              <th className="px-3 py-3 font-semibold" scope="col">Last visit</th>
              <th className="px-3 py-3 font-semibold" scope="col">Care team</th>
              <th className="px-3 py-3 font-semibold" scope="col">Status</th>
              <th className="w-12 px-3 py-3" scope="col"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients.length > 0 ? filteredPatients.map((patient, index) => (
              <motion.tr animate={{ opacity: 1, y: 0 }} className="group border-b border-line/60 text-xs transition-colors hover:bg-brand-soft/20" initial={shouldReduceMotion ? false : { opacity: 0, y: 5 }} key={patient.id} transition={{ delay: shouldReduceMotion ? 0 : index * 0.04, duration: 0.24, ease: "easeOut" }}>
                <td className="px-5 py-3.5 sm:px-6">
                  <div className="flex items-center gap-3">
                    <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[0.62rem] font-bold", patient.avatarClassName)}>{patient.initials}</span>
                    <span className="font-semibold text-ink">{patient.name}</span>
                  </div>
                </td>
                <td className="px-3 py-3.5 font-medium tabular-nums text-ink-muted">{patient.id}</td>
                <td className="whitespace-nowrap px-3 py-3.5 text-ink-muted">{patient.lastVisit}</td>
                <td className="whitespace-nowrap px-3 py-3.5 text-ink-muted">{patient.careTeam}</td>
                <td className="px-3 py-3.5"><span className={cn("inline-flex rounded-md px-2 py-1 text-[0.62rem] font-semibold", patientStatusClassName[patient.status])}>{patient.status}</span></td>
                <td className="px-3 py-3.5">
                  <button aria-label={`More actions for ${patient.name}`} className="rounded-lg p-1.5 text-ink-subtle opacity-60 transition-colors hover:bg-ink/5 hover:text-ink group-hover:opacity-100" onClick={() => onNotice(`Opening record actions for ${patient.name}.`)} type="button">
                    <MoreHorizontal aria-hidden="true" className="h-4 w-4" />
                  </button>
                </td>
              </motion.tr>
            )) : (
              <tr>
                <td className="px-6 py-12 text-center" colSpan={6}>
                  <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-canvas text-ink-subtle">
                    <CircleAlert aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <p className="mt-3 text-sm font-semibold text-ink">No patients match this search</p>
                  <p className="mt-1 text-xs text-ink-muted">Try a different name, ID, clinician, or status.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function CapacityCard() {
  return (
    <section aria-labelledby="capacity-title" className={`${panelClassName} overflow-hidden p-5 sm:p-6`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-brand-strong">Operations</p>
          <h2 className="mt-1.5 font-display text-lg font-semibold tracking-[-0.035em] text-ink" id="capacity-title">Clinic capacity</h2>
        </div>
        <span className="rounded-lg bg-canvas px-2 py-1.5 text-[0.65rem] font-semibold text-ink-muted">This week</span>
      </div>
      <div className="mt-4 flex items-center gap-4 text-[0.68rem] text-ink-muted">
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brand" />Scheduled</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-chart-secondary" />Capacity</span>
      </div>
      <div aria-label="Bar chart comparing scheduled appointments with clinic capacity" className="mt-2 h-[220px]" role="img">
        <BarChart aspectRatio="auto" barGap={0.35} className="h-full" data={capacityData} margin={{ bottom: 36, left: 12, right: 12, top: 18 }}>
          <Grid fadeHorizontal={false} hideHorizontalEdgeLines horizontal numTicksRows={4} stroke={chartCssVars.grid} strokeDasharray="3,6" />
          <Bar dataKey="capacity" fill={chartCssVars.lineSecondary} lineCap={6} />
          <Bar dataKey="scheduled" fill={chartCssVars.linePrimary} lineCap={6} />
          <BarXAxis showAllLabels />
          <ChartTooltip rows={(point) => [
            { color: chartCssVars.linePrimary, label: "Scheduled", value: typeof point.scheduled === "number" ? point.scheduled : 0 },
            { color: chartCssVars.lineSecondary, label: "Capacity", value: typeof point.capacity === "number" ? point.capacity : 0 },
          ]} />
        </BarChart>
      </div>
      <div className="mt-2 flex items-center justify-between border-t border-line/70 pt-3">
        <span className="text-[0.68rem] text-ink-subtle">Peak utilization</span>
        <span className="text-xs font-semibold text-ink tabular-nums">87.5%</span>
      </div>
    </section>
  )
}

function CareTeamCard({ onNotice }: { onNotice: (message: string) => void }) {
  const careTeam = [
    { initials: "MC", name: "Dr. Maya Chen", role: "Cardiology", avatarClassName: "bg-[#d8ebe7] text-[#1a7468]" },
    { initials: "ER", name: "Dr. Elias Reed", role: "Internal medicine", avatarClassName: "bg-[#f8e7c9] text-[#a16118]" },
    { initials: "PS", name: "Dr. Priya Shah", role: "Family medicine", avatarClassName: "bg-[#e1e1f5] text-[#5554a4]" },
  ]

  return (
    <section aria-labelledby="care-team-title" className={`${panelClassName} p-5 sm:p-6`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-brand-strong">People</p>
          <h2 className="mt-1.5 font-display text-lg font-semibold tracking-[-0.035em] text-ink" id="care-team-title">Care team on duty</h2>
        </div>
        <span className="flex items-center gap-1.5 text-[0.68rem] font-semibold text-brand-strong"><span className="h-1.5 w-1.5 rounded-full bg-success" />12 online</span>
      </div>
      <div className="mt-4 space-y-3">
        {careTeam.map((member) => (
          <div className="flex items-center gap-3" key={member.name}>
            <span className={cn("flex h-8 w-8 items-center justify-center rounded-full text-[0.62rem] font-bold", member.avatarClassName)}>{member.initials}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-ink">{member.name}</p>
              <p className="mt-0.5 truncate text-[0.68rem] text-ink-subtle">{member.role}</p>
            </div>
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
          </div>
        ))}
      </div>
      <button className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-strong transition-colors hover:text-brand" onClick={() => onNotice("Opening the full care team directory.")} type="button">
        View team directory
        <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
      </button>
    </section>
  )
}

export function DashboardPage() {
  const shouldReduceMotion = useReducedMotion()
  const [activeItem, setActiveItem] = useState("Overview")
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [period, setPeriod] = useState<Period>("7D")
  const [selectedDay, setSelectedDay] = useState<AppointmentDay>("Tue")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [notice, setNotice] = useState("Synced 2 minutes ago")
  const refreshTimeoutRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current !== undefined) {
        window.clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [])

  const handleNotice = (message: string) => {
    setNotice(message)
  }

  const handleNavigate = (label: string) => {
    setActiveItem(label)
    setNotice(label === "Overview" ? "Overview selected. Synced 2 minutes ago" : `${label} workspace selected.`)
  }

  const handleRefresh = () => {
    if (isRefreshing) {
      return
    }

    setIsRefreshing(true)
    setNotice("Refreshing clinic data...")
    refreshTimeoutRef.current = window.setTimeout(() => {
      setIsRefreshing(false)
      setNotice("Synced just now")
    }, 850)
  }

  return (
    <div className="dashboard-shell min-h-screen text-ink">
      <div className="flex min-h-screen">
        <aside className="hidden shrink-0 lg:flex" aria-label="Sidebar navigation">
          <SidebarContent activeItem={activeItem} onNavigate={handleNavigate} />
        </aside>

        <AnimatePresence>
          {mobileNavOpen ? (
            <>
              <motion.button
                aria-label="Close navigation"
                animate={{ opacity: 1 }}
                className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-sm lg:hidden"
                exit={{ opacity: 0 }}
                initial={{ opacity: shouldReduceMotion ? 1 : 0 }}
                onClick={() => setMobileNavOpen(false)}
                type="button"
              />
              <motion.aside
                animate={{ x: 0 }}
                aria-label="Mobile sidebar navigation"
                className="fixed inset-y-0 left-0 z-50 lg:hidden"
                exit={{ x: shouldReduceMotion ? 0 : "-100%" }}
                initial={{ x: shouldReduceMotion ? 0 : "-100%" }}
                transition={{ damping: 30, stiffness: 320, type: "spring" }}
              >
                <SidebarContent activeItem={activeItem} onClose={() => setMobileNavOpen(false)} onNavigate={handleNavigate} />
              </motion.aside>
            </>
          ) : null}
        </AnimatePresence>

        <main className="min-w-0 flex-1">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-[1680px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8"
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <header className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <button aria-expanded={mobileNavOpen} aria-label="Open navigation" className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-panel text-ink-muted shadow-sm transition-colors hover:border-brand/40 hover:text-ink lg:hidden" onClick={() => setMobileNavOpen(true)} type="button">
                  <Menu aria-hidden="true" className="h-5 w-5" />
                </button>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-ink-subtle">
                    <span className="inline-flex items-center gap-1.5 font-medium"><span className="h-1.5 w-1.5 rounded-full bg-success" />Tuesday, June 18, 2024</span>
                    <span aria-hidden="true" className="text-line">/</span>
                    <span>{activeItem === "Overview" ? "Clinic overview" : activeItem}</span>
                  </div>
                  <h1 className="mt-2 font-display text-[clamp(1.75rem,3vw,2.35rem)] font-semibold tracking-[-0.055em] text-ink">Good morning, Jordan</h1>
                  <p className="mt-1 max-w-xl text-sm leading-6 text-ink-muted">Here is what is happening across Northstar Clinic today.</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 xl:pt-1">
                <p aria-live="polite" className="mr-1 hidden text-[0.68rem] text-ink-subtle sm:block">{notice}</p>
                <button aria-label="Refresh clinic data" className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-panel text-ink-muted shadow-sm transition-colors hover:border-brand/40 hover:text-ink" disabled={isRefreshing} onClick={handleRefresh} title="Refresh data" type="button">
                  <RefreshCw aria-hidden="true" className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                </button>
                <button aria-label="View notifications" className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-panel text-ink-muted shadow-sm transition-colors hover:border-brand/40 hover:text-ink" onClick={() => handleNotice("You are all caught up. No new alerts.")} type="button">
                  <Bell aria-hidden="true" className="h-4 w-4" />
                  <span className="absolute right-2.5 top-2 h-1.5 w-1.5 rounded-full bg-rose" />
                </button>
                <button className="inline-flex items-center gap-2 rounded-xl bg-brand px-3.5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_-16px_var(--brand)] transition-colors hover:bg-brand-strong focus-visible:outline-none" onClick={() => handleNotice("New appointment flow ready to start.")} type="button">
                  <Plus aria-hidden="true" className="h-4 w-4" strokeWidth={2.5} />
                  <span>New appointment</span>
                </button>
              </div>
            </header>

            <section aria-label="Clinic key performance indicators" className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {metrics.map((metric, index) => (
                <KpiCard index={index} key={metric.label} metric={metric} shouldReduceMotion={shouldReduceMotion} />
              ))}
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(350px,0.65fr)]">
              <div className="relative">
                <VisitsChart period={period} />
                <div className="absolute right-5 top-[4.55rem] flex items-center gap-1 rounded-xl border border-line bg-panel-raised p-1 shadow-sm sm:right-6">
                  {(["7D", "30D", "90D"] as Period[]).map((option) => (
                    <button aria-pressed={period === option} className={cn("rounded-lg px-2.5 py-1.5 text-[0.68rem] font-semibold transition-colors focus-visible:outline-none", period === option ? "bg-brand-soft text-brand-strong" : "text-ink-subtle hover:text-ink")} key={option} onClick={() => setPeriod(option)} type="button">{option}</button>
                  ))}
                </div>
              </div>
              <AppointmentPanel onDayChange={setSelectedDay} onViewSchedule={() => { handleNavigate("Appointments") }} selectedDay={selectedDay} shouldReduceMotion={shouldReduceMotion} />
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(350px,0.75fr)]">
              <PatientTable onNotice={handleNotice} shouldReduceMotion={shouldReduceMotion} />
              <div className="space-y-6">
                <CapacityCard />
                <CareTeamCard onNotice={handleNotice} />
              </div>
            </section>

            <footer className="mt-7 flex flex-col gap-2 border-t border-line/70 pt-4 text-[0.68rem] text-ink-subtle sm:flex-row sm:items-center sm:justify-between">
              <p>Private workspace · Data refreshed automatically every 5 minutes</p>
              <button className="inline-flex items-center gap-1.5 font-semibold text-brand-strong transition-colors hover:text-brand" onClick={() => handleNotice("Report export is being prepared.")} type="button">
                <Download aria-hidden="true" className="h-3.5 w-3.5" />
                Export report
              </button>
            </footer>
          </motion.div>
        </main>
      </div>
    </div>
  )
}
