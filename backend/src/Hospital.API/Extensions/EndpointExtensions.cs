using Hospital.API.Endpoints;
using Hospital.API.Filters;

namespace Hospital.API.Extensions;

public static class EndpointExtensions
{
    public static void MapApiEndpoints(this WebApplication app)
    {
        app.MapAuthEndpoints().AddCommonFilters();
        app.MapPatientsEndpoints().AddCommonFilters();
        app.MapDoctorsEndpoints().AddCommonFilters();
        app.MapAppointmentsEndpoints().AddCommonFilters();
        app.MapMedicalRecordsEndpoints().AddCommonFilters();
        app.MapLaboratoryEndpoints().AddCommonFilters();
        app.MapPharmacyEndpoints().AddCommonFilters();
        app.MapInvoicesEndpoints().AddCommonFilters();
        app.MapReportsEndpoints().AddCommonFilters();
        app.MapPatientPortalEndpoints().AddCommonFilters();
        app.MapNursingEndpoints().AddCommonFilters();
    }

    private static RouteGroupBuilder AddCommonFilters(this RouteGroupBuilder group) =>
        group.AddEndpointFilter<ModelValidationFilter>()
            .AddEndpointFilter<PerformanceLoggingFilter>();
}