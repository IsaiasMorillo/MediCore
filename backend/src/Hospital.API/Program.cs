using Hospital.API.Configuration;
using Hospital.API.Extensions;
using Hospital.API.Middleware;
using Hospital.Application;
using Hospital.Application.Features.Auth.Commands;
using Hospital.Domain.Enums;
using Hospital.Infrastructure;
using Hospital.Infrastructure.MongoDb;
using Hospital.Infrastructure.MongoDb.Repositories;
using Hospital.Infrastructure.Settings;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;

var builder = WebApplication.CreateBuilder(args);

const string FrontendCorsPolicy = "Frontend";

var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>()?
    .Where(origin => !string.IsNullOrWhiteSpace(origin))
    .Select(origin => origin.Trim())
    .Distinct(StringComparer.OrdinalIgnoreCase)
    .ToArray() ?? [];

builder.Services.Configure<MongoDbSettings>(builder.Configuration.GetSection(MongoDbSettings.SectionName));
builder.Services
    .AddOptions<JwtSettings>()
    .Bind(builder.Configuration.GetSection(JwtSettings.SectionName))
    .Validate(settings => !string.IsNullOrWhiteSpace(settings.Secret) && settings.Secret.Length >= 32,
        "JwtSettings:Secret debe tener al menos 32 caracteres.")
    .Validate(settings => settings.ExpirationMinutes > 0,
        "JwtSettings:ExpirationMinutes debe ser mayor que cero.")
    .ValidateOnStart();
builder.Services.Configure<SmtpSettings>(builder.Configuration.GetSection(SmtpSettings.SectionName));

builder.Services.AddApplication();
builder.Services.AddInfrastructure();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();
builder.Services.AddProblemDetails(options =>
{
    options.CustomizeProblemDetails = context =>
    {
        context.ProblemDetails.Instance ??= context.HttpContext.Request.Path.Value;
        context.ProblemDetails.Extensions["traceId"] = context.HttpContext.TraceIdentifier;

        if (context.ProblemDetails.Status == StatusCodes.Status500InternalServerError &&
            !builder.Environment.IsDevelopment())
        {
            context.ProblemDetails.Detail = "Ha ocurrido un error inesperado.";
        }
    };
});

builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendCorsPolicy, policy =>
    {
        if (allowedOrigins.Length > 0)
        {
            policy.WithOrigins(allowedOrigins);
        }

        policy.AllowAnyHeader()
            .WithMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS");
    });
});

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
});

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer();

builder.Services.AddSingleton<IPostConfigureOptions<JwtBearerOptions>, ConfigureJwtBearerOptions>();

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole(UserRole.Admin.ToString()));
    options.AddPolicy("DoctorOnly", policy => policy.RequireRole(UserRole.Medico.ToString(), UserRole.Admin.ToString()));
    options.AddPolicy("PharmacyOnly", policy => policy.RequireRole(UserRole.Farmacia.ToString(), UserRole.Admin.ToString()));
    options.AddPolicy("ReceptionOrAdmin", policy => policy.RequireRole(UserRole.Recepcion.ToString(), UserRole.Admin.ToString()));
    options.AddPolicy("LaboratoryOnly", policy => policy.RequireRole(UserRole.Laboratorio.ToString(), UserRole.Admin.ToString()));
    options.AddPolicy("PatientOnly", policy => policy
        .RequireRole(UserRole.Paciente.ToString())
        .RequireClaim("patientId"));
    options.AddPolicy("NurseOnly", policy => policy.RequireRole(UserRole.Enfermero.ToString(), UserRole.Admin.ToString()));
    options.AddPolicy("NurseOrDoctor", policy => policy.RequireRole(UserRole.Enfermero.ToString(), UserRole.Medico.ToString(), UserRole.Admin.ToString()));
    options.AddPolicy("InternalStaff", policy => policy.RequireRole(
        UserRole.Admin.ToString(),
        UserRole.Medico.ToString(),
        UserRole.Enfermero.ToString(),
        UserRole.Recepcion.ToString(),
        UserRole.Laboratorio.ToString(),
        UserRole.Farmacia.ToString()));
    options.AddPolicy("DoctorOrLaboratory", policy => policy.RequireRole(
        UserRole.Medico.ToString(),
        UserRole.Laboratorio.ToString(),
        UserRole.Admin.ToString()));
    options.AddPolicy("DoctorOrPharmacy", policy => policy.RequireRole(
        UserRole.Medico.ToString(),
        UserRole.Farmacia.ToString(),
        UserRole.Admin.ToString()));
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseStatusCodePages();
if (!app.Environment.IsEnvironment("Testing"))
{
    app.UseHttpsRedirection();
}
app.UseRouting();
app.UseCors(FrontendCorsPolicy);
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }))
    .WithName("HealthCheck");

app.MapApiEndpoints();

using (var scope = app.Services.CreateScope())
{
    var seeder = scope.ServiceProvider.GetRequiredService<UserSeeder>();
    await seeder.SeedAsync();
}

app.Run();

public partial class Program;
