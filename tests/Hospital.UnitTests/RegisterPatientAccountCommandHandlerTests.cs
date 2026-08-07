using FluentAssertions;
using Hospital.Application.Features.Auth.Commands;
using Hospital.Application.Interfaces;
using Hospital.Domain.Common;
using Hospital.Domain.Entities;
using Hospital.Domain.Enums;
using Hospital.Domain.Interfaces;
using Moq;

namespace Hospital.UnitTests.Application;

public class RegisterPatientAccountCommandHandlerTests
{
    private static readonly Patient Patient = new() { Id = "pat-007" };

    private static (RegisterPatientAccountCommandHandler Handler, Mock<IPatientRepository> Patients,
        Mock<IUserRepository> Users, Mock<IPasswordHasher> Hasher) Build()
    {
        var patients = new Mock<IPatientRepository>();
        patients.Setup(r => r.GetByIdAsync("pat-007", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Patient);

        var users = new Mock<IUserRepository>();
        var hasher = new Mock<IPasswordHasher>();
        hasher.Setup(h => h.Hash(It.IsAny<string>())).Returns("hash-123");

        var handler = new RegisterPatientAccountCommandHandler(patients.Object, users.Object, hasher.Object);
        return (handler, patients, users, hasher);
    }

    [Fact]
    public async Task Register_ValidAccount_CreatesPacienteLinkedToPatient()
    {
        var (handler, _, users, hasher) = Build();

        var result = await handler.Handle(
            new RegisterPatientAccountCommand("pat-007", "Paciente@correo.do", "Petronila Mancebo", "ClaveSegura123"),
            CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        users.Verify(r => r.AddAsync(It.Is<User>(u =>
            u.Email == "paciente@correo.do" &&
            u.PatientId == "pat-007" &&
            u.Roles.Single() == UserRole.Paciente &&
            u.PasswordHash == "hash-123"), It.IsAny<CancellationToken>()), Times.Once);
        hasher.Verify(h => h.Hash("ClaveSegura123"), Times.Once);
    }

    [Fact]
    public async Task Register_InvalidEmail_ReturnsValidationError()
    {
        var (handler, _, users, _) = Build();

        var result = await handler.Handle(
            new RegisterPatientAccountCommand("pat-007", "correo-invalido", "Petronila", "ClaveSegura123"),
            CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.ErrorType.Should().Be(ErrorType.Validation);
        users.Verify(r => r.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Register_ShorPassword_ReturnsValidationError()
    {
        var (handler, _, users, _) = Build();

        var result = await handler.Handle(
            new RegisterPatientAccountCommand("pat-007", "paciente@correo.do", "Petronila", "corta12"),
            CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.ErrorType.Should().Be(ErrorType.Validation);
        users.Verify(r => r.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Register_PatientNotFound_ReturnsNotFound()
    {
        var patients = new Mock<IPatientRepository>();
        patients.Setup(r => r.GetByIdAsync("pat-404", It.IsAny<CancellationToken>()))
            .ReturnsAsync((Patient?)null);
        var handler = new RegisterPatientAccountCommandHandler(
            patients.Object, new Mock<IUserRepository>().Object, new Mock<IPasswordHasher>().Object);

        var result = await handler.Handle(
            new RegisterPatientAccountCommand("pat-404", "paciente@correo.do", "Petronila", "ClaveSegura123"),
            CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.ErrorType.Should().Be(ErrorType.NotFound);
    }

    [Fact]
    public async Task Register_DuplicateEmail_ReturnsConflict()
    {
        var patients = new Mock<IPatientRepository>();
        patients.Setup(r => r.GetByIdAsync("pat-007", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Patient);
        var users = new Mock<IUserRepository>();
        users.Setup(r => r.GetByEmailAsync("paciente@correo.do", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new User { Email = "paciente@correo.do" });
        var handler = new RegisterPatientAccountCommandHandler(
            patients.Object, users.Object, new Mock<IPasswordHasher>().Object);

        var result = await handler.Handle(
            new RegisterPatientAccountCommand("pat-007", "paciente@correo.do", "Petronila", "ClaveSegura123"),
            CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.ErrorType.Should().Be(ErrorType.Conflict);
    }
}