using Hospital.Application.Features.Pharmacy.Commands;
using Hospital.Application.Features.Pharmacy.Queries;
using MediatR;
using static Hospital.API.Endpoints.PatientsEndpoints;

namespace Hospital.API.Endpoints;

public static class PharmacyEndpoints
{
    public static RouteGroupBuilder MapPharmacyEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/pharmacy")
            .WithTags("Pharmacy")
            .RequireAuthorization();

        group.MapGet("/medications", async (string? search, IMediator mediator) =>
        {
            var result = await mediator.Send(new GetMedicationsQuery(search));
            return Results.Ok(result.Value);
        })
        .WithName("GetMedications");

        group.MapPost("/medications", async (CreateMedicationCommand command, IMediator mediator) =>
        {
            var result = await mediator.Send(command);
            return result.IsSuccess
                ? Results.Created($"/api/pharmacy/medications/{result.Value}", new { id = result.Value })
                : ResultToHttp(result);
        })
        .RequireAuthorization("PharmacyOnly")
        .WithName("CreateMedication");

        group.MapPut("/medications/{id}", async (string id, UpdateMedicationCommand command, IMediator mediator) =>
        {
            command = command with { Id = id };
            var result = await mediator.Send(command);
            return result.IsSuccess ? Results.NoContent() : ResultToHttp(result);
        })
        .RequireAuthorization("PharmacyOnly")
        .WithName("UpdateMedication");

        group.MapPatch("/medications/{id}/stock", async (string id, AdjustStockRequest request, IMediator mediator) =>
        {
            var result = await mediator.Send(new AdjustStockCommand(id, request.QuantityChange));
            return result.IsSuccess ? Results.Ok(result.Value) : ResultToHttp(result);
        })
        .RequireAuthorization("PharmacyOnly")
        .WithName("AdjustStock");

        group.MapPost("/prescriptions", async (CreatePrescriptionCommand command, IMediator mediator) =>
        {
            var result = await mediator.Send(command);
            return result.IsSuccess
                ? Results.Created($"/api/pharmacy/prescriptions/{result.Value}", new { id = result.Value })
                : ResultToHttp(result);
        })
        .RequireAuthorization("DoctorOnly")
        .WithName("CreatePrescription");

        group.MapGet("/prescriptions/patient/{patientId}", async (string patientId, IMediator mediator) =>
        {
            var result = await mediator.Send(new GetPatientPrescriptionsQuery(patientId));
            return Results.Ok(result.Value);
        })
        .WithName("GetPatientPrescriptions");

        group.MapPost("/prescriptions/{id}/dispense", async (string id, DispenseRequest request, IMediator mediator) =>
        {
            var result = await mediator.Send(new DispensePrescriptionCommand(id, request.DispensedBy));
            return result.IsSuccess ? Results.NoContent() : ResultToHttp(result);
        })
        .RequireAuthorization("PharmacyOnly")
        .WithName("DispensePrescription");

        return group;
    }
}

public record AdjustStockRequest(int QuantityChange);

public record DispenseRequest(string? DispensedBy);