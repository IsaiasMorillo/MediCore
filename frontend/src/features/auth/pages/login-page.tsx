import { zodResolver } from "@hookform/resolvers/zod"
import { LockKeyhole } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { Link, useLocation, useNavigate } from "react-router-dom"

import {
  AuthBackLink,
  AuthLayout,
} from "@/features/auth/components/auth-layout"
import {
  FormAlert,
  FormErrorSummary,
  PasswordField,
  SubmitButton,
  TextField,
} from "@/features/auth/components/form-controls"
import { login } from "@/features/auth/api/auth-api"
import {
  loginSchema,
  type LoginFormValues,
} from "@/features/auth/schemas/auth-schemas"
import { getAuthErrorMessage } from "@/features/auth/utils/auth-errors"
import { getFormErrorMessages } from "@/features/auth/utils/form-errors"
import { getLandingPath } from "@/features/auth/utils/auth-navigation"
import { queryClient } from "@/app/query-client"
import { useAuthSession } from "@/lib/auth/use-auth-session"
import { sessionFromLoginResponse } from "@/lib/auth/session"

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setSession } = useAuthSession()
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: { email: "", password: "" },
    mode: "onBlur",
    resolver: zodResolver(loginSchema),
    shouldFocusError: true,
  })

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null)

    try {
      const response = await login(values)
      const nextSession = sessionFromLoginResponse(response)

      if (nextSession.user.roles.length === 0) {
        setServerError("La cuenta no tiene un rol habilitado para MediCore.")
        return
      }

      queryClient.clear()
      setSession(nextSession)
      const requestedPath = nextSession.user.roles.includes("Paciente")
        ? null
        : getRequestedPath(location.state)
      navigate(requestedPath ?? getLandingPath(nextSession), { replace: true })
    } catch (error) {
      setServerError(
        getAuthErrorMessage(error, "No pudimos iniciar sesión. Intenta nuevamente en unos minutos.")
      )
    }
  }

  const validationMessages = getFormErrorMessages(errors)

  return (
    <AuthLayout
      description="Ingresa con las credenciales asignadas por administración para continuar con tu jornada."
      eyebrow="Acceso seguro"
      footer={
        <p className="text-center text-xs text-ink-muted">
          ¿No recuerdas tu contraseña?{" "}
          <Link className="font-semibold text-brand-strong hover:text-brand" to="/forgot-password">
            Recupera el acceso
          </Link>
        </p>
      }
      title="Inicia sesión en MediCore"
    >
      <form className="space-y-5" noValidate onSubmit={handleSubmit(onSubmit)}>
        <div className="flex items-center gap-2 rounded-xl border border-line/70 bg-canvas/70 px-3.5 py-3 text-xs text-ink-muted">
          <LockKeyhole aria-hidden="true" className="h-4 w-4 shrink-0 text-brand-strong" />
          Tu sesión determina las secciones y acciones disponibles.
        </div>
        <FormErrorSummary messages={validationMessages} />
        {serverError ? <FormAlert message={serverError} /> : null}
        <TextField
          autoComplete="username"
          error={errors.email?.message}
          id="login-email"
          label="Correo electrónico"
          placeholder="nombre@hospital.com"
          registration={register("email")}
          type="email"
        />
        <PasswordField
          autoComplete="current-password"
          error={errors.password?.message}
          id="login-password"
          label="Contraseña"
          registration={register("password")}
        />
        <SubmitButton isSubmitting={isSubmitting}>Entrar a MediCore</SubmitButton>
      </form>
      <div className="mt-7 flex justify-center">
        <AuthBackLink to="/forgot-password">¿Olvidaste tu contraseña?</AuthBackLink>
      </div>
    </AuthLayout>
  )
}

function getRequestedPath(state: unknown) {
  if (!state || typeof state !== "object" || !("from" in state)) {
    return null
  }

  const from = state.from

  return typeof from === "string" && from.startsWith("/app") ? from : null
}
