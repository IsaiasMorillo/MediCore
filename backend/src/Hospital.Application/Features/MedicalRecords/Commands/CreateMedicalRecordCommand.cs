using Hospital.Application.Features.MedicalRecords.Queries;
using Hospital.Domain.Common;
using Hospital.Domain.Entities;
using MediatR;

namespace Hospital.Application.Features.MedicalRecords.Commands;

public record CreateMedicalRecordCommand(
    string PatientId,
    string DoctorId,
    string? AppointmentId,
    VitalSigns VitalSigns,
    string Diagnosis,
    string Observations,
    string TreatmentPlan) : IRequest<Result<string>>;