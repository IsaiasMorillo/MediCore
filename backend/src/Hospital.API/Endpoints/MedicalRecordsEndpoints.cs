using Hospital.Application.Features.MedicalRecords.Commands;
using Hospital.Application.Features.MedicalRecords.Queries;
using MediatR;
using static Hospital.API.Endpoints.PatientsEndpoints;

namespace Hospital.API.Endpoints;

public static class MedicalRecordsEndpoints
{
    public static RouteGroupBuilder MapMedicalRecordsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/medical-records")
            .WithTags("MedicalRecords")
            .RequireAuthorization("DoctorOnly");

        group.MapPost("/", async (CreateMedicalRecordCommand command, IMediator mediator) =>
        {
            var result = await mediator.Send(command);
            return result.IsSuccess
                ? Results.Created($"/api/medical-records/{result.Value}", new { id = result.Value })
                : ResultToHttp(result);
        })
        .RequireAuthorization("DoctorOnly")
        .WithName("CreateMedicalRecord");

        group.MapGet("/search", async (string term, IMediator mediator) =>
        {
            var result = await mediator.Send(new SearchPatientClinicalHistoryQuery(term));
            return result.IsSuccess
                ? Results.Ok(result.Value)
                : ResultToHttp(result);
        })
        .RequireAuthorization("DoctorOnly")
        .WithName("SearchPatientClinicalHistory");

        group.MapGet("/{id}", async (string id, IMediator mediator) =>
        {
            var result = await mediator.Send(new GetMedicalRecordQuery(id));
            return result.IsSuccess
                ? Results.Ok(result.Value)
                : ResultToHttp(result);
        })
        .RequireAuthorization("DoctorOnly")
        .WithName("GetMedicalRecord");

        group.MapGet("/patient/{patientId}", async (string patientId, IMediator mediator) =>
        {
            var result = await mediator.Send(new GetPatientMedicalRecordsQuery(patientId));
            return result.IsSuccess ? Results.Ok(result.Value) : ResultToHttp(result);
        })
        .RequireAuthorization("DoctorOnly")
        .WithName("GetPatientMedicalRecords");

        return group;
    }
}
