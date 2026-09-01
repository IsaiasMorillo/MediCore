import type { UserRole } from "@/lib/permissions/roles"

export interface RegisterUserInput {
  email: string
  fullName: string
  password: string
  roles: UserRole[]
}

export interface RegisterPatientAccountInput {
  patientId: string
  email: string
  fullName: string
  password: string
}

export interface ForgotPasswordInput {
  email: string
}

export interface ResetPasswordInput {
  token: string
  newPassword: string
}
