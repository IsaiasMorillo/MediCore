using Hospital.Application.Features.Appointments.Commands;
using Hospital.Domain.Common;
using MediatR;

namespace Hospital.Application.Features.Appointments.Queries;

public record GetAppointmentQuery(string Id) : IRequest<Result<AppointmentResponse>>;

public record GetDoctorAvailabilityQuery(string DoctorId, DateOnly Date)
    : IRequest<Result<DoctorAvailabilityResponse>>;

public record GetGlobalAvailabilityQuery(DateOnly Date)
    : IRequest<Result<IReadOnlyList<DoctorAvailabilityResponse>>>;

public record DoctorAvailabilityResponse(
    string DoctorId,
    string DoctorName,
    string Specialty,
    DateOnly Date,
    IReadOnlyList<DateTime> FreeSlots);