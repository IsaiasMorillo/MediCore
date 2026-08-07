using Hospital.Domain.Common;
using Hospital.Domain.Entities;
using MediatR;

namespace Hospital.Application.Features.Patients.Commands;

public record CreatePatientCommand(
    string FirstName,
    string LastName,
    string DocumentId,
    DateTime? DateOfBirth,
    string Gender,
    List<Contact> Contacts,
    MedicalInsurance? MedicalInsurance,
    ClinicalHistory? ClinicalHistory) : IRequest<Result<string>>;

public record UpdatePatientCommand(
    string Id,
    string FirstName,
    string LastName,
    string DocumentId,
    DateTime? DateOfBirth,
    string Gender,
    List<Contact> Contacts,
    MedicalInsurance? MedicalInsurance,
    ClinicalHistory ClinicalHistory,
    bool IsActive) : IRequest<Result<Unit>>;

public record DeletePatientCommand(string Id) : IRequest<Result<Unit>>;