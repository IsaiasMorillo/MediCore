import { apiRequest } from "@/lib/api/client"
import type { LoginResponse } from "@/lib/auth/session"

import type {
  ForgotPasswordInput,
  RegisterPatientAccountInput,
  RegisterUserInput,
  ResetPasswordInput,
} from "@/features/auth/types"

interface CreatedResourceResponse {
  id: string
}

interface ForgotPasswordResponse {
  message: string
}

export function login(input: { email: string; password: string }) {
  return apiRequest<LoginResponse>("/api/auth/login", {
    body: JSON.stringify(input),
    method: "POST",
  })
}

export function requestPasswordReset(input: ForgotPasswordInput) {
  return apiRequest<ForgotPasswordResponse>("/api/auth/forgot-password", {
    body: JSON.stringify(input),
    method: "POST",
  })
}

export function resetPassword(input: ResetPasswordInput) {
  return apiRequest<void>("/api/auth/reset-password", {
    body: JSON.stringify(input),
    method: "POST",
  })
}

export function registerUser(input: RegisterUserInput) {
  return apiRequest<CreatedResourceResponse>("/api/auth/register", {
    body: JSON.stringify(input),
    method: "POST",
  })
}

export function registerPatientAccount(input: RegisterPatientAccountInput) {
  return apiRequest<CreatedResourceResponse>("/api/auth/patient-account", {
    body: JSON.stringify(input),
    method: "POST",
  })
}
