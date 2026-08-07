using Hospital.Domain.Common;
using Hospital.Domain.Entities;
using MediatR;

namespace Hospital.Application.Features.Doctors.Commands;

public record CreateDoctorCommand(
    string FirstName,
    string LastName,
    string Specialty,
    string LicenseNumber,
    int ExperienceYears,
    string Office,
    List<AvailabilityShift> Schedule) : IRequest<Result<string>>;

public record UpdateDoctorCommand(
    string Id,
    string FirstName,
    string LastName,
    string Specialty,
    string LicenseNumber,
    int ExperienceYears,
    string Office,
    List<AvailabilityShift> Schedule,
    bool IsActive) : IRequest<Result<Unit>>;

public record DeleteDoctorCommand(string Id) : IRequest<Result<Unit>>;