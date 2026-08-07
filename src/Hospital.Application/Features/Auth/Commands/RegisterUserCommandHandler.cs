using Hospital.Application.Interfaces;
using Hospital.Domain.Common;
using Hospital.Domain.Entities;
using Hospital.Domain.Enums;
using Hospital.Domain.Interfaces;
using MediatR;

namespace Hospital.Application.Features.Auth.Commands;

public class RegisterUserCommandHandler(
    IUserRepository userRepository,
    IPasswordHasher passwordHasher) : IRequestHandler<RegisterUserCommand, Result<string>>
{
    public async Task<Result<string>> Handle(RegisterUserCommand command, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(command.Email) || !command.Email.Contains('@'))
        {
            return Result.Failure<string>("Se debe proporcionar un correo electrónico válido.");
        }

        if (string.IsNullOrWhiteSpace(command.FullName))
        {
            return Result.Failure<string>("El nombre completo es obligatorio.");
        }

        if (string.IsNullOrWhiteSpace(command.Password) || command.Password.Length < 8)
        {
            return Result.Failure<string>("La contraseña debe tener al menos 8 caracteres.");
        }

        var roles = new List<UserRole>();
        foreach (var roleName in command.Roles.Distinct())
        {
            if (!Enum.TryParse<UserRole>(roleName, ignoreCase: true, out var role))
            {
                return Result.Failure<string>($"El rol '{roleName}' no es válido.");
            }
            roles.Add(role);
        }

        if (roles.Count == 0)
        {
            return Result.Failure<string>("Se debe asignar al menos un rol.");
        }

        var existing = await userRepository.GetByEmailAsync(command.Email.Trim().ToLowerInvariant(), cancellationToken);
        if (existing is not null)
        {
            return Result.Failure<string>("Ya existe un usuario con ese correo electrónico.", ErrorType.Conflict);
        }

        var user = new User
        {
            Email = command.Email.Trim().ToLowerInvariant(),
            FullName = command.FullName.Trim(),
            PasswordHash = passwordHasher.Hash(command.Password),
            Roles = roles
        };

        await userRepository.AddAsync(user, cancellationToken);
        return Result.Success(user.Id);
    }
}