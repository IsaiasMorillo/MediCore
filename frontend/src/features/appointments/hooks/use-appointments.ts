import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import {
  appointmentKeys,
  cancelAppointment,
  confirmAppointment,
  createAppointment,
  getAppointment,
  getDoctorAvailability,
  getGlobalAvailability,
  rescheduleAppointment,
} from "@/features/appointments/api/appointments-api"
import type {
  CreateAppointmentInput,
  RescheduleAppointmentInput,
} from "@/features/appointments/types"

export function useAppointment(id: string | undefined) {
  return useQuery({
    enabled: Boolean(id),
    queryFn: () => getAppointment(id!),
    queryKey: appointmentKeys.detail(id ?? "missing"),
  })
}

export function useDoctorAvailability(
  doctorId: string,
  date: string,
  enabled = true
) {
  return useQuery({
    enabled: enabled && Boolean(doctorId) && Boolean(date),
    queryFn: () => getDoctorAvailability(doctorId, date),
    queryKey: appointmentKeys.doctorAvailability(doctorId || "missing", date || "missing"),
  })
}

export function useGlobalAvailability(date: string, enabled = true) {
  return useQuery({
    enabled: enabled && Boolean(date),
    queryFn: () => getGlobalAvailability(date),
    queryKey: appointmentKeys.globalAvailability(date || "missing"),
  })
}

function useAppointmentMutation<TVariables, TData>(
  mutationFn: (variables: TVariables) => Promise<TData>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: appointmentKeys.all() })
    },
  })
}

export function useCreateAppointment() {
  return useAppointmentMutation((input: CreateAppointmentInput) => createAppointment(input))
}

export function useRescheduleAppointment() {
  return useAppointmentMutation(({ id, input }: { id: string; input: RescheduleAppointmentInput }) =>
    rescheduleAppointment(id, input)
  )
}

export function useConfirmAppointment() {
  return useAppointmentMutation((id: string) => confirmAppointment(id))
}

export function useCancelAppointment() {
  return useAppointmentMutation((id: string) => cancelAppointment(id))
}
