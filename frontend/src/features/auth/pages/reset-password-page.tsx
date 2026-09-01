import { zodResolver } from "@hookform/resolvers/zod"
import { KeyRound } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { Link, useSearchParams } from "react-router-dom"

import { AuthBackLink, AuthLayout } from "@/features/auth/components/auth-layout"
import {
  FormAlert,
  FormErrorSummary,
  PasswordField,
  SubmitButton,
  SuccessAlert,
  TextField,
} from "@/features/auth/components/form-controls"
import { resetPassword } from "@/features/auth/api/auth-api"
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "@/features/auth/schemas/auth-schemas"
import { getAuthErrorMessage } from "@/features/auth/utils/auth-errors"
import { getFormErrorMessages } from "@/features/auth/utils/form-errors"

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const tokenFromUrl = searchParams.get("token")?.trim() ?? ""
  const [serverError, setServerError] = useState<string | null>(null)
  const [completed, setCompleted] = useState(false)
  const {
    register,
    handleSubmit,
    reset: resetForm,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    defaultValues: { confirmPassword: "", newPassword: "", token: tokenFromUrl },
    mode: "onBlur",
    resolver: zodResolver(resetPasswordSchema),
    shouldFocusError: true,
  })

  useEffect(() => {
    resetForm({ confirmPassword: "", newPassword: "", token: tokenFromUrl })
  }, [resetForm, tokenFromUrl])

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setServerError(null)

    try {
      await resetPassword({ newPassword: values.newPassword, token: values.token })
      setCompleted(true)
    } catch (error) {
      setServerError(
        getAuthErrorMessage(error, "No pudimos restablecer la contraseña. Solicita un código nuevo.")
      )
    }
  }

  const validationMessages = getFormErrorMessages(errors)

  return (
    <AuthLayout
      description="Usa el código recibido por correo y define una contraseña nueva para tu cuenta."
      eyebrow="Restablecer acceso"
      footer={<AuthBackLink to="/login">Volver al inicio de sesión</AuthBackLink>}
      title="Crea una contraseña nueva"
    >
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-line/70 bg-canvas/70 px-4 py-3">
        <KeyRound aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-brand-strong" />
        <p className="text-xs leading-5 text-ink-muted">
          El código es de un solo uso y expira después de un tiempo limitado.
        </p>
      </div>
      {completed ? (
        <div className="space-y-5">
          <SuccessAlert message="Tu contraseña fue actualizada. Ya puedes iniciar sesión con la nueva clave." />
          <Link
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-brand px-4 text-sm font-semibold text-white shadow-[0_12px_24px_-16px_var(--brand)] transition-colors hover:bg-brand-strong"
            to="/login"
          >
            Ir a iniciar sesión
          </Link>
        </div>
      ) : (
        <form className="space-y-5" noValidate onSubmit={handleSubmit(onSubmit)}>
          <FormErrorSummary messages={validationMessages} />
          {serverError ? <FormAlert message={serverError} /> : null}
          <TextField
            autoComplete="one-time-code"
            error={errors.token?.message}
            hint="Pega el código incluido en el correo de recuperación."
            id="reset-token"
            label="Código de recuperación"
            placeholder="Código recibido"
            registration={register("token")}
            type="text"
          />
          <PasswordField
            autoComplete="new-password"
            error={errors.newPassword?.message}
            hint="Usa al menos 8 caracteres."
            id="reset-password"
            label="Nueva contraseña"
            registration={register("newPassword")}
          />
          <PasswordField
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            id="reset-confirm-password"
            label="Confirmar contraseña"
            registration={register("confirmPassword")}
          />
          <SubmitButton isSubmitting={isSubmitting}>Actualizar contraseña</SubmitButton>
        </form>
      )}
    </AuthLayout>
  )
}
