using Hospital.Application.Features.Patients.DTOs;
using Hospital.Domain.Common;
using MediatR;

namespace Hospital.Application.Features.Patients.Queries;

public record GetPatientQuery(string Id) : IRequest<Result<PatientResponse>>;

public record SearchPatientsQuery(string? SearchTerm = null) : IRequest<Result<IReadOnlyList<PatientResponse>>>;