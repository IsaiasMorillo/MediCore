using Hospital.Application.Features.PatientPortal.Queries;
using Hospital.Application.Features.Laboratory.Commands;
using Hospital.Application.Features.Laboratory.Queries;
using Hospital.Domain.Common;
using Hospital.Domain.Entities;
using Hospital.Domain.Enums;
using Hospital.Domain.Interfaces;
using MediatR;

namespace Hospital.Application.Features.PatientPortal.Queries;

public class GetUpcomingAppointmentsQueryHandler(
    IAppointmentRepository appointmentRepository,
    IDoctorRepository doctorRepository) : IRequestHandler<GetUpcomingAppointmentsQuery, Result<IReadOnlyList<UpcomingAppointmentResponse>>>
{
    private static readonly AppointmentStatus[] ActiveStatuses =
    [
        AppointmentStatus.Scheduled,
        AppointmentStatus.Confirmed,
        AppointmentStatus.Rescheduled
    ];

    public async Task<Result<IReadOnlyList<UpcomingAppointmentResponse>>> Handle(
        GetUpcomingAppointmentsQuery query,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var appointments = await appointmentRepository.FindAsync(
            a => a.PatientId == query.PatientId,
            cancellationToken);

        var upcoming = appointments
            .Where(a => a.StartDateTime >= now && ActiveStatuses.Contains(a.Status))
            .OrderBy(a => a.StartDateTime)
            .ToList();

        if (upcoming.Count == 0)
        {
            return Result.Success((IReadOnlyList<UpcomingAppointmentResponse>)[]);
        }

        var doctors = (await doctorRepository.GetAllAsync(cancellationToken))
            .ToDictionary(d => d.Id);

        var response = upcoming.Select(a =>
        {
            doctors.TryGetValue(a.DoctorId, out var doctor);
            return new UpcomingAppointmentResponse(
                a.Id,
                a.DoctorId,
                doctor is null ? "Profesional de salud" : FormatDoctorName(doctor),
                doctor?.Specialty ?? string.Empty,
                a.StartDateTime,
                a.EndDateTime,
                a.Status,
                a.Notes);
        }).ToList();

        return Result.Success((IReadOnlyList<UpcomingAppointmentResponse>)response);
    }

    internal static string FormatDoctorName(Doctor doctor) =>
        $"{doctor.FirstName} {doctor.LastName}".Trim();
}

public class GetActivePrescriptionsQueryHandler(
    IPrescriptionRepository prescriptionRepository,
    IMedicationRepository medicationRepository,
    IDoctorRepository doctorRepository) : IRequestHandler<GetActivePrescriptionsQuery, Result<IReadOnlyList<ActivePrescriptionResponse>>>
{
    public async Task<Result<IReadOnlyList<ActivePrescriptionResponse>>> Handle(
        GetActivePrescriptionsQuery query,
        CancellationToken cancellationToken)
    {
        var prescriptions = await prescriptionRepository.GetByPatientAsync(query.PatientId, cancellationToken);
        var active = prescriptions
            .Where(p => p.Status == PrescriptionStatus.Emitida)
            .OrderByDescending(p => p.CreatedAt)
            .ToList();

        if (active.Count == 0)
        {
            return Result.Success((IReadOnlyList<ActivePrescriptionResponse>)[]);
        }

        var medications = (await medicationRepository.GetAllAsync(cancellationToken))
            .ToDictionary(m => m.Id);
        var doctors = (await doctorRepository.GetAllAsync(cancellationToken))
            .ToDictionary(d => d.Id);

        var response = active.Select(p =>
        {
            medications.TryGetValue(p.MedicationId, out var medication);
            doctors.TryGetValue(p.DoctorId, out var doctor);
            return new ActivePrescriptionResponse(
                p.Id,
                p.DoctorId,
                doctor is null ? "Profesional de salud" : GetUpcomingAppointmentsQueryHandler.FormatDoctorName(doctor),
                p.MedicationId,
                medication?.Name ?? p.MedicationId,
                p.Dosage,
                p.Frequency,
                p.Quantity,
                p.Instructions,
                p.CreatedAt);
        }).ToList();

        return Result.Success((IReadOnlyList<ActivePrescriptionResponse>)response);
    }
}

public class GetPatientLaboratoryResultsQueryHandler(
    ILaboratoryOrderRepository laboratoryOrderRepository)
    : IRequestHandler<GetPatientLaboratoryResultsQuery, Result<IReadOnlyList<LaboratoryOrderResponse>>>
{
    public async Task<Result<IReadOnlyList<LaboratoryOrderResponse>>> Handle(
        GetPatientLaboratoryResultsQuery query,
        CancellationToken cancellationToken)
    {
        var orders = await laboratoryOrderRepository.GetByPatientAsync(query.PatientId, cancellationToken);
        var results = orders
            .Where(order => order.Status == LaboratoryOrderStatus.ResultadoCargado)
            .Select(GetLaboratoryOrderQueryHandler.ToResponse)
            .ToList();

        return Result.Success((IReadOnlyList<LaboratoryOrderResponse>)results);
    }
}
