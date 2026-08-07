using Hospital.Domain.Common;
using MediatR;

namespace Hospital.Application.Features.Auth.Commands;

public record LoginCommand(string Email, string Password) : IRequest<Result<LoginResult>>;

public record LoginResult(string Token, DateTime ExpiresAt, string UserId, string FullName, string Email, IReadOnlyList<string> Roles);