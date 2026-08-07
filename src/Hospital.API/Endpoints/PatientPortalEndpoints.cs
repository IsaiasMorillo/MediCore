using System.Security.Claims;
using Hospital.Application.Features.PatientPortal.Queries;
using MediatR;

namespace Hospital.API.Endpoints;

public static class PatientPortalEndpoints
{
    public static RouteGroupBuilder MapPatientPortalEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/patient-portal")
            .WithTags("PatientPortal")
            .RequireAuthorization("PatientOnly");

        group.MapGet("/upcoming-appointments", async (ClaimsPrincipal user, IMediator mediator) =>
        {
            var patientId = user.FindFirstValue("patientId");
            if (string.IsNullOrWhiteSpace(patientId))
            {
                return Results.Forbid();
            }

            var result = await mediator.Send(new GetUpcomingAppointmentsQuery(patientId));
            return Results.Ok(result.Value);
        })
        .WithName("GetPatientUpcomingAppointments");

        group.MapGet("/active-prescriptions", async (ClaimsPrincipal user, IMediator mediator) =>
        {
            var patientId = user.FindFirstValue("patientId");
            if (string.IsNullOrWhiteSpace(patientId))
            {
                return Results.Forbid();
            }

            var result = await mediator.Send(new GetActivePrescriptionsQuery(patientId));
            return Results.Ok(result.Value);
        })
        .WithName("GetPatientActivePrescriptions");

        return group;
    }
}