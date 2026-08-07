using Hospital.Domain.Common;
using Hospital.Domain.Enums;
using MediatR;

namespace Hospital.Application.Features.PatientPortal.Queries;

public record GetUpcomingAppointmentsQuery(string PatientId)
    : IRequest<Result<IReadOnlyList<UpcomingAppointmentResponse>>>;

public record GetActivePrescriptionsQuery(string PatientId)
    : IRequest<Result<IReadOnlyList<ActivePrescriptionResponse>>>;

public record UpcomingAppointmentResponse(
    string Id,
    string DoctorId,
    string DoctorName,
    string Specialty,
    DateTime StartDateTime,
    DateTime EndDateTime,
    AppointmentStatus Status,
    string Notes);

public record ActivePrescriptionResponse(
    string Id,
    string DoctorId,
    string DoctorName,
    string MedicationId,
    string MedicationName,
    string Dosage,
    string Frequency,
    int Quantity,
    string Instructions,
    DateTime CreatedAt);