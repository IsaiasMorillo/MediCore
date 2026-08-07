using Hospital.Application.Features.MedicalRecords.Queries;
using Hospital.Domain.Common;
using Hospital.Domain.Entities;
using Hospital.Domain.Interfaces;
using MediatR;

namespace Hospital.Application.Features.MedicalRecords.Commands;

public class CreateMedicalRecordCommandHandler(
    IPatientRepository patientRepository,
    IDoctorRepository doctorRepository,
    IMedicalRecordRepository medicalRecordRepository) : IRequestHandler<CreateMedicalRecordCommand, Result<string>>
{
    public async Task<Result<string>> Handle(CreateMedicalRecordCommand command, CancellationToken cancellationToken)
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

        if (string.IsNullOrWhiteSpace(command.Diagnosis))
        {
            return Result.Failure<string>("El diagnóstico es obligatorio.");
        }

        if (!string.IsNullOrWhiteSpace(command.AppointmentId))
        {
            var exists = await medicalRecordRepository.ExistsForAppointmentAsync(command.AppointmentId, cancellationToken);
            if (exists)
            {
                return Result.Failure<string>("Ya existe un registro clínico para esta consulta.", ErrorType.Conflict);
            }
        }

        var record = new MedicalRecord
        {
            PatientId = command.PatientId,
            DoctorId = command.DoctorId,
            AppointmentId = command.AppointmentId,
            ConsultationDate = DateTime.UtcNow,
            VitalSigns = command.VitalSigns ?? new VitalSigns(),
            Diagnosis = command.Diagnosis.Trim(),
            Observations = command.Observations ?? string.Empty,
            TreatmentPlan = command.TreatmentPlan ?? string.Empty
        };

        await medicalRecordRepository.AddAsync(record, cancellationToken);
        return Result.Success(record.Id);
    }
}

public class GetMedicalRecordQueryHandler(IMedicalRecordRepository medicalRecordRepository)
    : IRequestHandler<GetMedicalRecordQuery, Result<MedicalRecordResponse>>
{
    public async Task<Result<MedicalRecordResponse>> Handle(
        GetMedicalRecordQuery query,
        CancellationToken cancellationToken)
    {
        var record = await medicalRecordRepository.GetByIdAsync(query.Id, cancellationToken);
        if (record is null)
        {
            return Result.Failure<MedicalRecordResponse>("Registro clínico no encontrado.", ErrorType.NotFound);
        }

        return Result.Success(ToResponse(record));
    }

    internal static MedicalRecordResponse ToResponse(MedicalRecord record) => new(
        record.Id,
        record.PatientId,
        record.DoctorId,
        record.AppointmentId,
        record.ConsultationDate,
        record.VitalSigns,
        record.Diagnosis,
        record.Observations,
        record.TreatmentPlan,
        record.PrescriptionIds,
        record.LaboratoryOrderIds);
}

public class GetPatientMedicalRecordsQueryHandler(IMedicalRecordRepository medicalRecordRepository)
    : IRequestHandler<GetPatientMedicalRecordsQuery, Result<IReadOnlyList<MedicalRecordResponse>>>
{
    public async Task<Result<IReadOnlyList<MedicalRecordResponse>>> Handle(
        GetPatientMedicalRecordsQuery query,
        CancellationToken cancellationToken)
    {
        var records = await medicalRecordRepository.GetByPatientAsync(query.PatientId, cancellationToken);
        return Result.Success(
            (IReadOnlyList<MedicalRecordResponse>)records.Select(GetMedicalRecordQueryHandler.ToResponse).ToList());
    }
}

public class SearchPatientClinicalHistoryQueryHandler(
    IPatientRepository patientRepository,
    IMedicalRecordRepository medicalRecordRepository)
    : IRequestHandler<SearchPatientClinicalHistoryQuery, Result<IReadOnlyList<PatientClinicalHistoryResponse>>>
{
    public async Task<Result<IReadOnlyList<PatientClinicalHistoryResponse>>> Handle(
        SearchPatientClinicalHistoryQuery query,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(query.Term))
        {
            return Result.Failure<IReadOnlyList<PatientClinicalHistoryResponse>>(
                "El término de búsqueda es obligatorio.");
        }

        var term = query.Term.Trim();
        var patients = await FindPatientsAsync(term, cancellationToken);

        if (patients.Count == 0)
        {
            return Result.Success((IReadOnlyList<PatientClinicalHistoryResponse>)[]);
        }

        var response = new List<PatientClinicalHistoryResponse>(patients.Count);
        foreach (var patient in patients)
        {
            var records = await medicalRecordRepository.GetByPatientAsync(patient.Id, cancellationToken);
            response.Add(new PatientClinicalHistoryResponse(
                patient.Id,
                $"{patient.PersonalData.FirstName} {patient.PersonalData.LastName}".Trim(),
                patient.PersonalData.DocumentId,
                patient.ClinicalHistory,
                records
                    .OrderByDescending(r => r.ConsultationDate)
                    .Select(GetMedicalRecordQueryHandler.ToResponse)
                    .ToList()));
        }

        return Result.Success((IReadOnlyList<PatientClinicalHistoryResponse>)response);
    }

    private async Task<List<Patient>> FindPatientsAsync(
        string term,
        CancellationToken cancellationToken)
    {
        var byId = await patientRepository.GetByIdAsync(term, cancellationToken);
        if (byId is not null)
        {
            return [byId];
        }

        var matches = await patientRepository.SearchAsync(term, cancellationToken);
        return matches.ToList();
    }
}