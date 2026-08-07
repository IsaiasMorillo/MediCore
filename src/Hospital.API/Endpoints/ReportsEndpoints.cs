using Hospital.Application.Features.Reports.Queries;
using MediatR;

namespace Hospital.API.Endpoints;

public static class ReportsEndpoints
{
    public static RouteGroupBuilder MapReportsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/reports")
            .WithTags("Reports")
            .RequireAuthorization();

        group.MapGet("/invoices-summary", async (DateTime? from, DateTime? to, IMediator mediator) =>
        {
            var result = await mediator.Send(new GetInvoicesSummaryReportQuery(from, to));
            return Results.Ok(result.Value);
        })
        .RequireAuthorization("AdminOnly")
        .WithName("GetInvoicesSummaryReport");

        group.MapGet("/medications-dispensed", async (int? limit, IMediator mediator) =>
        {
            var result = await mediator.Send(new GetMedicationsDispensedReportQuery(limit ?? 10));
            return Results.Ok(result.Value);
        })
        .RequireAuthorization("PharmacyOnly")
        .WithName("GetMedicationsDispensedReport");

        group.MapGet("/laboratory-most-requested", async (int? limit, IMediator mediator) =>
        {
            var result = await mediator.Send(new GetLaboratoryMostRequestedReportQuery(limit ?? 10));
            return Results.Ok(result.Value);
        })
        .RequireAuthorization("LaboratoryOnly")
        .WithName("GetLaboratoryMostRequestedReport");

        group.MapGet("/patients-most-frequent", async (int? limit, IMediator mediator) =>
        {
            var result = await mediator.Send(new GetPatientsMostFrequentReportQuery(limit ?? 10));
            return Results.Ok(result.Value);
        })
        .RequireAuthorization("AdminOnly")
        .WithName("GetPatientsMostFrequentReport");

        group.MapGet("/low-stock", async (IMediator mediator) =>
        {
            var result = await mediator.Send(new GetLowStockReportQuery());
            return Results.Ok(result.Value);
        })
        .RequireAuthorization("PharmacyOnly")
        .WithName("GetLowStockReport");

        return group;
    }
}