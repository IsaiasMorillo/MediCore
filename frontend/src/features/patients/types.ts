export interface PatientPersonalData {
  firstName: string
  lastName: string
  documentId: string
  dateOfBirth: string | null
  gender: string
}

export interface PatientContact {
  type: string
  value: string
  name?: string | null
  phone?: string | null
}

export interface PatientInsurance {
  provider: string
  policyNumber: string
  coverageType: string
}

export interface PatientClinicalHistory {
  allergies: string[]
  chronicDiseases: string[]
  currentMedications: string[]
  familyHistory: string[]
}

export interface Patient {
  id: string
  personalData: PatientPersonalData
  contacts: PatientContact[]
  medicalInsurance: PatientInsurance | null
  clinicalHistory: PatientClinicalHistory
  isActive: boolean
}

export interface CreatePatientInput {
  firstName: string
  lastName: string
  documentId: string
  dateOfBirth: string | null
  gender: string
  contacts: PatientContact[]
  medicalInsurance: PatientInsurance | null
  clinicalHistory: PatientClinicalHistory
}

export interface UpdatePatientInput extends CreatePatientInput {
  isActive: boolean
}
