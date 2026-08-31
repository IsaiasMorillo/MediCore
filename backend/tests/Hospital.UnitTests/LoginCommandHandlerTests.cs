using FluentAssertions;
using Hospital.Application.Features.Auth.Commands;
using Hospital.Application.Interfaces;
using Hospital.Domain.Common;
using Hospital.Domain.Entities;
using Hospital.Domain.Enums;
using Hospital.Domain.Interfaces;
using Microsoft.Extensions.Options;
using Moq;

namespace Hospital.UnitTests.Application;

public class LoginCommandHandlerTests
{
    private readonly Mock<IUserRepository> _userRepository = new();
    private readonly Mock<IPasswordHasher> _passwordHasher = new();
    private readonly Mock<ITokenGenerator> _tokenGenerator = new();

    private LoginCommandHandler CreateHandler()
    {
        var jwtSettings = Options.Create(new JwtSettings { Secret = "x", ExpirationMinutes = 60 });
        return new LoginCommandHandler(
            _userRepository.Object,
            _passwordHasher.Object,
            _tokenGenerator.Object,
            jwtSettings);
    }

    [Fact]
    public async Task Handle_WithValidCredentials_ReturnsToken()
    {
        var user = new User
        {
            Id = "u1",
            Email = "medico@medicore.do",
            FullName = "Dr. Juan",
            PasswordHash = "hash",
            Roles = [UserRole.Medico],
            IsActive = true
        };
        _userRepository.Setup(r => r.GetByEmailAsync("medico@medicore.do", It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        _passwordHasher.Setup(h => h.Verify("Password123", "hash")).Returns(true);
        _tokenGenerator.Setup(t => t.GenerateToken(user)).Returns("jwt-token");
        var handler = CreateHandler();

        var result = await handler.Handle(new LoginCommand("medico@medicore.do", "Password123"), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value!.Token.Should().Be("jwt-token");
        result.Value.Roles.Should().Contain("Medico");
    }

    [Fact]
    public async Task Handle_WithInvalidPassword_ReturnsUnauthorized()
    {
        var user = new User
        {
            Id = "u1",
            Email = "medico@medicore.do",
            PasswordHash = "hash",
            Roles = [UserRole.Medico],
            IsActive = true
        };
        _userRepository.Setup(r => r.GetByEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        _passwordHasher.Setup(h => h.Verify(It.IsAny<string>(), "hash")).Returns(false);
        var handler = CreateHandler();

        var result = await handler.Handle(new LoginCommand("medico@medicore.do", "MalPassword"), CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.ErrorType.Should().Be(ErrorType.Unauthorized);
    }

    [Fact]
    public async Task Handle_WithInactiveUser_ReturnsForbidden()
    {
        var user = new User
        {
            Id = "u1",
            Email = "medico@medicore.do",
            PasswordHash = "hash",
            Roles = [UserRole.Medico],
            IsActive = false
        };
        _userRepository.Setup(r => r.GetByEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        _passwordHasher.Setup(h => h.Verify(It.IsAny<string>(), "hash")).Returns(true);
        var handler = CreateHandler();

        var result = await handler.Handle(new LoginCommand("medico@medicore.do", "Password123"), CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.ErrorType.Should().Be(ErrorType.Forbidden);
    }
}