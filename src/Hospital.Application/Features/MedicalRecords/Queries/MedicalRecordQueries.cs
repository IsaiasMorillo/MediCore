using Hospital.Domain.Common;
using Hospital.Domain.Entities;
using MediatR;

namespace Hospital.Application.Features.MedicalRecords.Queries;

public record GetMedicalRecordQuery(string Id) : IRequest<Result<MedicalRecordResponse>>;

public record GetPatientMedicalRecordsQuery(string PatientId) : IRequest<Result<IReadOnlyList<MedicalRecordResponse>>>;

public record SearchPatientClinicalHistoryQuery(string Term)
    : IRequest<Result<IReadOnlyList<PatientClinicalHistoryResponse>>>;

public record MedicalRecordResponse(
    string Id,
    string PatientId,
    string DoctorId,
    string? AppointmentId,
    DateTime ConsultationDate,
    VitalSigns VitalSigns,
    string Diagnosis,
    string Observations,
    string TreatmentPlan,
    List<string> PrescriptionIds,
    List<string> LaboratoryOrderIds);

public record PatientClinicalHistoryResponse(
    string PatientId,
    string PatientName,
    string DocumentId,
    ClinicalHistory ClinicalHistory,
    IReadOnlyList<MedicalRecordResponse> MedicalRecords);