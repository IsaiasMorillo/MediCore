using Hospital.Application.Interfaces;
using Hospital.Domain.Common;
using Hospital.Domain.Interfaces;
using MediatR;
using Microsoft.Extensions.Options;

namespace Hospital.Application.Features.Auth.Commands;

public class LoginCommandHandler(
    IUserRepository userRepository,
    IPasswordHasher passwordHasher,
    ITokenGenerator tokenGenerator,
    IOptions<JwtSettings> jwtOptions) : IRequestHandler<LoginCommand, Result<LoginResult>>
{
    public async Task<Result<LoginResult>> Handle(LoginCommand command, CancellationToken cancellationToken)
    {
        var user = await userRepository.GetByEmailAsync(command.Email.Trim().ToLowerInvariant(), cancellationToken);
        if (user is null || !passwordHasher.Verify(command.Password, user.PasswordHash))
        {
            return Result.Failure<LoginResult>("Credenciales inválidas.", ErrorType.Unauthorized);
        }

        if (!user.IsActive)
        {
            return Result.Failure<LoginResult>("La cuenta está desactivada. Contacte al administrador.", ErrorType.Forbidden);
        }

        var token = tokenGenerator.GenerateToken(user);
        var expiresAt = DateTime.UtcNow.AddMinutes(jwtOptions.Value.ExpirationMinutes);

        return Result.Success(new LoginResult(
            token,
            expiresAt,
            user.Id,
            user.FullName,
            user.Email,
            user.Roles.Select(r => r.ToString()).ToList()));
    }
}

public class JwtSettings
{
    public const string SectionName = "JwtSettings";

    public string Secret { get; set; } = string.Empty;

    public string Issuer { get; set; } = "MediCore";

    public string Audience { get; set; } = "MediCoreClients";

    public int ExpirationMinutes { get; set; } = 480;
}