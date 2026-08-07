using Hospital.Domain.Common;
using Hospital.Domain.Entities;
using MediatR;

namespace Hospital.Application.Features.Nursing.Commands;

public record CreateVitalsRecordCommand(
    string PatientId,
    string? AppointmentId,
    VitalSigns VitalSigns,
    string Notes,
    string RecordedBy) : IRequest<Result<string>>;