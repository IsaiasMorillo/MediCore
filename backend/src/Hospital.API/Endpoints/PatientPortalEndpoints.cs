using System.Security.Claims;
using Hospital.API.Extensions;
using Hospital.Application.Features.Billing.Queries;
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
            if (!TryGetPatientId(user, out var patientId))
            {
                return ApiResults.Forbidden("La cuenta no está vinculada a un paciente.");
            }

            var result = await mediator.Send(new GetUpcomingAppointmentsQuery(patientId));
            return result.IsSuccess ? Results.Ok(result.Value) : ApiResults.FromResult(result);
        })
        .WithName("GetPatientUpcomingAppointments");

        group.MapGet("/active-prescriptions", async (ClaimsPrincipal user, IMediator mediator) =>
        {
            if (!TryGetPatientId(user, out var patientId))
            {
                return ApiResults.Forbidden("La cuenta no está vinculada a un paciente.");
            }

            var result = await mediator.Send(new GetActivePrescriptionsQuery(patientId));
            return result.IsSuccess ? Results.Ok(result.Value) : ApiResults.FromResult(result);
        })
        .WithName("GetPatientActivePrescriptions");

        group.MapGet("/invoices", async (ClaimsPrincipal user, IMediator mediator) =>
        {
            if (!TryGetPatientId(user, out var patientId))
            {
                return ApiResults.Forbidden("La cuenta no está vinculada a un paciente.");
            }

            var result = await mediator.Send(new GetPatientInvoicesQuery(patientId));
            return result.IsSuccess ? Results.Ok(result.Value) : ApiResults.FromResult(result);
        })
        .WithName("GetPatientPortalInvoices");

        group.MapGet("/laboratory-results", async (ClaimsPrincipal user, IMediator mediator) =>
        {
            if (!TryGetPatientId(user, out var patientId))
            {
                return ApiResults.Forbidden("La cuenta no está vinculada a un paciente.");
            }

            var result = await mediator.Send(new GetPatientLaboratoryResultsQuery(patientId));
            return result.IsSuccess ? Results.Ok(result.Value) : ApiResults.FromResult(result);
        })
        .WithName("GetPatientPortalLaboratoryResults");

        return group;
    }

    private static bool TryGetPatientId(ClaimsPrincipal user, out string patientId)
    {
        patientId = user.FindFirstValue("patientId") ?? string.Empty;
        return !string.IsNullOrWhiteSpace(patientId);
    }
}
