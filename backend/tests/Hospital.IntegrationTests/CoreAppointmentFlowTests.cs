using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Hospital.Domain.Entities;
using Hospital.IntegrationTests;
using MongoDB.Driver;
using Xunit;

namespace Hospital.IntegrationTests.Features;

[Collection("MediCore")]
public class CoreAppointmentFlowTests(MediCoreApiFactory factory)
{
    private static DateOnly NextMonday()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var days = ((int)DayOfWeek.Monday - (int)today.DayOfWeek + 7) % 7;
        return today.AddDays(days == 0 ? 7 : days);
    }

    [Fact]
    public async Task Patient_Doctor_Appointment_Lifecycle_EndToEnd()
    {
        var client = factory.CreateClient();
        var token = await GetAsAdminAsync(client);
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var appointmentDate = NextMonday();

        var createPatient = await client.PostAsJsonAsync("/api/patients", new
        {
            firstName = "Carlos",
            lastName = "Rodríguez",
            documentId = $"DOC-{Guid.NewGuid():N}".ToUpper(),
            gender = "Masculino",
            contacts = new[] { new { type = "Phone", value = "809-555-1111" } }
        });
        createPatient.StatusCode.Should().Be(HttpStatusCode.Created);
        var patientId = (await createPatient.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString();

        var createDoctor = await client.PostAsJsonAsync("/api/doctors", new
        {
            firstName = "Dra.",
            lastName = "Laura",
            specialty = "Cardiología",
            licenseNumber = $"LIC-{Guid.NewGuid():N}".ToUpperInvariant(),
            experienceYears = 8,
            office = "Consultorio 204",
            schedule = new[]
            {
                new { day = (int)DayOfWeek.Monday, startTime = "09:00", endTime = "12:00" }
            }
        });
        createDoctor.StatusCode.Should().Be(HttpStatusCode.Created);
        var doctorId = (await createDoctor.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString();

        var availability = await client.GetStringAsync($"/api/appointments/availability/{doctorId}?date={appointmentDate:yyyy-MM-dd}");
        var availabilityJson = JsonDocument.Parse(availability).RootElement;
        var freeSlots = availabilityJson.GetProperty("freeSlots").EnumerateArray()
            .Select(e => e.GetDateTime()).ToList();
        freeSlots.Should().HaveCount(6);

        var firstSlot = freeSlots[0];
        var createAppointment = await client.PostAsJsonAsync("/api/appointments", new
        {
            patientId,
            doctorId,
            startDateTime = firstSlot,
            durationMinutes = 30,
            notes = "Consulta inicial"
        });
        createAppointment.StatusCode.Should().Be(HttpStatusCode.Created);
        var appointmentId = (await createAppointment.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString();

        var overlappingStart = firstSlot.AddMinutes(15);
        var conflict = await client.PostAsJsonAsync("/api/appointments", new
        {
            patientId,
            doctorId,
            startDateTime = overlappingStart,
            durationMinutes = 30,
            notes = "Conflicto"
        });
        conflict.StatusCode.Should().Be(HttpStatusCode.Conflict);

        var reschedule = await client.PutAsJsonAsync($"/api/appointments/{appointmentId}/reschedule",
            new { newStartDateTime = freeSlots[3] });
        reschedule.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var confirm = await client.PostAsync($"/api/appointments/{appointmentId}/confirm", null);
        confirm.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var cancel = await client.PostAsync($"/api/appointments/{appointmentId}/cancel", null);
        cancel.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var getAppointment = await client.GetAsync($"/api/appointments/{appointmentId}");
        getAppointment.StatusCode.Should().Be(HttpStatusCode.OK);
        var appointmentBody = await getAppointment.Content.ReadFromJsonAsync<JsonElement>();
        appointmentBody.GetProperty("status").GetString().Should().Be("Cancelled");

        var patientSearch = await client.GetStringAsync("/api/patients?search=Carlos");
        var searchResult = JsonDocument.Parse(patientSearch).RootElement;
        searchResult.EnumerateArray().Select(p => p.GetProperty("id").GetString()).Should().Contain(patientId);

        var stored = await factory.Database.GetCollection<Appointment>("Appointments")
            .Find(a => a.Id == appointmentId).FirstOrDefaultAsync();
        stored.Should().NotBeNull();
        stored!.Status.Should().Be(Hospital.Domain.Enums.AppointmentStatus.Cancelled);
    }

    private static async Task<string> GetAsAdminAsync(HttpClient client)
    {
        var login = await client.PostAsJsonAsync("/api/auth/login", new { email = "admin@medicore.do", password = "Admin123!" });
        var body = await login.Content.ReadFromJsonAsync<JsonElement>();
        return body.GetProperty("token").GetString()!;
    }
}