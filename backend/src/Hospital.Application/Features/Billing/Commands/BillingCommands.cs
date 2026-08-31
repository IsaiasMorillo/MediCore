using Hospital.Application.Features.Billing.Queries;
using Hospital.Domain.Common;
using Hospital.Domain.Enums;
using MediatR;

namespace Hospital.Application.Features.Billing.Commands;

public record CreateInvoiceItemRequest(
    InvoiceItemType Type,
    string Description,
    int Quantity,
    decimal UnitPrice,
    string? AppointmentId = null,
    string? LaboratoryOrderId = null,
    string? PrescriptionId = null);

public record CreateInvoiceCommand(
    string PatientId,
    List<CreateInvoiceItemRequest> Items,
    string CreatedBy) : IRequest<Result<InvoiceResponse>>;

public record PayInvoiceCommand(
    string Id,
    PaymentMethod Method,
    decimal Amount,
    string? PaidBy) : IRequest<Result<Unit>>;

public record CancelInvoiceCommand(
    string Id,
    string? Reason,
    string? CancelledBy) : IRequest<Result<Unit>>;