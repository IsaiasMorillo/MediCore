using FluentAssertions;
using Hospital.Application.Features.Nursing.Commands;
using Hospital.Application.Features.Nursing.Queries;
using Hospital.Domain.Common;
using Hospital.Domain.Entities;
using Hospital.Domain.Interfaces;
using Moq;

namespace Hospital.UnitTests.Application;

public class VitalsRecordHandlerTests
{
    private readonly Mock<IPatientRepository> _patientRepository = new();
    private readonly Mock<IVitalsRepository> _vitalsRepository = new();

    private CreateVitalsRecordCommandHandler CreateHandler()
    {
        return new CreateVitalsRecordCommandHandler(
            _patientRepository.Object,
            _vitalsRepository.Object);
    }

    private static CreateVitalsRecordCommand CreateCommand()
    {
        return new CreateVitalsRecordCommand(
            "patient-1",
            "appt-1",
            new VitalSigns { BloodPressure = "120/80", HeartRate = 72, Temperature = 36.8 },
            "Paciente estable",
            "nurse-1");
    }

    [Fact]
    public async Task Handle_WithValidData_CreatesVitalsRecord()
    {
        _patientRepository.Setup(r => r.GetByIdAsync("patient-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Patient { Id = "patient-1" });
        var handler = CreateHandler();

        var result = await handler.Handle(CreateCommand(), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNullOrWhiteSpace();
        _vitalsRepository.Verify(r => r.AddAsync(It.Is<VitalsRecord>(record =>
            record.PatientId == "patient-1" &&
            record.AppointmentId == "appt-1" &&
            record.RecordedBy == "nurse-1" &&
            record.RecordedAt != default &&
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
        _vitalsRepository.Verify(r => r.AddAsync(It.IsAny<VitalsRecord>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WithoutVitalData_ReturnsValidationFailure()
    {
        _patientRepository.Setup(r => r.GetByIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Patient { Id = "patient-1" });
        var handler = CreateHandler();

        var result = await handler.Handle(
            CreateCommand() with { VitalSigns = new VitalSigns() },
            CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.ErrorType.Should().Be(ErrorType.Validation);
        _vitalsRepository.Verify(r => r.AddAsync(It.IsAny<VitalsRecord>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WithoutRecordedBy_ReturnsValidationFailure()
    {
        _patientRepository.Setup(r => r.GetByIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Patient { Id = "patient-1" });
        var handler = CreateHandler();

        var result = await handler.Handle(CreateCommand() with { RecordedBy = " " }, CancellationToken.None);

        result.IsFailure.Should().BeTrue();
    }

    [Fact]
    public async Task GetByPatient_ReturnsRecordsMappedDescending()
    {
        var records = new List<VitalsRecord>
        {
            new()
            {
                Id = "v-2",
                PatientId = "patient-1",
                VitalSigns = new VitalSigns { BloodPressure = "125/80" },
                RecordedBy = "nurse-2",
                RecordedAt = new DateTime(2026, 8, 2, 10, 0, 0, DateTimeKind.Utc)
            },
            new()
            {
                Id = "v-1",
                PatientId = "patient-1",
                VitalSigns = new VitalSigns { BloodPressure = "110/70" },
                RecordedBy = "nurse-1",
                RecordedAt = new DateTime(2026, 8, 1, 10, 0, 0, DateTimeKind.Utc)
            }
        };
        _vitalsRepository.Setup(r => r.GetByPatientAsync("patient-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(records);
        var handler = new GetPatientVitalsQueryHandler(_vitalsRepository.Object);

        var result = await handler.Handle(new GetPatientVitalsQuery("patient-1"), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().HaveCount(2);
        result.Value.Should().BeInDescendingOrder(r => r.RecordedAt);
        result.Value[0].RecordedBy.Should().Be("nurse-2");
        result.Value[0].VitalSigns.BloodPressure.Should().Be("125/80");
    }
}