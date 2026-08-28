using Hospital.Application.Features.Reports.Queries;
using MediatR;
using static Hospital.API.Endpoints.PatientsEndpoints;

namespace Hospital.API.Endpoints;

public static class ReportsEndpoints
{
    public static RouteGroupBuilder MapReportsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/reports")
            .WithTags("Reports")
            .RequireAuthorization("InternalStaff");

        group.MapGet("/invoices-summary", async (DateTime? from, DateTime? to, IMediator mediator) =>
        {
            var result = await mediator.Send(new GetInvoicesSummaryReportQuery(from, to));
            return result.IsSuccess ? Results.Ok(result.Value) : ResultToHttp(result);
        })
        .RequireAuthorization("AdminOnly")
        .WithName("GetInvoicesSummaryReport");

        group.MapGet("/medications-dispensed", async (int? limit, IMediator mediator) =>
        {
            var result = await mediator.Send(new GetMedicationsDispensedReportQuery(limit ?? 10));
            return result.IsSuccess ? Results.Ok(result.Value) : ResultToHttp(result);
        })
        .RequireAuthorization("PharmacyOnly")
        .WithName("GetMedicationsDispensedReport");

        group.MapGet("/laboratory-most-requested", async (int? limit, IMediator mediator) =>
        {
            var result = await mediator.Send(new GetLaboratoryMostRequestedReportQuery(limit ?? 10));
            return result.IsSuccess ? Results.Ok(result.Value) : ResultToHttp(result);
        })
        .RequireAuthorization("LaboratoryOnly")
        .WithName("GetLaboratoryMostRequestedReport");

        group.MapGet("/patients-most-frequent", async (int? limit, IMediator mediator) =>
        {
            var result = await mediator.Send(new GetPatientsMostFrequentReportQuery(limit ?? 10));
            return result.IsSuccess ? Results.Ok(result.Value) : ResultToHttp(result);
        })
        .RequireAuthorization("AdminOnly")
        .WithName("GetPatientsMostFrequentReport");

        group.MapGet("/low-stock", async (IMediator mediator) =>
        {
            var result = await mediator.Send(new GetLowStockReportQuery());
            return result.IsSuccess ? Results.Ok(result.Value) : ResultToHttp(result);
        })
        .RequireAuthorization("PharmacyOnly")
        .WithName("GetLowStockReport");

        return group;
    }
}
