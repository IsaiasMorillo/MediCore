using Hospital.Application.Features.Appointments;
using Hospital.Application.Features.Appointments.Commands;
using Hospital.Application.Features.Appointments.Queries;
using Hospital.Domain.Common;
using MediatR;
using static Hospital.API.Endpoints.PatientsEndpoints;

namespace Hospital.API.Endpoints;

public static class AppointmentsEndpoints
{
    public static RouteGroupBuilder MapAppointmentsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/appointments")
            .WithTags("Appointments")
            .RequireAuthorization();

        group.MapPost("/", async (CreateAppointmentCommand command, IMediator mediator) =>
        {
            var result = await mediator.Send(command);
            return result.IsSuccess
                ? Results.Created($"/api/appointments/{result.Value}", new { id = result.Value })
                : ResultToHttp(result);
        })
        .RequireAuthorization("ReceptionOrAdmin")
        .WithName("CreateAppointment");

        group.MapGet("/{id}", async (string id, IMediator mediator) =>
        {
            var result = await mediator.Send(new GetAppointmentQuery(id));
            return result.IsSuccess
                ? Results.Ok(result.Value)
                : Results.NotFound(new { error = result.Error });
        })
        .WithName("GetAppointment");

        group.MapGet("/availability/{doctorId}", async (string doctorId, [AsParameters] DateOnlyQuery query, IMediator mediator) =>
        {
            var result = await mediator.Send(new GetDoctorAvailabilityQuery(doctorId, query.Date));
            return result.IsSuccess
                ? Results.Ok(result.Value)
                : Results.NotFound(new { error = result.Error });
        })
        .WithName("GetDoctorAvailability");

        group.MapGet("/availability", async ([AsParameters] DateOnlyQuery query, IMediator mediator) =>
        {
            var result = await mediator.Send(new GetGlobalAvailabilityQuery(query.Date));
            return Results.Ok(result.Value);
        })
        .RequireAuthorization("ReceptionOrAdmin")
        .WithName("GetGlobalAvailability");

        group.MapPut("/{id}/reschedule", async (string id, RescheduleAppointmentRequest request, IMediator mediator) =>
        {
            var result = await mediator.Send(new RescheduleAppointmentCommand(id, request.NewStartDateTime));
            return result.IsSuccess ? Results.NoContent() : ResultToHttp(result);
        })
        .RequireAuthorization("ReceptionOrAdmin")
        .WithName("RescheduleAppointment");

        group.MapPost("/{id}/confirm", async (string id, IMediator mediator) =>
        {
            var result = await mediator.Send(new ConfirmAppointmentCommand(id));
            return result.IsSuccess ? Results.NoContent() : ResultToHttp(result);
        })
        .RequireAuthorization("ReceptionOrAdmin")
        .WithName("ConfirmAppointment");

        group.MapPost("/{id}/cancel", async (string id, IMediator mediator) =>
        {
            var result = await mediator.Send(new CancelAppointmentCommand(id));
            return result.IsSuccess ? Results.NoContent() : ResultToHttp(result);
        })
        .RequireAuthorization("ReceptionOrAdmin")
        .WithName("CancelAppointment");

        return group;
    }
}

public record DateOnlyQuery(DateOnly Date);

public record RescheduleAppointmentRequest(DateTime NewStartDateTime);