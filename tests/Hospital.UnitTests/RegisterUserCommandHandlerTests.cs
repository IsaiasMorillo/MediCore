using FluentAssertions;
using Hospital.Application.Features.Auth.Commands;
using Hospital.Application.Interfaces;
using Hospital.Domain.Common;
using Hospital.Domain.Entities;
using Hospital.Domain.Enums;
using Hospital.Domain.Interfaces;
using Moq;

namespace Hospital.UnitTests.Application;

public class RegisterUserCommandHandlerTests
{
    private readonly Mock<IUserRepository> _userRepository = new();
    private readonly Mock<IPasswordHasher> _passwordHasher = new();

    private RegisterUserCommandHandler CreateHandler()
    {
        return new RegisterUserCommandHandler(_userRepository.Object, _passwordHasher.Object);
    }

    [Fact]
    public async Task Handle_WithValidData_CreatesUser()
    {
        _userRepository.Setup(r => r.GetByEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);
        _passwordHasher.Setup(h => h.Hash(It.IsAny<string>())).Returns("bcrypt-hash");
        var handler = CreateHandler();

        var result = await handler.Handle(new RegisterUserCommand(
            "medico@medicore.do", "Dra. Ana", "Password123", ["Medico"]),
            CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNullOrWhiteSpace();
        _userRepository.Verify(r => r.AddAsync(It.Is<User>(u =>
            u.Email == "medico@medicore.do" &&
            u.Roles.Contains(UserRole.Medico) &&
            u.PasswordHash == "bcrypt-hash"), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WithDuplicateEmail_ReturnsConflict()
    {
        _userRepository.Setup(r => r.GetByEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new User { Email = "medico@medicore.do" });
        var handler = CreateHandler();

        var result = await handler.Handle(new RegisterUserCommand(
            "medico@medicore.do", "Dra. Ana", "Password123", ["Medico"]),
            CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.ErrorType.Should().Be(ErrorType.Conflict);
        _userRepository.Verify(r => r.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WithInvalidRole_ReturnsValidationFailure()
    {
        var handler = CreateHandler();

        var result = await handler.Handle(new RegisterUserCommand(
            "nuevo@medicore.do", "Nuevo", "Password123", ["Dios"]),
            CancellationToken.None);

        result.IsFailure.Should().BeTrue();
    }

    [Fact]
    public async Task Handle_WithShortPassword_ReturnsValidationFailure()
    {
        var handler = CreateHandler();

        var result = await handler.Handle(new RegisterUserCommand(
            "nuevo@medicore.do", "Nuevo", "abc", ["Medico"]),
            CancellationToken.None);

        result.IsFailure.Should().BeTrue();
    }
}