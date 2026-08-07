using Hospital.Application.Interfaces;
using Hospital.Domain.Common;
using Hospital.Domain.Interfaces;
using MediatR;

namespace Hospital.Application.Features.Auth.Commands;

public class ResetPasswordCommandHandler(
    IUserRepository userRepository,
    IPasswordHasher passwordHasher) : IRequestHandler<ResetPasswordCommand, Result<Unit>>
{
    public async Task<Result<Unit>> Handle(ResetPasswordCommand command, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(command.NewPassword) || command.NewPassword.Length < 8)
        {
            return Result.Failure<Unit>("La nueva contraseña debe tener al menos 8 caracteres.");
        }

        var user = await userRepository.GetByPasswordResetTokenAsync(command.Token, cancellationToken);
        if (user is null || user.PasswordResetExpires is null || user.PasswordResetExpires < DateTime.UtcNow)
        {
            return Result.Failure<Unit>("El token de recuperación es inválido o ha expirado.", ErrorType.NotFound);
        }

        user.PasswordHash = passwordHasher.Hash(command.NewPassword);
        user.PasswordResetToken = null;
        user.PasswordResetExpires = null;
        user.UpdatedAt = DateTime.UtcNow;

        await userRepository.UpdateAsync(user, cancellationToken);
        return Result.Success(Unit.Value);
    }
}