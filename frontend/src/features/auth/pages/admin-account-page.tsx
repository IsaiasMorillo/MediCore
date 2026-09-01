import { zodResolver } from "@hookform/resolvers/zod"
import { AlertTriangle, CheckCircle2 } from "lucide-react"
import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { Link } from "react-router-dom"

import { AccountPageLayout } from "@/features/auth/components/account-page-layout"
import {
  FieldError,
  FormAlert,
  FormErrorSummary,
  FormSection,
  PasswordField,
  SubmitButton,
  SuccessAlert,
  TextField,
} from "@/features/auth/components/form-controls"
import { registerUser } from "@/features/auth/api/auth-api"
import {
  registerUserSchema,
  type RegisterUserFormValues,
} from "@/features/auth/schemas/auth-schemas"
import { getAccountCreationErrorMessage } from "@/features/auth/utils/auth-errors"
import { getFormErrorMessages } from "@/features/auth/utils/form-errors"
import { INTERNAL_ROLES, ROLE_LABELS } from "@/lib/permissions/roles"

export function AdminAccountPage() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [created, setCreated] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterUserFormValues>({
    defaultValues: {
      confirmPassword: "",
      email: "",
      fullName: "",
      password: "",
      roles: [],
    },
    mode: "onBlur",
    resolver: zodResolver(registerUserSchema),
    shouldFocusError: true,
  })
  const selectedRoles = useWatch({ control, name: "roles" })

  const onSubmit = async (values: RegisterUserFormValues) => {
    setServerError(null)
    setCreated(false)

    try {
      await registerUser({
        email: values.email,
        fullName: values.fullName,
        password: values.password,
        roles: values.roles,
      })
      setCreated(true)
      reset({ confirmPassword: "", email: "", fullName: "", password: "", roles: [] })
    } catch (error) {
      setServerError(getAccountCreationErrorMessage(error))
    }
  }

  const validationMessages = getFormErrorMessages(errors)
  const rolesError = errors.roles?.message

  return (
    <AccountPageLayout
      description="Crea una cuenta para un integrante del personal. La autorización seguirá siendo validada por el backend."
      eyebrow="Administración · Cuentas"
      title="Crear cuenta interna"
    >
      <form className="space-y-7" noValidate onSubmit={handleSubmit(onSubmit)}>
        {created ? <SuccessAlert message="La cuenta interna fue creada correctamente." /> : null}
        <FormErrorSummary messages={validationMessages} />
        {serverError ? <FormAlert message={serverError} /> : null}
        <FormSection description="Estos datos identifican al usuario dentro de MediCore." title="Datos de la cuenta">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              autoComplete="name"
              error={errors.fullName?.message}
              id="account-full-name"
              label="Nombre completo"
              placeholder="Nombre y apellido"
              registration={register("fullName")}
              type="text"
            />
            <TextField
              autoComplete="email"
              error={errors.email?.message}
              id="account-email"
              label="Correo electrónico"
              placeholder="nombre@hospital.com"
              registration={register("email")}
              type="email"
            />
          </div>
        </FormSection>
        <FormSection description="Selecciona solo roles definidos por el sistema." title="Roles y permisos">
          <fieldset aria-describedby={rolesError ? "account-roles-error" : undefined}>
            <legend className="sr-only">Roles de la cuenta</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {INTERNAL_ROLES.map((role) => (
                <label
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-line/70 bg-canvas/50 px-3.5 py-3 text-sm transition-colors has-[:checked]:border-brand/50 has-[:checked]:bg-brand-soft/50"
                  key={role}
                >
                  <input
                    {...register("roles")}
                    className="h-4 w-4 accent-[var(--brand)]"
                    type="checkbox"
                    value={role}
                  />
                  <span className="font-medium text-ink">{ROLE_LABELS[role]}</span>
                </label>
              ))}
            </div>
          </fieldset>
          {rolesError ? <FieldError id="account-roles-error" message={rolesError} /> : null}
          {selectedRoles.includes("Admin") ? (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber/30 bg-amber-soft/70 px-4 py-3" role="note">
              <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-amber-strong" />
              <p className="text-xs leading-5 text-ink-muted">
                El rol Administrador tiene acceso amplio a las funciones de MediCore. Asígnalo solo cuando sea necesario.
              </p>
            </div>
          ) : null}
        </FormSection>
        <FormSection description="La contraseña se almacena de forma segura en el backend." title="Credenciales">
          <div className="grid gap-4 sm:grid-cols-2">
            <PasswordField
              autoComplete="new-password"
              error={errors.password?.message}
              hint="Mínimo 8 caracteres."
              id="account-password"
              label="Contraseña"
              registration={register("password")}
            />
            <PasswordField
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              id="account-confirm-password"
              label="Confirmar contraseña"
              registration={register("confirmPassword")}
            />
          </div>
        </FormSection>
        <div className="border-t border-line/70 pt-5">
          <SubmitButton isSubmitting={isSubmitting}>Crear cuenta interna</SubmitButton>
        </div>
      </form>
      {created ? (
        <p className="mt-5 flex items-center gap-2 text-xs text-brand-strong">
          <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
          Puedes crear otra cuenta o continuar trabajando desde el dashboard.
        </p>
      ) : null}
      <p className="mt-5 text-center text-xs text-ink-muted">
        ¿Necesitas vincular un paciente?{" "}
        <Link className="font-semibold text-brand-strong hover:text-brand" to="/app/admin/patient-accounts/new">
          Crear cuenta de paciente
        </Link>
      </p>
    </AccountPageLayout>
  )
}
