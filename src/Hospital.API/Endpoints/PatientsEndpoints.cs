using Hospital.Application.Features.Patients.Commands;
using Hospital.Application.Features.Patients.Queries;
using Hospital.API.Extensions;
using Hospital.Domain.Common;
using MediatR;

namespace Hospital.API.Endpoints;

public static class PatientsEndpoints
{
    public static RouteGroupBuilder MapPatientsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/patients")
            .WithTags("Patients")
            .RequireAuthorization("InternalStaff");

        group.MapGet("/", async (string? search, IMediator mediator) =>
        {
            var result = await mediator.Send(new SearchPatientsQuery(search));
            return result.IsSuccess ? Results.Ok(result.Value) : ResultToHttp(result);
        })
        .WithName("SearchPatients");

        group.MapGet("/{id}", async (string id, IMediator mediator) =>
        {
            var result = await mediator.Send(new GetPatientQuery(id));
            return result.IsSuccess
                ? Results.Ok(result.Value)
                : ResultToHttp(result);
        })
        .WithName("GetPatient");

        group.MapPost("/", async (CreatePatientCommand command, IMediator mediator) =>
        {
            var result = await mediator.Send(command);
            return result.IsSuccess
                ? Results.Created($"/api/patients/{result.Value}", new { id = result.Value })
                : ResultToHttp(result);
        })
        .RequireAuthorization("ReceptionOrAdmin")
        .WithName("CreatePatient");

        group.MapPut("/{id}", async (string id, UpdatePatientCommand command, IMediator mediator) =>
        {
            command = command with { Id = id };
            var result = await mediator.Send(command);
            return result.IsSuccess ? Results.NoContent() : ResultToHttp(result);
        })
        .RequireAuthorization("ReceptionOrAdmin")
        .WithName("UpdatePatient");

        group.MapDelete("/{id}", async (string id, IMediator mediator) =>
        {
            var result = await mediator.Send(new DeletePatientCommand(id));
            return result.IsSuccess ? Results.NoContent() : ResultToHttp(result);
        })
        .RequireAuthorization("AdminOnly")
        .WithName("DeletePatient");

        return group;
    }

    internal static IResult ResultToHttp(Result result)
    {
        return ApiResults.FromResult(result);
    }
}
