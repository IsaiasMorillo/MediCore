using Hospital.Application.Features.Patients.DTOs;
using Hospital.Domain.Common;
using Hospital.Domain.Entities;
using Hospital.Domain.Interfaces;
using MediatR;

namespace Hospital.Application.Features.Patients.Queries;

public class GetPatientQueryHandler(IPatientRepository patientRepository)
    : IRequestHandler<GetPatientQuery, Result<PatientResponse>>
{
    public async Task<Result<PatientResponse>> Handle(GetPatientQuery query, CancellationToken cancellationToken)
    {
        var patient = await patientRepository.GetByIdAsync(query.Id, cancellationToken);
        if (patient is null)
        {
            return Result.Failure<PatientResponse>("Paciente no encontrado.", ErrorType.NotFound);
        }

        return Result.Success(ToResponse(patient));
    }

    internal static PatientResponse ToResponse(Patient patient) => new(
        patient.Id,
        patient.PersonalData,
        patient.Contacts,
        patient.MedicalInsurance,
        patient.ClinicalHistory,
        patient.IsActive);
}

public class SearchPatientsQueryHandler(IPatientRepository patientRepository)
    : IRequestHandler<SearchPatientsQuery, Result<IReadOnlyList<PatientResponse>>>
{
    public async Task<Result<IReadOnlyList<PatientResponse>>> Handle(
        SearchPatientsQuery query,
        CancellationToken cancellationToken)
    {
        var patients = await patientRepository.SearchAsync(query.SearchTerm, cancellationToken);
        return Result.Success((IReadOnlyList<PatientResponse>)patients.Select(GetPatientQueryHandler.ToResponse).ToList());
    }
}