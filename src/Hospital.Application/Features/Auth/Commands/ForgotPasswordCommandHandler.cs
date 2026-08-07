using Hospital.Application.Interfaces;
using Hospital.Domain.Common;
using Hospital.Domain.Interfaces;
using MediatR;

namespace Hospital.Application.Features.Auth.Commands;

public class ForgotPasswordCommandHandler(
    IUserRepository userRepository,
    IEmailSender emailSender) : IRequestHandler<ForgotPasswordCommand, Result<Unit>>
{
    public async Task<Result<Unit>> Handle(ForgotPasswordCommand command, CancellationToken cancellationToken)
    {
        var user = await userRepository.GetByEmailAsync(command.Email.Trim().ToLowerInvariant(), cancellationToken);
        if (user is null)
        {
            return Result.Success(Unit.Value);
        }

        user.PasswordResetToken = Convert.ToBase64String(Guid.NewGuid().ToByteArray()).Replace("+", "-").Replace("/", "_").TrimEnd('=');
        user.PasswordResetExpires = DateTime.UtcNow.AddHours(2);

        await userRepository.UpdateAsync(user, cancellationToken);
        await emailSender.SendAsync(user.Email, "Recuperación de contraseña - MediCore HMS",
            $"Su código para restablecer la contraseña es: {user.PasswordResetToken}", cancellationToken);

        return Result.Success(Unit.Value);
    }
}