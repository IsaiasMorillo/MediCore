using Hospital.Application.Features.Nursing.Queries;
using Hospital.Domain.Common;
using Hospital.Domain.Entities;
using Hospital.Domain.Interfaces;
using MediatR;

namespace Hospital.Application.Features.Nursing.Commands;

public class CreateVitalsRecordCommandHandler(
    IPatientRepository patientRepository,
    IVitalsRepository vitalsRepository)
    : IRequestHandler<CreateVitalsRecordCommand, Result<string>>
{
    public async Task<Result<string>> Handle(CreateVitalsRecordCommand command, CancellationToken cancellationToken)
    {
        var patient = await patientRepository.GetByIdAsync(command.PatientId, cancellationToken);
        if (patient is null)
        {
            return Result.Failure<string>("Paciente no encontrado.", ErrorType.NotFound);
        }

        var vitalSigns = command.VitalSigns ?? new VitalSigns();
        var hasData =
            !string.IsNullOrWhiteSpace(vitalSigns.BloodPressure) ||
            vitalSigns.HeartRate.HasValue ||
            vitalSigns.Temperature.HasValue ||
            vitalSigns.WeightKg.HasValue;

        if (!hasData)
        {
            return Result.Failure<string>("Debe registrar al menos un signo vital.");
        }

        if (string.IsNullOrWhiteSpace(command.RecordedBy))
        {
            return Result.Failure<string>("No se pudo identificar al profesional que registra.");
        }

        var record = new VitalsRecord
        {
            PatientId = command.PatientId,
            AppointmentId = string.IsNullOrWhiteSpace(command.AppointmentId) ? null : command.AppointmentId,
            VitalSigns = vitalSigns,
            Notes = command.Notes ?? string.Empty,
            RecordedBy = command.RecordedBy,
            RecordedAt = DateTime.UtcNow
        };

        await vitalsRepository.AddAsync(record, cancellationToken);
        return Result.Success(record.Id);
    }
}

public class GetPatientVitalsQueryHandler(IVitalsRepository vitalsRepository)
    : IRequestHandler<GetPatientVitalsQuery, Result<IReadOnlyList<VitalsRecordResponse>>>
{
    public async Task<Result<IReadOnlyList<VitalsRecordResponse>>> Handle(
        GetPatientVitalsQuery query,
        CancellationToken cancellationToken)
    {
        var records = await vitalsRepository.GetByPatientAsync(query.PatientId, cancellationToken);
        return Result.Success(
            (IReadOnlyList<VitalsRecordResponse>)records
                .Select(ToResponse)
                .ToList());
    }

    internal static VitalsRecordResponse ToResponse(VitalsRecord record) => new(
        record.Id,
        record.PatientId,
        record.AppointmentId,
        record.VitalSigns,
        record.Notes,
        record.RecordedBy,
        record.RecordedAt);
}