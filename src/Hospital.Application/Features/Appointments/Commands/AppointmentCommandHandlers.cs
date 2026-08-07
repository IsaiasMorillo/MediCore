using Hospital.Application.Services;
using Hospital.Domain.Common;
using Hospital.Domain.Entities;
using Hospital.Domain.Enums;
using Hospital.Domain.Interfaces;
using MediatR;

namespace Hospital.Application.Features.Appointments.Commands;

public class CreateAppointmentCommandHandler(
    IPatientRepository patientRepository,
    IDoctorRepository doctorRepository,
    IAppointmentRepository appointmentRepository)
    : IRequestHandler<CreateAppointmentCommand, Result<string>>
{
    public async Task<Result<string>> Handle(CreateAppointmentCommand command, CancellationToken cancellationToken)
    {
        var patient = await patientRepository.GetByIdAsync(command.PatientId, cancellationToken);
        if (patient is null)
        {
            return Result.Failure<string>("Paciente no encontrado.", ErrorType.NotFound);
        }

        var doctor = await doctorRepository.GetByIdAsync(command.DoctorId, cancellationToken);
        if (doctor is null)
        {
            return Result.Failure<string>("Médico no encontrado.", ErrorType.NotFound);
        }

        if (command.StartDateTime <= DateTime.UtcNow)
        {
            return Result.Failure<string>("La cita debe programarse en una fecha futura.");
        }

        var duration = command.DurationMinutes <= 0 ? AppointmentScheduler.DefaultSlotMinutes : command.DurationMinutes;

        var appointments = await appointmentRepository.GetOverlappingAsync(
            command.DoctorId,
            command.StartDateTime,
            command.StartDateTime.AddMinutes(duration),
            excludeAppointmentId: null,
            cancellationToken);

        if (!AppointmentScheduler.IsAvailable(doctor, appointments, command.StartDateTime, duration))
        {
            return Result.Failure<string>("El horario solicitado no está disponible para este médico.", ErrorType.Conflict);
        }

        var appointment = new Appointment
        {
            PatientId = command.PatientId,
            DoctorId = command.DoctorId,
            StartDateTime = command.StartDateTime,
            DurationMinutes = duration,
            EndDateTime = command.StartDateTime.AddMinutes(duration),
            Notes = command.Notes ?? string.Empty
        };

        await appointmentRepository.AddAsync(appointment, cancellationToken);
        return Result.Success(appointment.Id);
    }
}

public class RescheduleAppointmentCommandHandler(
    IDoctorRepository doctorRepository,
    IAppointmentRepository appointmentRepository)
    : IRequestHandler<RescheduleAppointmentCommand, Result<Unit>>
{
    public async Task<Result<Unit>> Handle(RescheduleAppointmentCommand command, CancellationToken cancellationToken)
    {
        var appointment = await appointmentRepository.GetByIdAsync(command.Id, cancellationToken);
        if (appointment is null)
        {
            return Result.Failure<Unit>("Cita no encontrada.", ErrorType.NotFound);
        }

        if (appointment.Status == AppointmentStatus.Cancelled || appointment.Status == AppointmentStatus.Completed)
        {
            return Result.Failure<Unit>("No se puede reprogramar una cita cancelada o completada.", ErrorType.Conflict);
        }

        var doctor = await doctorRepository.GetByIdAsync(appointment.DoctorId, cancellationToken);
        if (doctor is null)
        {
            return Result.Failure<Unit>("Médico no encontrado.", ErrorType.NotFound);
        }

        var appointments = await appointmentRepository.GetOverlappingAsync(
            appointment.DoctorId,
            command.NewStartDateTime,
            command.NewStartDateTime.AddMinutes(appointment.DurationMinutes),
            excludeAppointmentId: appointment.Id,
            cancellationToken);

        if (!AppointmentScheduler.IsAvailable(doctor, appointments, command.NewStartDateTime, appointment.DurationMinutes))
        {
            return Result.Failure<Unit>("El nuevo horario no está disponible para este médico.", ErrorType.Conflict);
        }

        appointment.StartDateTime = command.NewStartDateTime;
        appointment.EndDateTime = command.NewStartDateTime.AddMinutes(appointment.DurationMinutes);
        appointment.Status = AppointmentStatus.Rescheduled;
        appointment.UpdatedAt = DateTime.UtcNow;

        await appointmentRepository.UpdateAsync(appointment, cancellationToken);
        return Result.Success(Unit.Value);
    }
}

public class CancelAppointmentCommandHandler(IAppointmentRepository appointmentRepository)
    : IRequestHandler<CancelAppointmentCommand, Result<Unit>>
{
    public async Task<Result<Unit>> Handle(CancelAppointmentCommand command, CancellationToken cancellationToken)
    {
        var appointment = await appointmentRepository.GetByIdAsync(command.Id, cancellationToken);
        if (appointment is null)
        {
            return Result.Failure<Unit>("Cita no encontrada.", ErrorType.NotFound);
        }

        if (appointment.Status == AppointmentStatus.Cancelled)
        {
            return Result.Failure<Unit>("La cita ya está cancelada.", ErrorType.Conflict);
        }

        appointment.Status = AppointmentStatus.Cancelled;
        appointment.UpdatedAt = DateTime.UtcNow;

        await appointmentRepository.UpdateAsync(appointment, cancellationToken);
        return Result.Success(Unit.Value);
    }
}

public class ConfirmAppointmentCommandHandler(IAppointmentRepository appointmentRepository)
    : IRequestHandler<ConfirmAppointmentCommand, Result<Unit>>
{
    public async Task<Result<Unit>> Handle(ConfirmAppointmentCommand command, CancellationToken cancellationToken)
    {
        var appointment = await appointmentRepository.GetByIdAsync(command.Id, cancellationToken);
        if (appointment is null)
        {
            return Result.Failure<Unit>("Cita no encontrada.", ErrorType.NotFound);
        }

        if (appointment.Status == AppointmentStatus.Cancelled)
        {
            return Result.Failure<Unit>("No se puede confirmar una cita cancelada.", ErrorType.Conflict);
        }

        appointment.Status = AppointmentStatus.Confirmed;
        appointment.UpdatedAt = DateTime.UtcNow;

        await appointmentRepository.UpdateAsync(appointment, cancellationToken);
        return Result.Success(Unit.Value);
    }
}