using Hospital.Application.Features.Billing.Commands;
using Hospital.Application.Features.Billing.Queries;
using Hospital.Domain.Enums;
using MediatR;
using static Hospital.API.Endpoints.PatientsEndpoints;

namespace Hospital.API.Endpoints;

public static class InvoicesEndpoints
{
    public static RouteGroupBuilder MapInvoicesEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/invoices")
            .WithTags("Invoices")
            .RequireAuthorization();

        group.MapPost("/", async (CreateInvoiceCommand command, IMediator mediator) =>
        {
            var result = await mediator.Send(command);
            return result.IsSuccess
                ? Results.Created($"/api/invoices/{result.Value!.Id}", result.Value)
                : ResultToHttp(result);
        })
        .RequireAuthorization("ReceptionOrAdmin")
        .WithName("CreateInvoice");

        group.MapGet("/{id}", async (string id, IMediator mediator) =>
        {
            var result = await mediator.Send(new GetInvoiceQuery(id));
            return result.IsSuccess
                ? Results.Ok(result.Value)
                : Results.NotFound(new { error = result.Error });
        })
        .WithName("GetInvoice");

        group.MapGet("/patient/{patientId}", async (string patientId, IMediator mediator) =>
        {
            var result = await mediator.Send(new GetPatientInvoicesQuery(patientId));
            return Results.Ok(result.Value);
        })
        .WithName("GetPatientInvoices");

        group.MapPost("/{id}/pay", async (string id, PayInvoiceRequest request, IMediator mediator) =>
        {
            var result = await mediator.Send(new PayInvoiceCommand(id, request.Method, request.Amount, request.PaidBy));
            return result.IsSuccess ? Results.NoContent() : ResultToHttp(result);
        })
        .RequireAuthorization("ReceptionOrAdmin")
        .WithName("PayInvoice");

        group.MapPost("/{id}/cancel", async (string id, CancelInvoiceRequest request, IMediator mediator) =>
        {
            var result = await mediator.Send(new CancelInvoiceCommand(id, request.Reason, request.CancelledBy));
            return result.IsSuccess ? Results.NoContent() : ResultToHttp(result);
        })
        .RequireAuthorization("ReceptionOrAdmin")
        .WithName("CancelInvoice");

        return group;
    }
}

public record PayInvoiceRequest(PaymentMethod Method, decimal Amount, string? PaidBy);

public record CancelInvoiceRequest(string? Reason, string? CancelledBy);