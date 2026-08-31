using FluentAssertions;
using Hospital.Application.Features.Pharmacy.Commands;
using Hospital.Domain.Common;
using Hospital.Domain.Entities;
using Hospital.Domain.Enums;
using Hospital.Domain.Interfaces;
using Moq;

namespace Hospital.UnitTests.Application;

public class PharmacyCommandHandlerTests
{
    [Fact]
    public async Task CreateMedication_WithValidData_UsesUppercaseCode()
    {
        var medicationRepository = new Mock<IMedicationRepository>();
        medicationRepository.Setup(r => r.ExistsAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Medication, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        var handler = new CreateMedicationCommandHandler(medicationRepository.Object);

        var result = await handler.Handle(new CreateMedicationCommand(
            "Losartán", "los-50", "Cardiología", 100, 250.50m, null, 10), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        medicationRepository.Verify(r => r.AddAsync(It.Is<Medication>(m =>
            m.Code == "LOS-50" && m.StockQuantity == 100 && m.Price == 250.50m), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateMedication_WithDuplicateCode_ReturnsConflict()
    {
        var medicationRepository = new Mock<IMedicationRepository>();
        medicationRepository.Setup(r => r.ExistsAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Medication, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        var handler = new CreateMedicationCommandHandler(medicationRepository.Object);

        var result = await handler.Handle(new CreateMedicationCommand(
            "Losartán", "LOS-50", "Cardiología", 100, 250.50m, null, 10), CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.ErrorType.Should().Be(ErrorType.Conflict);
    }

    [Fact]
    public async Task AdjustStock_WithEnoughStock_UpdatesQuantity()
    {
        var medicationRepository = new Mock<IMedicationRepository>();
        medicationRepository.Setup(r => r.GetByIdAsync("med-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Medication { Id = "med-1", Code = "LOS-50", StockQuantity = 10 });
        var handler = new AdjustStockCommandHandler(medicationRepository.Object);

        var result = await handler.Handle(new AdjustStockCommand("med-1", 5), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value!.StockQuantity.Should().Be(15);
    }

    [Fact]
    public async Task AdjustStock_WithNegativeResult_ReturnsConflict()
    {
        var medicationRepository = new Mock<IMedicationRepository>();
        medicationRepository.Setup(r => r.GetByIdAsync("med-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Medication { Id = "med-1", Code = "LOS-50", StockQuantity = 3 });
        var handler = new AdjustStockCommandHandler(medicationRepository.Object);

        var result = await handler.Handle(new AdjustStockCommand("med-1", -5), CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.ErrorType.Should().Be(ErrorType.Conflict);
        medicationRepository.Verify(r => r.UpdateAsync(It.IsAny<Medication>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Dispense_WithStockAvailable_DecrementsStockAndMarksDispensed()
    {
        var prescriptionRepository = new Mock<IPrescriptionRepository>();
        var medicationRepository = new Mock<IMedicationRepository>();
        prescriptionRepository.Setup(r => r.GetByIdAsync("rx-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Prescription { Id = "rx-1", MedicationId = "med-1", Quantity = 10, Status = PrescriptionStatus.Emitida });
        medicationRepository.Setup(r => r.GetByIdAsync("med-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Medication { Id = "med-1", StockQuantity = 50 });
        var handler = new DispensePrescriptionCommandHandler(prescriptionRepository.Object, medicationRepository.Object);

        var result = await handler.Handle(new DispensePrescriptionCommand("rx-1", "farmacia-1"), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        medicationRepository.Verify(r => r.UpdateAsync(It.Is<Medication>(m => m.StockQuantity == 40), It.IsAny<CancellationToken>()), Times.Once);
        prescriptionRepository.Verify(r => r.UpdateAsync(It.Is<Prescription>(p =>
            p.Status == PrescriptionStatus.Despachada &&
            p.DispensedBy == "farmacia-1" &&
            p.DispensedAt.HasValue), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Dispense_WithInsufficientStock_ReturnsConflict()
    {
        var prescriptionRepository = new Mock<IPrescriptionRepository>();
        var medicationRepository = new Mock<IMedicationRepository>();
        prescriptionRepository.Setup(r => r.GetByIdAsync("rx-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Prescription { Id = "rx-1", MedicationId = "med-1", Quantity = 10, Status = PrescriptionStatus.Emitida });
        medicationRepository.Setup(r => r.GetByIdAsync("med-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Medication { Id = "med-1", StockQuantity = 3 });
        var handler = new DispensePrescriptionCommandHandler(prescriptionRepository.Object, medicationRepository.Object);

        var result = await handler.Handle(new DispensePrescriptionCommand("rx-1", "farmacia-1"), CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.ErrorType.Should().Be(ErrorType.Conflict);
        prescriptionRepository.Verify(r => r.UpdateAsync(It.IsAny<Prescription>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Dispense_WhenAlreadyDispensed_ReturnsConflict()
    {
        var prescriptionRepository = new Mock<IPrescriptionRepository>();
        var medicationRepository = new Mock<IMedicationRepository>();
        prescriptionRepository.Setup(r => r.GetByIdAsync("rx-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Prescription { Id = "rx-1", MedicationId = "med-1", Quantity = 5, Status = PrescriptionStatus.Despachada });
        var handler = new DispensePrescriptionCommandHandler(prescriptionRepository.Object, medicationRepository.Object);

        var result = await handler.Handle(new DispensePrescriptionCommand("rx-1", "farmacia-1"), CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.ErrorType.Should().Be(ErrorType.Conflict);
    }
}