using Hospital.Domain.Common;
using Hospital.Domain.Enums;
using MediatR;

namespace Hospital.Application.Features.Laboratory.Queries;

public record GetLaboratoryOrderQuery(string Id) : IRequest<Result<LaboratoryOrderResponse>>;

public record GetPatientLaboratoryOrdersQuery(string PatientId)
    : IRequest<Result<IReadOnlyList<LaboratoryOrderResponse>>>;

public record LaboratoryOrderResponse(
    string Id,
    string PatientId,
    string DoctorId,
    string? MedicalRecordId,
    TestType TestType,
    LaboratoryOrderStatus Status,
    DateTime RequestedAt,
    Dictionary<string, object?>? Results,
    DateTime? ResultsLoadedAt);