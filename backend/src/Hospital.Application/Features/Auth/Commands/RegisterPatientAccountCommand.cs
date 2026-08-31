using Hospital.Domain.Common;
using MediatR;

namespace Hospital.Application.Features.Auth.Commands;

public record RegisterPatientAccountCommand(
    string PatientId,
    string Email,
    string FullName,
    string Password) : IRequest<Result<string>>;