using Hospital.Domain.Common;
using MediatR;

namespace Hospital.Application.Features.Auth.Commands;

public record ForgotPasswordCommand(string Email) : IRequest<Result<Unit>>;