import { describe, expect, it } from "vitest"

import {
  formatAppointmentDateTime,
  toDateInputValue,
  toTimeInputValue,
  toUtcDateTime,
} from "@/features/appointments/utils/appointment-formatting"

describe("appointment formatting", () => {
  it("keeps appointment calendar values in UTC", () => {
    expect(toUtcDateTime("2026-09-07", "09:00")).toBe("2026-09-07T09:00:00.000Z")
    expect(toDateInputValue("2026-09-07T09:00:00.000Z")).toBe("2026-09-07")
    expect(toTimeInputValue("2026-09-07T09:00:00.000Z")).toBe("09:00")
  })

  it("formats a readable appointment summary", () => {
    expect(formatAppointmentDateTime("2026-09-07T09:00:00.000Z")).toMatch(/2026|septiembre|lunes/i)
  })
})
