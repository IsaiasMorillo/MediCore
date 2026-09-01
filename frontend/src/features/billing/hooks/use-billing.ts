import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  billingKeys,
  cancelInvoice,
  createInvoice,
  getInvoice,
  getPatientInvoices,
  payInvoice,
} from "@/features/billing/api/billing-api"
import type { CancelInvoiceInput, CreateInvoiceInput, PayInvoiceInput } from "@/features/billing/types"

export function useInvoice(invoiceId: string | undefined) {
  return useQuery({
    enabled: Boolean(invoiceId),
    queryFn: () => getInvoice(invoiceId!),
    queryKey: billingKeys.invoice(invoiceId ?? "missing"),
  })
}

export function usePatientInvoices(patientId: string | undefined) {
  return useQuery({
    enabled: Boolean(patientId),
    placeholderData: (previousData) => previousData,
    queryFn: () => getPatientInvoices(patientId!),
    queryKey: billingKeys.patientInvoices(patientId ?? "missing"),
  })
}

export function useCreateInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateInvoiceInput) => createInvoice(input),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: billingKeys.patientInvoices(variables.patientId) })
    },
  })
}

export function usePayInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: PayInvoiceInput) => payInvoice(input),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: billingKeys.invoice(variables.id) }),
        queryClient.invalidateQueries({ queryKey: billingKeys.invoiceLists() }),
      ])
    },
  })
}

export function useCancelInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CancelInvoiceInput) => cancelInvoice(input),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: billingKeys.invoice(variables.id) }),
        queryClient.invalidateQueries({ queryKey: billingKeys.invoiceLists() }),
      ])
    },
  })
}
