using Hospital.Domain.Common;
using Hospital.Domain.Enums;
using MediatR;

namespace Hospital.Application.Features.Laboratory.Commands;

public record CreateLaboratoryOrderCommand(
    string PatientId,
    string DoctorId,
    string? MedicalRecordId,
    TestType TestType) : IRequest<Result<string>>;

public record LoadLaboratoryResultsCommand(
    string OrderId,
    Dictionary<string, object?> Results) : IRequest<Result<Unit>>;