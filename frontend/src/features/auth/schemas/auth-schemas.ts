import { z } from "zod"

import { INTERNAL_ROLES } from "@/lib/permissions/roles"

const email = z.string().trim().email("Ingresa un correo electrónico válido.")
const password = z.string().min(8, "La contraseña debe tener al menos 8 caracteres.")

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Ingresa tu contraseña."),
})

export const forgotPasswordSchema = z.object({ email })

export const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(1, "Ingresa el código de recuperación."),
    newPassword: password,
    confirmPassword: z.string().min(1, "Confirma tu nueva contraseña."),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  })

export const internalRoleSchema = z.enum(INTERNAL_ROLES)

export const registerUserSchema = z
  .object({
    email,
    fullName: z.string().trim().min(2, "Ingresa el nombre completo."),
    password,
    confirmPassword: z.string().min(1, "Confirma la contraseña."),
    roles: z.array(internalRoleSchema).min(1, "Selecciona al menos un rol."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  })

export const registerPatientAccountSchema = z
  .object({
    patientId: z.string().trim().min(1, "Ingresa el ID del paciente."),
    email,
    fullName: z.string().trim().min(2, "Ingresa el nombre completo."),
    password,
    confirmPassword: z.string().min(1, "Confirma la contraseña."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  })

export type LoginFormValues = z.infer<typeof loginSchema>
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>
export type RegisterUserFormValues = z.infer<typeof registerUserSchema>
export type RegisterPatientAccountFormValues = z.infer<typeof registerPatientAccountSchema>
