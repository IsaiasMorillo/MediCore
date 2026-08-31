using Hospital.Domain.Common;
using MediatR;

namespace Hospital.Application.Features.Auth.Commands;

public record RegisterUserCommand(
    string Email,
    string FullName,
    string Password,
    List<string> Roles) : IRequest<Result<string>>;