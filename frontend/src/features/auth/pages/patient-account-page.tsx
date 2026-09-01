import { zodResolver } from "@hookform/resolvers/zod"
import { CheckCircle2, Info } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { Link } from "react-router-dom"

import { AccountPageLayout } from "@/features/auth/components/account-page-layout"
import {
  FormAlert,
  FormErrorSummary,
  FormSection,
  PasswordField,
  SubmitButton,
  SuccessAlert,
  TextField,
} from "@/features/auth/components/form-controls"
import { registerPatientAccount } from "@/features/auth/api/auth-api"
import {
  registerPatientAccountSchema,
  type RegisterPatientAccountFormValues,
} from "@/features/auth/schemas/auth-schemas"
import { getAccountCreationErrorMessage } from "@/features/auth/utils/auth-errors"
import { getFormErrorMessages } from "@/features/auth/utils/form-errors"

export function PatientAccountPage() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [created, setCreated] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RegisterPatientAccountFormValues>({
    defaultValues: {
      confirmPassword: "",
      email: "",
      fullName: "",
      patientId: "",
      password: "",
    },
    mode: "onBlur",
    resolver: zodResolver(registerPatientAccountSchema),
    shouldFocusError: true,
  })

  const onSubmit = async (values: RegisterPatientAccountFormValues) => {
    setServerError(null)
    setCreated(false)

    try {
      await registerPatientAccount({
        email: values.email,
        fullName: values.fullName,
        password: values.password,
        patientId: values.patientId,
      })
      setCreated(true)
      reset({
        confirmPassword: "",
        email: "",
        fullName: "",
        patientId: "",
        password: "",
      })
    } catch (error) {
      setServerError(getAccountCreationErrorMessage(error))
    }
  }

  const validationMessages = getFormErrorMessages(errors)

  return (
    <AccountPageLayout
      description="Vincula una cuenta de acceso a un paciente existente. Este flujo no crea ni modifica el expediente."
      eyebrow="Administración · Cuentas"
      title="Crear cuenta de paciente"
    >
      <form className="space-y-7" noValidate onSubmit={handleSubmit(onSubmit)}>
        {created ? <SuccessAlert message="La cuenta del paciente fue creada y vinculada correctamente." /> : null}
        <FormErrorSummary messages={validationMessages} />
        {serverError ? <FormAlert message={serverError} /> : null}
        <div className="flex items-start gap-2.5 rounded-xl border border-brand/20 bg-brand-soft/60 px-4 py-3">
          <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-brand-strong" />
          <p className="text-xs leading-5 text-ink-muted">
            El ID debe corresponder a un paciente ya registrado. El backend verificará la existencia y el vínculo.
          </p>
        </div>
        <FormSection description="Completa los datos de acceso y vincula la cuenta al paciente existente." title="Vinculación">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              autoComplete="off"
              error={errors.patientId?.message}
              hint="Ejemplo: el identificador interno del expediente."
              id="patient-account-patient-id"
              label="ID del paciente"
              placeholder="ID del paciente"
              registration={register("patientId")}
              type="text"
            />
            <TextField
              autoComplete="name"
              error={errors.fullName?.message}
              id="patient-account-full-name"
              label="Nombre completo"
              placeholder="Nombre y apellido"
              registration={register("fullName")}
              type="text"
            />
          </div>
        </FormSection>
        <FormSection title="Datos de acceso">
          <TextField
            autoComplete="email"
            error={errors.email?.message}
            id="patient-account-email"
            label="Correo electrónico"
            placeholder="nombre@correo.com"
            registration={register("email")}
            type="email"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <PasswordField
              autoComplete="new-password"
              error={errors.password?.message}
              hint="Mínimo 8 caracteres."
              id="patient-account-password"
              label="Contraseña"
              registration={register("password")}
            />
            <PasswordField
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              id="patient-account-confirm-password"
              label="Confirmar contraseña"
              registration={register("confirmPassword")}
            />
          </div>
        </FormSection>
        <div className="border-t border-line/70 pt-5">
          <SubmitButton isSubmitting={isSubmitting}>Crear cuenta de paciente</SubmitButton>
        </div>
      </form>
      {created ? (
        <p className="mt-5 flex items-center gap-2 text-xs text-brand-strong">
          <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
          El paciente podrá usar el portal cuando inicie sesión.
        </p>
      ) : null}
      <p className="mt-5 text-center text-xs text-ink-muted">
        ¿Necesitas crear una cuenta para personal?{" "}
        <Link className="font-semibold text-brand-strong hover:text-brand" to="/app/admin/accounts/new">
          Crear cuenta interna
        </Link>
      </p>
    </AccountPageLayout>
  )
}
