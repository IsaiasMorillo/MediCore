import type { FieldErrors } from "react-hook-form"

export function getFormErrorMessages(errors: FieldErrors) {
  return Object.values(errors).flatMap((error) => {
    if (error && typeof error.message === "string") {
      return [error.message]
    }

    return []
  })
}
