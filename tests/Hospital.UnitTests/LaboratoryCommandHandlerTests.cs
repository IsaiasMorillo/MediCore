using FluentAssertions;
using Hospital.Application.Features.Laboratory;
using Hospital.Application.Features.Laboratory.Commands;
using Hospital.Domain.Common;
using Hospital.Domain.Entities;
using Hospital.Domain.Enums;
using Hospital.Domain.Interfaces;
using Moq;

namespace Hospital.UnitTests.Application;

public class LaboratoryCommandHandlerTests
{
    private readonly Mock<IPatientRepository> _patientRepository = new();
    private readonly Mock<IDoctorRepository> _doctorRepository = new();
    private readonly Mock<IMedicalRecordRepository> _medicalRecordRepository = new();
    private readonly Mock<ILaboratoryOrderRepository> _laboratoryOrderRepository = new();

    [Fact]
    public async Task CreateOrder_WithValidData_CreatesPendingOrder()
    {
        _patientRepository.Setup(r => r.GetByIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Patient { Id = "patient-1" });
        _doctorRepository.Setup(r => r.GetByIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Doctor { Id = "doctor-1" });
        var handler = new CreateLaboratoryOrderCommandHandler(
            _patientRepository.Object,
            _doctorRepository.Object,
            _medicalRecordRepository.Object,
            _laboratoryOrderRepository.Object,
            new LaboratoryOrderFactory());

        var result = await handler.Handle(
            new CreateLaboratoryOrderCommand("patient-1", "doctor-1", null, TestType.Hemograma),
            CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        _laboratoryOrderRepository.Verify(r => r.AddAsync(It.Is<LaboratoryOrder>(o =>
            o.PatientId == "patient-1" &&
            o.TestType == TestType.Hemograma &&
            o.Status == LaboratoryOrderStatus.SolicitudPendiente), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateOrder_WithUnknownPatient_ReturnsNotFound()
    {
        _patientRepository.Setup(r => r.GetByIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Patient?)null);
        var handler = new CreateLaboratoryOrderCommandHandler(
            _patientRepository.Object,
            _doctorRepository.Object,
            _medicalRecordRepository.Object,
            _laboratoryOrderRepository.Object,
            new LaboratoryOrderFactory());

        var result = await handler.Handle(
            new CreateLaboratoryOrderCommand("patient-1", "doctor-1", null, TestType.Hemograma),
            CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.ErrorType.Should().Be(ErrorType.NotFound);
    }

    [Fact]
    public async Task LoadResults_WithPendingOrder_SetsResultsAndStatus()
    {
        var order = new LaboratoryOrder
        {
            Id = "order-1",
            PatientId = "patient-1",
            TestType = TestType.Hemograma,
            Status = LaboratoryOrderStatus.SolicitudPendiente
        };
        _laboratoryOrderRepository.Setup(r => r.GetByIdAsync("order-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(order);
        var handler = new LoadLaboratoryResultsCommandHandler(_laboratoryOrderRepository.Object);

        var result = await handler.Handle(
            new LoadLaboratoryResultsCommand("order-1", new Dictionary<string, object?>
            {
                ["hemoglobina"] = 14.2,
                ["leucocitos"] = 7800
            }),
            CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        order.Status.Should().Be(LaboratoryOrderStatus.ResultadoCargado);
        order.ResultsLoadedAt.Should().NotBeNull();
        order.Results!["hemoglobina"].Should().Be(14.2);
    }

    [Fact]
    public async Task LoadResults_WithResultsAlreadyLoaded_ReturnsConflict()
    {
        var order = new LaboratoryOrder
        {
            Id = "order-1",
            Status = LaboratoryOrderStatus.ResultadoCargado
        };
        _laboratoryOrderRepository.Setup(r => r.GetByIdAsync("order-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(order);
        var handler = new LoadLaboratoryResultsCommandHandler(_laboratoryOrderRepository.Object);

        var result = await handler.Handle(
            new LoadLaboratoryResultsCommand("order-1", new Dictionary<string, object?> { ["hemoglobina"] = 14 }),
            CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.ErrorType.Should().Be(ErrorType.Conflict);
    }

    [Fact]
    public async Task LoadResults_WithEmptyResults_ReturnsValidationFailure()
    {
        var order = new LaboratoryOrder { Id = "order-1", Status = LaboratoryOrderStatus.SolicitudPendiente };
        _laboratoryOrderRepository.Setup(r => r.GetByIdAsync("order-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(order);
        var handler = new LoadLaboratoryResultsCommandHandler(_laboratoryOrderRepository.Object);

        var result = await handler.Handle(
            new LoadLaboratoryResultsCommand("order-1", new Dictionary<string, object?>()),
            CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        _laboratoryOrderRepository.Verify(r => r.UpdateAsync(It.IsAny<LaboratoryOrder>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}