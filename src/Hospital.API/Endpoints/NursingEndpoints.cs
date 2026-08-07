using System.Security.Claims;
using Hospital.Application.Features.Nursing.Commands;
using Hospital.Application.Features.Nursing.Queries;
using MediatR;
using static Hospital.API.Endpoints.PatientsEndpoints;

namespace Hospital.API.Endpoints;

public static class NursingEndpoints
{
    public static RouteGroupBuilder MapNursingEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/nursing")
            .WithTags("Nursing")
            .RequireAuthorization();

        group.MapPost("/vitals", async (CreateVitalsRecordCommand command, ClaimsPrincipal user, IMediator mediator) =>
        {
            var recordedBy = user.FindFirstValue(ClaimTypes.NameIdentifier);
            var result = await mediator.Send(command with { RecordedBy = recordedBy ?? string.Empty });
            return result.IsSuccess
                ? Results.Created($"/api/nursing/vitals/{result.Value}", new { id = result.Value })
                : ResultToHttp(result);
        })
        .RequireAuthorization("NurseOnly")
        .WithName("CreateVitalsRecord");

        group.MapGet("/vitals/patient/{patientId}", async (string patientId, IMediator mediator) =>
        {
            var result = await mediator.Send(new GetPatientVitalsQuery(patientId));
            return Results.Ok(result.Value);
        })
        .RequireAuthorization("NurseOrDoctor")
        .WithName("GetPatientVitals");

        return group;
    }
}