using Hospital.Application.Features.Doctors.Commands;
using Hospital.Application.Features.Doctors.Queries;
using Hospital.Domain.Common;
using MediatR;
using static Hospital.API.Endpoints.PatientsEndpoints;

namespace Hospital.API.Endpoints;

public static class DoctorsEndpoints
{
    public static RouteGroupBuilder MapDoctorsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/doctors")
            .WithTags("Doctors")
            .RequireAuthorization();

        group.MapGet("/", async (string? specialty, string? search, IMediator mediator) =>
        {
            var result = await mediator.Send(new GetDoctorsQuery(specialty, search));
            return Results.Ok(result.Value);
        })
        .WithName("GetDoctors");

        group.MapGet("/{id}", async (string id, IMediator mediator) =>
        {
            var result = await mediator.Send(new GetDoctorQuery(id));
            return result.IsSuccess
                ? Results.Ok(result.Value)
                : Results.NotFound(new { error = result.Error });
        })
        .WithName("GetDoctor");

        group.MapPost("/", async (CreateDoctorCommand command, IMediator mediator) =>
        {
            var result = await mediator.Send(command);
            return result.IsSuccess
                ? Results.Created($"/api/doctors/{result.Value}", new { id = result.Value })
                : ResultToHttp(result);
        })
        .RequireAuthorization("AdminOnly")
        .WithName("CreateDoctor");

        group.MapPut("/{id}", async (string id, UpdateDoctorCommand command, IMediator mediator) =>
        {
            command = command with { Id = id };
            var result = await mediator.Send(command);
            return result.IsSuccess ? Results.NoContent() : ResultToHttp(result);
        })
        .RequireAuthorization("AdminOnly")
        .WithName("UpdateDoctor");

        group.MapDelete("/{id}", async (string id, IMediator mediator) =>
        {
            var result = await mediator.Send(new DeleteDoctorCommand(id));
            return result.IsSuccess ? Results.NoContent() : ResultToHttp(result);
        })
        .RequireAuthorization("AdminOnly")
        .WithName("DeleteDoctor");

        return group;
    }
}