import { zodResolver } from "@hookform/resolvers/zod"
import { MailCheck } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { Link } from "react-router-dom"

import { AuthBackLink, AuthLayout } from "@/features/auth/components/auth-layout"
import {
  FormAlert,
  FormErrorSummary,
  SubmitButton,
  SuccessAlert,
  TextField,
} from "@/features/auth/components/form-controls"
import { requestPasswordReset } from "@/features/auth/api/auth-api"
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "@/features/auth/schemas/auth-schemas"
import { getAuthErrorMessage } from "@/features/auth/utils/auth-errors"
import { getFormErrorMessages } from "@/features/auth/utils/form-errors"

export function ForgotPasswordPage() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [completed, setCompleted] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    defaultValues: { email: "" },
    mode: "onBlur",
    resolver: zodResolver(forgotPasswordSchema),
    shouldFocusError: true,
  })

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setServerError(null)

    try {
      await requestPasswordReset(values)
      setCompleted(true)
    } catch (error) {
      setServerError(
        getAuthErrorMessage(error, "No pudimos procesar la solicitud. Intenta nuevamente.")
      )
    }
  }

  const validationMessages = getFormErrorMessages(errors)

  return (
    <AuthLayout
      description="Te enviaremos instrucciones si el correo corresponde a una cuenta de MediCore."
      eyebrow="Recuperación de acceso"
      footer={<AuthBackLink to="/login">Volver al inicio de sesión</AuthBackLink>}
      title="Recupera tu contraseña"
    >
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-brand/20 bg-brand-soft/60 px-4 py-3">
        <MailCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-brand-strong" />
        <p className="text-xs leading-5 text-ink-muted">
          Por seguridad, no confirmamos si un correo está registrado.
        </p>
      </div>
      {completed ? (
        <div className="space-y-5">
          <SuccessAlert message="Si el correo existe, recibirás instrucciones para restablecer tu contraseña." />
          <Link
            className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-line bg-panel-raised px-4 text-sm font-semibold text-ink-muted transition-colors hover:border-brand/40 hover:text-ink"
            to="/login"
          >
            Volver a iniciar sesión
          </Link>
        </div>
      ) : (
        <form className="space-y-5" noValidate onSubmit={handleSubmit(onSubmit)}>
          <FormErrorSummary messages={validationMessages} />
          {serverError ? <FormAlert message={serverError} /> : null}
          <TextField
            autoComplete="email"
            error={errors.email?.message}
            id="forgot-email"
            label="Correo electrónico"
            placeholder="nombre@hospital.com"
            registration={register("email")}
            type="email"
          />
          <SubmitButton isSubmitting={isSubmitting}>Enviar instrucciones</SubmitButton>
        </form>
      )}
    </AuthLayout>
  )
}
