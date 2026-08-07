using Hospital.Domain.Common;
using Hospital.Domain.Enums;
using MediatR;

namespace Hospital.Application.Features.Appointments.Commands;

public record CreateAppointmentCommand(
    string PatientId,
    string DoctorId,
    DateTime StartDateTime,
    int DurationMinutes,
    string Notes) : IRequest<Result<string>>;

public record RescheduleAppointmentCommand(string Id, DateTime NewStartDateTime) : IRequest<Result<Unit>>;

public record CancelAppointmentCommand(string Id) : IRequest<Result<Unit>>;

public record ConfirmAppointmentCommand(string Id) : IRequest<Result<Unit>>;

public record AppointmentResponse(
    string Id,
    string PatientId,
    string DoctorId,
    DateTime StartDateTime,
    int DurationMinutes,
    AppointmentStatus Status,
    string Notes);