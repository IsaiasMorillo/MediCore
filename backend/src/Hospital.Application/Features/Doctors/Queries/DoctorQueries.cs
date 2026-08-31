using Hospital.Domain.Common;
using Hospital.Domain.Entities;
using MediatR;

namespace Hospital.Application.Features.Doctors.Queries;

public record GetDoctorQuery(string Id) : IRequest<Result<DoctorResponse>>;

public record GetDoctorsQuery(string? Specialty = null, string? SearchTerm = null)
    : IRequest<Result<IReadOnlyList<DoctorResponse>>>;

public record DoctorResponse(
    string Id,
    string FirstName,
    string LastName,
    string Specialty,
    string LicenseNumber,
    int ExperienceYears,
    string Office,
    List<AvailabilityShift> Schedule,
    bool IsActive);