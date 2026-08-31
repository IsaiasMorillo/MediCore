using Hospital.Domain.Common;
using Hospital.Domain.Entities;
using Hospital.Domain.Interfaces;
using MediatR;

namespace Hospital.Application.Features.Patients.Commands;

public class CreatePatientCommandHandler(IPatientRepository patientRepository)
    : IRequestHandler<CreatePatientCommand, Result<string>>
{
    public async Task<Result<string>> Handle(CreatePatientCommand command, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(command.FirstName) || string.IsNullOrWhiteSpace(command.LastName))
        {
            return Result.Failure<string>("El nombre y apellido del paciente son obligatorios.");
        }

        if (string.IsNullOrWhiteSpace(command.DocumentId))
        {
            return Result.Failure<string>("El documento de identidad es obligatorio.");
        }

        var exists = await patientRepository.ExistsAsync(
            p => p.PersonalData.DocumentId == command.DocumentId.Trim(),
            cancellationToken);

        if (exists)
        {
            return Result.Failure<string>("Ya existe un paciente con ese documento de identidad.", ErrorType.Conflict);
        }

        var patient = new Patient
        {
            PersonalData = new PersonalData
            {
                FirstName = command.FirstName.Trim(),
                LastName = command.LastName.Trim(),
                DocumentId = command.DocumentId.Trim(),
                DateOfBirth = command.DateOfBirth,
                Gender = command.Gender
            },
            Contacts = command.Contacts ?? [],
            MedicalInsurance = command.MedicalInsurance,
            ClinicalHistory = command.ClinicalHistory ?? new ClinicalHistory()
        };

        await patientRepository.AddAsync(patient, cancellationToken);
        return Result.Success(patient.Id);
    }
}

public class UpdatePatientCommandHandler(IPatientRepository patientRepository)
    : IRequestHandler<UpdatePatientCommand, Result<Unit>>
{
    public async Task<Result<Unit>> Handle(UpdatePatientCommand command, CancellationToken cancellationToken)
    {
        var patient = await patientRepository.GetByIdAsync(command.Id, cancellationToken);
        if (patient is null)
        {
            return Result.Failure<Unit>("Paciente no encontrado.", ErrorType.NotFound);
        }

        var duplicate = await patientRepository.FirstOrDefaultAsync(
            p => p.PersonalData.DocumentId == command.DocumentId.Trim() && p.Id != command.Id,
            cancellationToken);

        if (duplicate is not null)
        {
            return Result.Failure<Unit>("Ya existe otro paciente con ese documento de identidad.", ErrorType.Conflict);
        }

        patient.PersonalData = new PersonalData
        {
            FirstName = command.FirstName.Trim(),
            LastName = command.LastName.Trim(),
            DocumentId = command.DocumentId.Trim(),
            DateOfBirth = command.DateOfBirth,
            Gender = command.Gender
        };
        patient.Contacts = command.Contacts ?? [];
        patient.MedicalInsurance = command.MedicalInsurance;
        patient.ClinicalHistory = command.ClinicalHistory ?? patient.ClinicalHistory;
        patient.IsActive = command.IsActive;

        await patientRepository.UpdateAsync(patient, cancellationToken);
        return Result.Success(Unit.Value);
    }
}

public class DeletePatientCommandHandler(IPatientRepository patientRepository)
    : IRequestHandler<DeletePatientCommand, Result<Unit>>
{
    public async Task<Result<Unit>> Handle(DeletePatientCommand command, CancellationToken cancellationToken)
    {
        var patient = await patientRepository.GetByIdAsync(command.Id, cancellationToken);
        if (patient is null)
        {
            return Result.Failure<Unit>("Paciente no encontrado.", ErrorType.NotFound);
        }

        await patientRepository.DeleteAsync(command.Id, cancellationToken);
        return Result.Success(Unit.Value);
    }
}