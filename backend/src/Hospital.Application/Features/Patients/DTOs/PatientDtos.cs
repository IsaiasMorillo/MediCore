using Hospital.Domain.Entities;

namespace Hospital.Application.Features.Patients.DTOs;

public record PatientResponse(
    string Id,
    PersonalData PersonalData,
    List<Contact> Contacts,
    MedicalInsurance? MedicalInsurance,
    ClinicalHistory ClinicalHistory,
    bool IsActive);