using Hospital.Application.Features.Laboratory;
using Hospital.Application.Features.Laboratory.Commands;
using Hospital.Application.Features.Laboratory.Queries;
using MediatR;
using static Hospital.API.Endpoints.PatientsEndpoints;

namespace Hospital.API.Endpoints;

public static class LaboratoryEndpoints
{
    public static RouteGroupBuilder MapLaboratoryEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/laboratory")
            .WithTags("Laboratory")
            .RequireAuthorization();

        group.MapGet("/test-types", (ILaboratoryOrderFactory factory) =>
            Results.Ok(new { supported = factory.SupportedTestTypes, templates = Enum.GetNames<Hospital.Domain.Enums.TestType>() }))
            .WithName("GetLaboratoryTestTypes");

        group.MapPost("/orders", async (CreateLaboratoryOrderCommand command, IMediator mediator) =>
        {
            var result = await mediator.Send(command);
            return result.IsSuccess
                ? Results.Created($"/api/laboratory/orders/{result.Value}", new { id = result.Value })
                : ResultToHttp(result);
        })
        .RequireAuthorization("DoctorOnly")
        .WithName("CreateLaboratoryOrder");

        group.MapGet("/orders/{id}", async (string id, IMediator mediator) =>
        {
            var result = await mediator.Send(new GetLaboratoryOrderQuery(id));
            return result.IsSuccess
                ? Results.Ok(result.Value)
                : Results.NotFound(new { error = result.Error });
        })
        .WithName("GetLaboratoryOrder");

        group.MapGet("/orders/patient/{patientId}", async (string patientId, IMediator mediator) =>
        {
            var result = await mediator.Send(new GetPatientLaboratoryOrdersQuery(patientId));
            return Results.Ok(result.Value);
        })
        .WithName("GetPatientLaboratoryOrders");

        group.MapPost("/orders/{id}/results", async (string id, Dictionary<string, object?> results, IMediator mediator) =>
        {
            var result = await mediator.Send(new LoadLaboratoryResultsCommand(id, results));
            return result.IsSuccess ? Results.NoContent() : ResultToHttp(result);
        })
        .RequireAuthorization("LaboratoryOnly")
        .WithName("LoadLaboratoryResults");

        return group;
    }
}