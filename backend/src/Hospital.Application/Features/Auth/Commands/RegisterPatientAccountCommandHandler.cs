using Hospital.Application.Interfaces;
using Hospital.Domain.Common;
using Hospital.Domain.Entities;
using Hospital.Domain.Enums;
using Hospital.Domain.Interfaces;
using MediatR;

namespace Hospital.Application.Features.Auth.Commands;

public class RegisterPatientAccountCommandHandler(
    IPatientRepository patientRepository,
    IUserRepository userRepository,
    IPasswordHasher passwordHasher) : IRequestHandler<RegisterPatientAccountCommand, Result<string>>
{
    public async Task<Result<string>> Handle(RegisterPatientAccountCommand command, CancellationToken cancellationToken)
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

        var patient = await patientRepository.GetByIdAsync(command.PatientId, cancellationToken);
        if (patient is null)
        {
            return Result.Failure<string>("El paciente no existe.", ErrorType.NotFound);
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
            Roles = [UserRole.Paciente],
            PatientId = patient.Id
        };

        await userRepository.AddAsync(user, cancellationToken);
        return Result.Success(user.Id);
    }
}