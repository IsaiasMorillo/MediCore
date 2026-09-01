import { ApiError } from "@/lib/api/client"

export function getAuthErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof ApiError)) {
    return fallback
  }

  if (error.status === 401) {
    return "El correo o la contraseña no son correctos."
  }

  return error.message || fallback
}

export function getAccountCreationErrorMessage(error: unknown) {
  return getAuthErrorMessage(
    error,
    "No pudimos crear la cuenta. Revisa los datos e intenta nuevamente."
  )
}
