using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Hospital.IntegrationTests;
using Xunit;

namespace Hospital.IntegrationTests.Features;

[Collection("MediCore")]
public class GlobalAvailabilityFlowTests(MediCoreApiFactory factory)
{
    [Fact]
    public async Task GlobalAvailability_ShowsAllSpecialistsWithTheirSlots()
    {
        var client = factory.CreateClient();
        var adminToken = await GetTokenAsync(client, "admin@medicore.do", "Admin123!");
        client.DefaultRequestHeaders.Authorization = With(adminToken);

        var recepcionEmail = $"recepcion_{Guid.NewGuid():N}@medicore.do";
        await RegisterUserAsync(client, recepcionEmail, "Recepcion");

        var monday = NextMonday();
        var mondayDoctorId = await CreateDoctorAsync(client, "Herminia", monday);
        await CreateDoctorAsync(client, "Julio", monday.AddDays(1));

        var createAppointment = await client.PostAsJsonAsync("/api/appointments", new
        {
            patientId = await CreatePatientAsync(client),
            doctorId = mondayDoctorId,
            startDateTime = monday.ToDateTime(new TimeOnly(9, 0), DateTimeKind.Utc),
            durationMinutes = 30,
            notes = "Consulta de control"
        });
        createAppointment.StatusCode.Should().Be(HttpStatusCode.Created);

        client.DefaultRequestHeaders.Authorization = With(await GetTokenAsync(client, recepcionEmail, "ClaveSegura123"));

        var availability = await client.GetFromJsonAsync<JsonElement>(
            $"/api/appointments/availability?date={monday:yyyy-MM-dd}");

        var rows = availability.EnumerateArray().ToList();
        rows.Should().NotBeEmpty();

        var mondayDoctor = rows.Single(d => d.GetProperty("doctorName").GetString() == "Herminia Médico");
        mondayDoctor.GetProperty("freeSlots").GetArrayLength().Should().Be(5);
        mondayDoctor.GetProperty("freeSlots").EnumerateArray()
            .Should().NotContain(s => s.GetDateTime() == monday.ToDateTime(new TimeOnly(9, 0), DateTimeKind.Utc));

        var tuesdayDoctor = rows.Single(d => d.GetProperty("doctorName").GetString() == "Julio Médico");
        tuesdayDoctor.GetProperty("freeSlots").GetArrayLength().Should().Be(0);
    }

    private static System.Net.Http.Headers.AuthenticationHeaderValue With(string token) =>
        new("Bearer", token);

    private static async Task<string> GetTokenAsync(HttpClient client, string email, string password)
    {
        var login = await client.PostAsJsonAsync("/api/auth/login", new { email, password });
        var body = await login.Content.ReadFromJsonAsync<JsonElement>();
        return body.GetProperty("token").GetString()!;
    }

    private static async Task RegisterUserAsync(HttpClient client, string email, string role)
    {
        var register = await client.PostAsJsonAsync("/api/auth/register", new
        {
            email,
            fullName = $"Usuario {role}",
            password = "ClaveSegura123",
            roles = new[] { role }
        });
        register.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    private static async Task<string> CreatePatientAsync(HttpClient client)
    {
        var createPatient = await client.PostAsJsonAsync("/api/patients", new
        {
            firstName = "Petronila",
            lastName = "Mancebo",
            documentId = $"DOC-{Guid.NewGuid():N}".ToUpper(),
            gender = "Femenino",
            contacts = new[] { new { type = "Phone", value = "829-555-8888" } }
        });
        createPatient.StatusCode.Should().Be(HttpStatusCode.Created);
        return (await createPatient.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString()!;
    }

    private static async Task<string> CreateDoctorAsync(HttpClient client, string firstName, DateOnly scheduleDay)
    {
        var createDoctor = await client.PostAsJsonAsync("/api/doctors", new
        {
            firstName,
            lastName = "Médico",
            specialty = "Medicina General",
            licenseNumber = $"LIC-{Guid.NewGuid():N}".ToUpperInvariant(),
            experienceYears = 6,
            office = "Consultorio 108",
            schedule = new[] { new { day = (int)scheduleDay.DayOfWeek, startTime = "08:00", endTime = "11:00" } }
        });
        createDoctor.StatusCode.Should().Be(HttpStatusCode.Created);
        return (await createDoctor.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString()!;
    }

    private static DateOnly NextMonday()
    {
        var daysUntilMonday = ((int)DayOfWeek.Monday - (int)DateTime.UtcNow.DayOfWeek + 7) % 7;
        if (daysUntilMonday == 0)
        {
            daysUntilMonday = 7;
        }

        return DateOnly.FromDateTime(DateTime.UtcNow.Date.AddDays(daysUntilMonday));
    }
}