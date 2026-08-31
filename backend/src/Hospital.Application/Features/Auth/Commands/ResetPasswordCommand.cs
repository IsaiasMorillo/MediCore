using Hospital.Domain.Common;
using MediatR;

namespace Hospital.Application.Features.Auth.Commands;

public record ResetPasswordCommand(string Token, string NewPassword) : IRequest<Result<Unit>>;