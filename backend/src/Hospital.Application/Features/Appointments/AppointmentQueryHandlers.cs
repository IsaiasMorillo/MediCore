using Hospital.Application.Features.Appointments.Commands;
using Hospital.Application.Features.Appointments.Queries;
using Hospital.Application.Services;
using Hospital.Domain.Common;
using Hospital.Domain.Entities;
using Hospital.Domain.Enums;
using Hospital.Domain.Interfaces;
using MediatR;

namespace Hospital.Application.Features.Appointments;

public class GetAppointmentQueryHandler(IAppointmentRepository appointmentRepository)
    : IRequestHandler<GetAppointmentQuery, Result<AppointmentResponse>>
{
    public async Task<Result<AppointmentResponse>> Handle(
        GetAppointmentQuery query,
        CancellationToken cancellationToken)
    {
        var appointment = await appointmentRepository.GetByIdAsync(query.Id, cancellationToken);
        if (appointment is null)
        {
            return Result.Failure<AppointmentResponse>("Cita no encontrada.", ErrorType.NotFound);
        }

        return Result.Success(ToResponse(appointment));
    }

    internal static AppointmentResponse ToResponse(Appointment appointment) => new(
        appointment.Id,
        appointment.PatientId,
        appointment.DoctorId,
        appointment.StartDateTime,
        appointment.DurationMinutes,
        appointment.Status,
        appointment.Notes);
}

public class GetDoctorAvailabilityQueryHandler(
    IDoctorRepository doctorRepository,
    IAppointmentRepository appointmentRepository)
    : IRequestHandler<GetDoctorAvailabilityQuery, Result<DoctorAvailabilityResponse>>
{
    public async Task<Result<DoctorAvailabilityResponse>> Handle(
        GetDoctorAvailabilityQuery query,
        CancellationToken cancellationToken)
    {
        var doctor = await doctorRepository.GetByIdAsync(query.DoctorId, cancellationToken);
        if (doctor is null)
        {
            return Result.Failure<DoctorAvailabilityResponse>("Médico no encontrado.", ErrorType.NotFound);
        }

        var dayStart = query.Date.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var dayEnd = query.Date.AddDays(1).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);

        var appointments = await appointmentRepository.GetByDoctorAndDateAsync(
            query.DoctorId,
            dayStart,
            dayEnd,
            cancellationToken);

        var activeAppointments = appointments
            .Where(a => a.Status != AppointmentStatus.Cancelled)
            .ToList();

        var freeSlots = AppointmentScheduler.ComputeFreeSlots(doctor, activeAppointments, query.Date);

        return Result.Success(new DoctorAvailabilityResponse(
            doctor.Id,
            $"{doctor.FirstName} {doctor.LastName}",
            doctor.Specialty,
            query.Date,
            freeSlots));
    }
}

public class GetGlobalAvailabilityQueryHandler(
    IDoctorRepository doctorRepository,
    IAppointmentRepository appointmentRepository)
    : IRequestHandler<GetGlobalAvailabilityQuery, Result<IReadOnlyList<DoctorAvailabilityResponse>>>
{
    public async Task<Result<IReadOnlyList<DoctorAvailabilityResponse>>> Handle(
        GetGlobalAvailabilityQuery query,
        CancellationToken cancellationToken)
    {
        var doctors = await doctorRepository.GetAllAsync(cancellationToken);
        var activeDoctors = doctors
            .Where(d => d.IsActive)
            .OrderBy(d => d.FirstName)
            .ToList();

        if (activeDoctors.Count == 0)
        {
            return Result.Success((IReadOnlyList<DoctorAvailabilityResponse>)[]);
        }

        var dayStart = query.Date.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var dayEnd = query.Date.AddDays(1).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);

        var appointments = await appointmentRepository.FindAsync(
            a => a.StartDateTime >= dayStart && a.StartDateTime < dayEnd,
            cancellationToken);

        var appointmentsByDoctor = appointments
            .Where(a => a.Status != AppointmentStatus.Cancelled)
            .GroupBy(a => a.DoctorId)
            .ToDictionary(g => g.Key, g => (IReadOnlyList<Appointment>)g.ToList());

        var response = activeDoctors.Select(doctor =>
        {
            appointmentsByDoctor.TryGetValue(doctor.Id, out var doctorAppointments);
            var freeSlots = AppointmentScheduler.ComputeFreeSlots(
                doctor,
                doctorAppointments ?? [],
                query.Date);

            return new DoctorAvailabilityResponse(
                doctor.Id,
                $"{doctor.FirstName} {doctor.LastName}",
                doctor.Specialty,
                query.Date,
                freeSlots);
        }).ToList();

        return Result.Success((IReadOnlyList<DoctorAvailabilityResponse>)response);
    }
}