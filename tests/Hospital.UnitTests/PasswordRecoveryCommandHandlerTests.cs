using FluentAssertions;
using Hospital.Application.Features.Auth.Commands;
using Hospital.Application.Interfaces;
using Hospital.Domain.Common;
using Hospital.Domain.Entities;
using Hospital.Domain.Interfaces;
using Moq;

namespace Hospital.UnitTests.Application;

public class ForgotPasswordCommandHandlerTests
{
    private readonly Mock<IUserRepository> _userRepository = new();
    private readonly Mock<IEmailSender> _emailSender = new();

    [Fact]
    public async Task Handle_WithExistingUser_SetsResetTokenAndSendsEmail()
    {
        var user = new User { Email = "medico@medicore.do" };
        _userRepository.Setup(r => r.GetByEmailAsync("medico@medicore.do", It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        var handler = new ForgotPasswordCommandHandler(_userRepository.Object, _emailSender.Object);

        var result = await handler.Handle(new ForgotPasswordCommand("medico@medicore.do"), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        user.PasswordResetToken.Should().NotBeNullOrWhiteSpace();
        user.PasswordResetExpires.Should().BeAfter(DateTime.UtcNow);
        _userRepository.Verify(r => r.UpdateAsync(user, It.IsAny<CancellationToken>()), Times.Once);
        _emailSender.Verify(e => e.SendAsync(user.Email, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WithNonExistingUser_ReturnsSuccessWithoutEmail()
    {
        _userRepository.Setup(r => r.GetByEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);
        var handler = new ForgotPasswordCommandHandler(_userRepository.Object, _emailSender.Object);

        var result = await handler.Handle(new ForgotPasswordCommand("nadie@medicore.do"), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        _emailSender.Verify(e => e.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}

public class ResetPasswordCommandHandlerTests
{
    private readonly Mock<IUserRepository> _userRepository = new();
    private readonly Mock<IPasswordHasher> _passwordHasher = new();

    private ResetPasswordCommandHandler CreateHandler()
    {
        return new ResetPasswordCommandHandler(_userRepository.Object, _passwordHasher.Object);
    }

    [Fact]
    public async Task Handle_WithValidToken_UpdatesPassword()
    {
        var user = new User
        {
            Email = "medico@medicore.do",
            PasswordResetToken = "token-123",
            PasswordResetExpires = DateTime.UtcNow.AddHours(1)
        };
        _userRepository.Setup(r => r.GetByPasswordResetTokenAsync("token-123", It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        _passwordHasher.Setup(h => h.Hash("NuevaClave123")).Returns("nuevo-hash");
        var handler = CreateHandler();

        var result = await handler.Handle(new ResetPasswordCommand("token-123", "NuevaClave123"), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        user.PasswordHash.Should().Be("nuevo-hash");
        user.PasswordResetToken.Should().BeNull();
        _userRepository.Verify(r => r.UpdateAsync(user, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WithExpiredToken_ReturnsNotFound()
    {
        var user = new User
        {
            Email = "medico@medicore.do",
            PasswordResetToken = "token-123",
            PasswordResetExpires = DateTime.UtcNow.AddHours(-1)
        };
        _userRepository.Setup(r => r.GetByPasswordResetTokenAsync("token-123", It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        var handler = CreateHandler();

        var result = await handler.Handle(new ResetPasswordCommand("token-123", "NuevaClave123"), CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.ErrorType.Should().Be(ErrorType.NotFound);
    }
}