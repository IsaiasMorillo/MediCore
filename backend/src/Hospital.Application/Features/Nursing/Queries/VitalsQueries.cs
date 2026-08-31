using Hospital.Domain.Common;
using Hospital.Domain.Entities;
using MediatR;

namespace Hospital.Application.Features.Nursing.Queries;

public record GetPatientVitalsQuery(string PatientId)
    : IRequest<Result<IReadOnlyList<VitalsRecordResponse>>>;

public record VitalsRecordResponse(
    string Id,
    string PatientId,
    string? AppointmentId,
    VitalSigns VitalSigns,
    string Notes,
    string RecordedBy,
    DateTime RecordedAt);