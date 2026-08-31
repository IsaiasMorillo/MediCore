using Hospital.Domain.Common;
using Hospital.Domain.Entities;
using Hospital.Domain.Enums;
using Hospital.Domain.Interfaces;
using MediatR;

namespace Hospital.Application.Features.Billing.Queries;

public record InvoiceItemResponse(
    InvoiceItemType Type,
    string Description,
    int Quantity,
    decimal UnitPrice,
    decimal Subtotal,
    string? AppointmentId,
    string? LaboratoryOrderId,
    string? PrescriptionId);

public record PaymentResponse(PaymentMethod Method, decimal Amount, DateTime PaidAt, string? PaidBy);

public record InvoiceResponse(
    string Id,
    string Number,
    string PatientId,
    string CreatedBy,
    DateTime InvoiceDate,
    CoverageType CoverageType,
    IReadOnlyList<InvoiceItemResponse> Items,
    decimal Subtotal,
    decimal InsuranceCoverage,
    decimal Discount,
    decimal Taxes,
    decimal Total,
    decimal PaidAmount,
    decimal Balance,
    InvoiceStatus Status,
    IReadOnlyList<PaymentResponse> Payments);

public record GetInvoiceQuery(string Id) : IRequest<Result<InvoiceResponse>>;

public record GetPatientInvoicesQuery(string PatientId)
    : IRequest<Result<IReadOnlyList<InvoiceResponse>>>;

public class GetInvoiceQueryHandler(IInvoiceRepository invoiceRepository)
    : IRequestHandler<GetInvoiceQuery, Result<InvoiceResponse>>
{
    public async Task<Result<InvoiceResponse>> Handle(GetInvoiceQuery query, CancellationToken cancellationToken)
    {
        var invoice = await invoiceRepository.GetByIdAsync(query.Id, cancellationToken);
        return invoice is null
            ? Result.Failure<InvoiceResponse>("Factura no encontrada.", ErrorType.NotFound)
            : Result.Success(BillingQueryHandlers.ToResponse(invoice));
    }
}

public class GetPatientInvoicesQueryHandler(IInvoiceRepository invoiceRepository)
    : IRequestHandler<GetPatientInvoicesQuery, Result<IReadOnlyList<InvoiceResponse>>>
{
    public async Task<Result<IReadOnlyList<InvoiceResponse>>> Handle(
        GetPatientInvoicesQuery query,
        CancellationToken cancellationToken)
    {
        var invoices = await invoiceRepository.GetByPatientAsync(query.PatientId, cancellationToken);
        return Result.Success((IReadOnlyList<InvoiceResponse>)invoices.Select(BillingQueryHandlers.ToResponse).ToList());
    }
}

public static class BillingQueryHandlers
{
    public static InvoiceResponse ToResponse(Invoice invoice)
    {
        var paid = invoice.Payments.Sum(p => p.Amount);
        return new InvoiceResponse(
            invoice.Id,
            invoice.Number,
            invoice.PatientId,
            invoice.CreatedBy,
            invoice.InvoiceDate,
            invoice.CoverageType,
            invoice.Items.Select(i => new InvoiceItemResponse(
                i.Type,
                i.Description,
                i.Quantity,
                i.UnitPrice,
                i.Subtotal,
                i.AppointmentId,
                i.LaboratoryOrderId,
                i.PrescriptionId)).ToList(),
            invoice.Subtotal,
            invoice.InsuranceCoverage,
            invoice.Discount,
            invoice.Taxes,
            invoice.Total,
            paid,
            invoice.Total - paid,
            invoice.Status,
            invoice.Payments.Select(p => new PaymentResponse(p.Method, p.Amount, p.PaidAt, p.PaidBy)).ToList());
    }
}