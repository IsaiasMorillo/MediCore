using FluentAssertions;
using Hospital.Application.Features.Billing;
using Hospital.Application.Features.Billing.Commands;
using Hospital.Domain.Common;
using Hospital.Domain.Entities;
using Hospital.Domain.Enums;
using Hospital.Domain.Interfaces;
using Moq;

namespace Hospital.UnitTests.Application;

public class InvoiceCommandHandlerTests
{
    private static Patient PatientWithInsurance(string coverageType) => new()
    {
        Id = "pat-1",
        MedicalInsurance = new MedicalInsurance
        {
            Provider = "ARS",
            PolicyNumber = "POL-1",
            CoverageType = coverageType
        }
    };

    private static List<CreateInvoiceItemRequest> Items() =>
    [
        new(InvoiceItemType.Consulta, "Consulta general", 1, 1500m),
        new(InvoiceItemType.Examen, "Hemograma", 1, 2500m),
        new(InvoiceItemType.Medicamento, "Metformina 850 mg", 2, 500m)
    ];

    [Fact]
    public async Task CreateInvoice_PremiumPatient_CalculatesCoverageAndTotals()
    {
        var patientRepository = new Mock<IPatientRepository>();
        patientRepository.Setup(r => r.GetByIdAsync("pat-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(PatientWithInsurance("Premium"));
        var invoiceRepository = new Mock<IInvoiceRepository>();
        var handler = new CreateInvoiceCommandHandler(
            patientRepository.Object, invoiceRepository.Object, new BillingStrategyFactory());

        var result = await handler.Handle(
            new CreateInvoiceCommand("pat-1", Items(), "recepcion-1"), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value!.Subtotal.Should().Be(5000m);
        result.Value.InsuranceCoverage.Should().Be(3600m);
        result.Value.Taxes.Should().Be(252.00m);
        result.Value.Total.Should().Be(1652.00m);
        result.Value.Status.Should().Be(InvoiceStatus.Pendiente);
        result.Value.Number.Should().StartWith("FAC-");
        invoiceRepository.Verify(r => r.AddAsync(It.Is<Invoice>(i => i.Total == 1652.00m), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateInvoice_WithoutInsurance_ChargesFullItbis()
    {
        var patientRepository = new Mock<IPatientRepository>();
        patientRepository.Setup(r => r.GetByIdAsync("pat-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(PatientWithInsurance(""));
        var invoiceRepository = new Mock<IInvoiceRepository>();
        var handler = new CreateInvoiceCommandHandler(
            patientRepository.Object, invoiceRepository.Object, new BillingStrategyFactory());

        var result = await handler.Handle(
            new CreateInvoiceCommand("pat-1", Items(), "recepcion-1"), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value!.InsuranceCoverage.Should().Be(0);
        result.Value.Taxes.Should().Be(900.00m);
        result.Value.Total.Should().Be(5900.00m);
    }

    [Fact]
    public async Task CreateInvoice_WithUnknownPatient_ReturnsNotFound()
    {
        var patientRepository = new Mock<IPatientRepository>();
        patientRepository.Setup(r => r.GetByIdAsync("pat-x", It.IsAny<CancellationToken>()))
            .ReturnsAsync((Patient?)null);
        var handler = new CreateInvoiceCommandHandler(
            patientRepository.Object, new Mock<IInvoiceRepository>().Object, new BillingStrategyFactory());

        var result = await handler.Handle(
            new CreateInvoiceCommand("pat-x", Items(), "recepcion-1"), CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.ErrorType.Should().Be(ErrorType.NotFound);
    }

    [Fact]
    public async Task CreateInvoice_WithEmptyItems_ReturnsValidation()
    {
        var patientRepository = new Mock<IPatientRepository>();
        patientRepository.Setup(r => r.GetByIdAsync("pat-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(PatientWithInsurance("Premium"));
        var handler = new CreateInvoiceCommandHandler(
            patientRepository.Object, new Mock<IInvoiceRepository>().Object, new BillingStrategyFactory());

        var result = await handler.Handle(
            new CreateInvoiceCommand("pat-1", [], "recepcion-1"), CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.ErrorType.Should().Be(ErrorType.Validation);
    }

    [Fact]
    public async Task CreateInvoice_WithInvalidQuantity_ReturnsValidation()
    {
        var patientRepository = new Mock<IPatientRepository>();
        patientRepository.Setup(r => r.GetByIdAsync("pat-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(PatientWithInsurance("Premium"));
        var handler = new CreateInvoiceCommandHandler(
            patientRepository.Object, new Mock<IInvoiceRepository>().Object, new BillingStrategyFactory());

        var result = await handler.Handle(
            new CreateInvoiceCommand("pat-1",
                [new(InvoiceItemType.Consulta, "Consulta", 0, 100m)], "recepcion-1"), CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.ErrorType.Should().Be(ErrorType.Validation);
    }

    [Fact]
    public async Task PayInvoice_WithExactAmount_MarksAsPaid()
    {
        var invoice = new Invoice
        {
            Id = "inv-1",
            Number = "FAC-1",
            PatientId = "pat-1",
            Total = 1000m
        };
        var invoiceRepository = new Mock<IInvoiceRepository>();
        invoiceRepository.Setup(r => r.GetByIdAsync("inv-1", It.IsAny<CancellationToken>())).ReturnsAsync(invoice);
        var handler = new PayInvoiceCommandHandler(invoiceRepository.Object);

        var result = await handler.Handle(
            new PayInvoiceCommand("inv-1", PaymentMethod.Efectivo, 1000m, "recepcion-1"), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        invoice.Status.Should().Be(InvoiceStatus.Pagada);
        invoice.Payments.Should().ContainSingle(p => p.Method == PaymentMethod.Efectivo && p.Amount == 1000m);
        invoiceRepository.Verify(r => r.UpdateAsync(invoice, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task PayInvoice_WithOverpayment_ReturnsConflict()
    {
        var invoice = new Invoice { Id = "inv-1", Total = 1000m };
        var invoiceRepository = new Mock<IInvoiceRepository>();
        invoiceRepository.Setup(r => r.GetByIdAsync("inv-1", It.IsAny<CancellationToken>())).ReturnsAsync(invoice);
        var handler = new PayInvoiceCommandHandler(invoiceRepository.Object);

        var result = await handler.Handle(
            new PayInvoiceCommand("inv-1", PaymentMethod.Efectivo, 1500m, "recepcion-1"), CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.ErrorType.Should().Be(ErrorType.Conflict);
        invoice.Status.Should().Be(InvoiceStatus.Pendiente);
    }

    [Fact]
    public async Task PayInvoice_WhenAlreadyPaid_ReturnsConflict()
    {
        var invoice = new Invoice { Id = "inv-1", Total = 1000m, Status = InvoiceStatus.Pagada };
        var invoiceRepository = new Mock<IInvoiceRepository>();
        invoiceRepository.Setup(r => r.GetByIdAsync("inv-1", It.IsAny<CancellationToken>())).ReturnsAsync(invoice);
        var handler = new PayInvoiceCommandHandler(invoiceRepository.Object);

        var result = await handler.Handle(
            new PayInvoiceCommand("inv-1", PaymentMethod.Efectivo, 100m, "recepcion-1"), CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.ErrorType.Should().Be(ErrorType.Conflict);
    }

    [Fact]
    public async Task PayInvoice_WhenCancelled_ReturnsConflict()
    {
        var invoice = new Invoice { Id = "inv-1", Total = 1000m, Status = InvoiceStatus.Anulada };
        var invoiceRepository = new Mock<IInvoiceRepository>();
        invoiceRepository.Setup(r => r.GetByIdAsync("inv-1", It.IsAny<CancellationToken>())).ReturnsAsync(invoice);
        var handler = new PayInvoiceCommandHandler(invoiceRepository.Object);

        var result = await handler.Handle(
            new PayInvoiceCommand("inv-1", PaymentMethod.Efectivo, 100m, "recepcion-1"), CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.ErrorType.Should().Be(ErrorType.Conflict);
    }

    [Fact]
    public async Task PayInvoice_PartialPayment_AllowsRemainingBalance()
    {
        var invoice = new Invoice { Id = "inv-1", Total = 1000m };
        var invoiceRepository = new Mock<IInvoiceRepository>();
        invoiceRepository.Setup(r => r.GetByIdAsync("inv-1", It.IsAny<CancellationToken>())).ReturnsAsync(invoice);
        var handler = new PayInvoiceCommandHandler(invoiceRepository.Object);

        var result = await handler.Handle(
            new PayInvoiceCommand("inv-1", PaymentMethod.Transferencia, 400m, "recepcion-1"), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        invoice.Status.Should().Be(InvoiceStatus.Pendiente);
        invoice.Payments.Should().ContainSingle(p => p.Amount == 400m);
    }

    [Fact]
    public async Task CancelInvoice_WhenPending_SetsCancelled()
    {
        var invoice = new Invoice { Id = "inv-1", Total = 1000m };
        var invoiceRepository = new Mock<IInvoiceRepository>();
        invoiceRepository.Setup(r => r.GetByIdAsync("inv-1", It.IsAny<CancellationToken>())).ReturnsAsync(invoice);
        var handler = new CancelInvoiceCommandHandler(invoiceRepository.Object);

        var result = await handler.Handle(
            new CancelInvoiceCommand("inv-1", "Cliente no se presentó", "recepcion-1"), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        invoice.Status.Should().Be(InvoiceStatus.Anulada);
    }

    [Fact]
    public async Task CancelInvoice_WhenPaid_ReturnsConflict()
    {
        var invoice = new Invoice { Id = "inv-1", Total = 1000m, Status = InvoiceStatus.Pagada };
        var invoiceRepository = new Mock<IInvoiceRepository>();
        invoiceRepository.Setup(r => r.GetByIdAsync("inv-1", It.IsAny<CancellationToken>())).ReturnsAsync(invoice);
        var handler = new CancelInvoiceCommandHandler(invoiceRepository.Object);

        var result = await handler.Handle(
            new CancelInvoiceCommand("inv-1", null, null), CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.ErrorType.Should().Be(ErrorType.Conflict);
    }
}