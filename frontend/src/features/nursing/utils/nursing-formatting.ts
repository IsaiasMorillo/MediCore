import type { VitalsRecord } from "@/features/nursing/types"
import {
  formatMedicalRecordDate,
  formatVitalSign,
  formatVitalSignsSummary,
} from "@/features/medical-records/utils/medical-record-formatting"

export { formatVitalSign, formatVitalSignsSummary }

export function formatVitalsRecordDate(value: string) {
  return formatMedicalRecordDate(value)
}

export function sortVitalsRecords(records: readonly VitalsRecord[]) {
  return [...records].sort((first, second) => {
    const secondDate = Date.parse(second.recordedAt)
    const firstDate = Date.parse(first.recordedAt)

    return (Number.isFinite(secondDate) ? secondDate : 0) - (Number.isFinite(firstDate) ? firstDate : 0)
  })
}
