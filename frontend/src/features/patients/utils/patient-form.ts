import type {
  CreatePatientInput,
  Patient,
  PatientContact,
  PatientClinicalHistory,
  PatientInsurance,
  UpdatePatientInput,
} from "@/features/patients/types"
import { listToText, textToList, toDateInputValue } from "@/features/patients/utils/patient-formatting"
import type { PatientFormValues } from "@/features/patients/schemas/patient-schemas"

export function toCreatePatientInput(values: PatientFormValues): CreatePatientInput {
  return {
    ...toPatientBaseInput(values),
  }
}

export function toUpdatePatientInput(values: PatientFormValues): UpdatePatientInput {
  return {
    ...toPatientBaseInput(values),
    isActive: values.isActive,
  }
}

export function getPatientFormDefaultValues(patient?: Patient): PatientFormValues {
  return {
    allergies: listToText(patient?.clinicalHistory.allergies),
    chronicDiseases: listToText(patient?.clinicalHistory.chronicDiseases),
    contacts: patient?.contacts.map(toFormContact) ?? [],
    currentMedications: listToText(patient?.clinicalHistory.currentMedications),
    dateOfBirth: toDateInputValue(patient?.personalData.dateOfBirth),
    documentId: patient?.personalData.documentId ?? "",
    familyHistory: listToText(patient?.clinicalHistory.familyHistory),
    firstName: patient?.personalData.firstName ?? "",
    gender: patient?.personalData.gender ?? "",
    insuranceCoverageType: patient?.medicalInsurance?.coverageType ?? "",
    insuranceEnabled: Boolean(patient?.medicalInsurance),
    insurancePolicyNumber: patient?.medicalInsurance?.policyNumber ?? "",
    insuranceProvider: patient?.medicalInsurance?.provider ?? "",
    isActive: patient?.isActive ?? true,
    lastName: patient?.personalData.lastName ?? "",
  }
}

function toPatientBaseInput(values: PatientFormValues) {
  const medicalInsurance: PatientInsurance | null = values.insuranceEnabled
    ? {
        coverageType: values.insuranceCoverageType,
        policyNumber: values.insurancePolicyNumber,
        provider: values.insuranceProvider,
      }
    : null
  const clinicalHistory: PatientClinicalHistory = {
    allergies: textToList(values.allergies),
    chronicDiseases: textToList(values.chronicDiseases),
    currentMedications: textToList(values.currentMedications),
    familyHistory: textToList(values.familyHistory),
  }

  return {
    clinicalHistory,
    contacts: values.contacts.map(toPatientContact),
    dateOfBirth: values.dateOfBirth || null,
    documentId: values.documentId,
    firstName: values.firstName,
    gender: values.gender,
    lastName: values.lastName,
    medicalInsurance,
  }
}

function toPatientContact(contact: PatientFormValues["contacts"][number]): PatientContact {
  const isEmergency = contact.type === "Emergency"

  return {
    name: contact.name || null,
    phone: contact.phone || null,
    type: contact.type,
    value: isEmergency ? contact.phone : contact.value,
  }
}

function toFormContact(contact: PatientContact) {
  const isEmergency = contact.type === "Emergency"

  return {
    name: contact.name ?? "",
    phone: isEmergency ? contact.phone ?? contact.value : contact.phone ?? "",
    type: contact.type || "Phone",
    value: isEmergency ? "" : contact.value,
  }
}
