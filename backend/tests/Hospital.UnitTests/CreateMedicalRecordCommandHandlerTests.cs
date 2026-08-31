using FluentAssertions;
using Hospital.Application.Features.MedicalRecords.Commands;
using Hospital.Domain.Common;
using Hospital.Domain.Entities;
using Hospital.Domain.Interfaces;
using Moq;

namespace Hospital.UnitTests.Application;

public class CreateMedicalRecordCommandHandlerTests
{
    private readonly Mock<IPatientRepository> _patientRepository = new();
    private readonly Mock<IDoctorRepository> _doctorRepository = new();
    private readonly Mock<IMedicalRecordRepository> _medicalRecordRepository = new();

    private CreateMedicalRecordCommandHandler CreateHandler()
    {
        return new CreateMedicalRecordCommandHandler(
            _patientRepository.Object,
            _doctorRepository.Object,
            _medicalRecordRepository.Object);
    }

    private static CreateMedicalRecordCommand CreateCommand(string appointmentId = "appt-1")
    {
        return new CreateMedicalRecordCommand(
            "patient-1",
            "doctor-1",
            appointmentId,
            new VitalSigns { BloodPressure = "120/80", HeartRate = 72 },
            "Hipertensión",
            "Paciente estable",
            "Losartán 50 mg");
    }

    [Fact]
    public async Task Handle_WithValidData_CreatesImmutableRecord()
    {
        _patientRepository.Setup(r => r.GetByIdAsync("patient-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Patient { Id = "patient-1" });
        _doctorRepository.Setup(r => r.GetByIdAsync("doctor-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Doctor { Id = "doctor-1" });
        _medicalRecordRepository
            .Setup(r => r.ExistsForAppointmentAsync("appt-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        var handler = CreateHandler();

        var result = await handler.Handle(CreateCommand(), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNullOrWhiteSpace();
        _medicalRecordRepository.Verify(r => r.AddAsync(It.Is<MedicalRecord>(record =>
            record.PatientId == "patient-1" &&
            record.Diagnosis == "Hipertensión" &&
            record.IsImmutable &&
            record.VitalSigns.BloodPressure == "120/80"), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WithUnknownPatient_ReturnsNotFound()
    {
        _patientRepository.Setup(r => r.GetByIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Patient?)null);
        var handler = CreateHandler();

        var result = await handler.Handle(CreateCommand(), CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.ErrorType.Should().Be(ErrorType.NotFound);
        _medicalRecordRepository.Verify(r => r.AddAsync(It.IsAny<MedicalRecord>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WithUnknownDoctor_ReturnsNotFound()
    {
        _patientRepository.Setup(r => r.GetByIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Patient { Id = "patient-1" });
        _doctorRepository.Setup(r => r.GetByIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Doctor?)null);
        var handler = CreateHandler();

        var result = await handler.Handle(CreateCommand(), CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.ErrorType.Should().Be(ErrorType.NotFound);
    }

    [Fact]
    public async Task Handle_WithDuplicateAppointment_ReturnsConflict()
    {
        _patientRepository.Setup(r => r.GetByIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Patient { Id = "patient-1" });
        _doctorRepository.Setup(r => r.GetByIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Doctor { Id = "doctor-1" });
        _medicalRecordRepository
            .Setup(r => r.ExistsForAppointmentAsync("appt-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        var handler = CreateHandler();

        var result = await handler.Handle(CreateCommand(), CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.ErrorType.Should().Be(ErrorType.Conflict);
        _medicalRecordRepository.Verify(r => r.AddAsync(It.IsAny<MedicalRecord>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WithMissingDiagnosis_ReturnsValidationFailure()
    {
        _patientRepository.Setup(r => r.GetByIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Patient { Id = "patient-1" });
        _doctorRepository.Setup(r => r.GetByIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Doctor { Id = "doctor-1" });
        var handler = CreateHandler();

        var result = await handler.Handle(CreateCommand() with { Diagnosis = "  " }, CancellationToken.None);

        result.IsFailure.Should().BeTrue();
    }
}