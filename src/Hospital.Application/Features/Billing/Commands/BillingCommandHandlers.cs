using Hospital.Application.Features.Billing;
using Hospital.Application.Features.Billing.Commands;
using Hospital.Application.Features.Billing.Queries;
using Hospital.Domain.Common;
using Hospital.Domain.Entities;
using Hospital.Domain.Enums;
using Hospital.Domain.Interfaces;
using MediatR;

namespace Hospital.Application.Features.Billing.Commands;

public class CreateInvoiceCommandHandler(
    IPatientRepository patientRepository,
    IInvoiceRepository invoiceRepository,
    BillingStrategyFactory strategyFactory) : IRequestHandler<CreateInvoiceCommand, Result<InvoiceResponse>>
{
    public async Task<Result<InvoiceResponse>> Handle(CreateInvoiceCommand command, CancellationToken cancellationToken)
    {
        var patient = await patientRepository.GetByIdAsync(command.PatientId, cancellationToken);
        if (patient is null)
        {
            return Result.Failure<InvoiceResponse>("Paciente no encontrado.", ErrorType.NotFound);
        }

        if (command.Items is null || command.Items.Count == 0)
        {
            return Result.Failure<InvoiceResponse>("La factura debe contener al menos un item.");
        }

        foreach (var item in command.Items)
        {
            if (string.IsNullOrWhiteSpace(item.Description))
            {
                return Result.Failure<InvoiceResponse>("La descripción de cada item es obligatoria.");
            }

            if (item.Quantity <= 0)
            {
                return Result.Failure<InvoiceResponse>("La cantidad de cada item debe ser mayor que cero.");
            }

            if (item.UnitPrice < 0)
            {
                return Result.Failure<InvoiceResponse>("El precio unitario no puede ser negativo.");
            }
        }

        var coverage = CoverageTypeParser.Parse(patient.MedicalInsurance?.CoverageType);
        var items = command.Items.Select(i => new InvoiceItem
        {
            Type = i.Type,
            Description = i.Description.Trim(),
            Quantity = i.Quantity,
            UnitPrice = i.UnitPrice,
            Subtotal = BillingMath.Round2(i.UnitPrice * i.Quantity),
            AppointmentId = i.AppointmentId,
            LaboratoryOrderId = i.LaboratoryOrderId,
            PrescriptionId = i.PrescriptionId
        }).ToList();

        var breakdown = strategyFactory.Get(coverage).Calculate(items);

        var invoice = new Invoice
        {
            Number = BuildNumber(),
            PatientId = command.PatientId,
            CreatedBy = command.CreatedBy ?? string.Empty,
            InvoiceDate = DateTime.UtcNow,
            CoverageType = coverage,
            Items = items,
            Subtotal = breakdown.Subtotal,
            InsuranceCoverage = breakdown.InsuranceCoverage,
            Discount = breakdown.Discount,
            Taxes = breakdown.Taxes,
            Total = breakdown.Total
        };

        await invoiceRepository.AddAsync(invoice, cancellationToken);
        return Result.Success(BillingQueryHandlers.ToResponse(invoice));
    }

    private static string BuildNumber() =>
        $"FAC-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}";
}

public class PayInvoiceCommandHandler(IInvoiceRepository invoiceRepository)
    : IRequestHandler<PayInvoiceCommand, Result<Unit>>
{
    public async Task<Result<Unit>> Handle(PayInvoiceCommand command, CancellationToken cancellationToken)
    {
        var invoice = await invoiceRepository.GetByIdAsync(command.Id, cancellationToken);
        if (invoice is null)
        {
            return Result.Failure<Unit>("Factura no encontrada.", ErrorType.NotFound);
        }

        if (invoice.Status == InvoiceStatus.Pagada)
        {
            return Result.Failure<Unit>("La factura ya fue pagada.", ErrorType.Conflict);
        }

        if (invoice.Status == InvoiceStatus.Anulada)
        {
            return Result.Failure<Unit>("No se puede pagar una factura anulada.", ErrorType.Conflict);
        }

        if (command.Amount <= 0)
        {
            return Result.Failure<Unit>("El monto del pago debe ser mayor que cero.");
        }

        var paidSoFar = invoice.Payments.Sum(p => p.Amount);
        if (paidSoFar + command.Amount > invoice.Total)
        {
            return Result.Failure<Unit>(
                $"El pago excede el saldo pendiente de {invoice.Total - paidSoFar:C}.",
                ErrorType.Conflict);
        }

        invoice.Payments.Add(new Payment
        {
            Method = command.Method,
            Amount = BillingMath.Round2(command.Amount),
            PaidAt = DateTime.UtcNow,
            PaidBy = command.PaidBy
        });

        if (paidSoFar + command.Amount >= invoice.Total)
        {
            invoice.Status = InvoiceStatus.Pagada;
        }

        invoice.UpdatedAt = DateTime.UtcNow;
        await invoiceRepository.UpdateAsync(invoice, cancellationToken);
        return Result.Success(Unit.Value);
    }
}

public class CancelInvoiceCommandHandler(IInvoiceRepository invoiceRepository)
    : IRequestHandler<CancelInvoiceCommand, Result<Unit>>
{
    public async Task<Result<Unit>> Handle(CancelInvoiceCommand command, CancellationToken cancellationToken)
    {
        var invoice = await invoiceRepository.GetByIdAsync(command.Id, cancellationToken);
        if (invoice is null)
        {
            return Result.Failure<Unit>("Factura no encontrada.", ErrorType.NotFound);
        }

        if (invoice.Status == InvoiceStatus.Pagada)
        {
            return Result.Failure<Unit>("No se puede anular una factura pagada.", ErrorType.Conflict);
        }

        if (invoice.Status == InvoiceStatus.Anulada)
        {
            return Result.Failure<Unit>("La factura ya fue anulada.", ErrorType.Conflict);
        }

        invoice.Status = InvoiceStatus.Anulada;
        invoice.UpdatedAt = DateTime.UtcNow;
        await invoiceRepository.UpdateAsync(invoice, cancellationToken);
        return Result.Success(Unit.Value);
    }
}