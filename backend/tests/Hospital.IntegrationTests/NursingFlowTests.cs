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
public class NursingFlowTests(MediCoreApiFactory factory)
{
    [Fact]
    public async Task Nurse_RegistersVitals_And_DoctorAndNurseCanReadThem()
    {
        var client = factory.CreateClient();
        var adminToken = await GetTokenAsync(client, "admin@medicore.do", "Admin123!");
        client.DefaultRequestHeaders.Authorization = With(adminToken);

        var enfermeraEmail = $"enfermera_{Guid.NewGuid():N}@medicore.do";
        var medicoEmail = $"medico_{Guid.NewGuid():N}@medicore.do";
        await RegisterUserAsync(client, enfermeraEmail, "Enfermero");
        await RegisterUserAsync(client, medicoEmail, "Medico");

        var patientId = await CreatePatientAsync(client);
        var nurseToken = await GetTokenAsync(client, enfermeraEmail, "ClaveSegura123");
        var nurseUserId = await GetUserIdAsync(factory, enfermeraEmail);

        client.DefaultRequestHeaders.Authorization = With(nurseToken);

        var createVitals = await client.PostAsJsonAsync("/api/nursing/vitals", new
        {
            patientId,
            vitalSigns = new { bloodPressure = "120/80", heartRate = 76, temperature = 36.7, weightKg = 68.0 },
            notes = "Paciente consciente y orientado"
        });
        createVitals.StatusCode.Should().Be(HttpStatusCode.Created);
        var vitalsId = (await createVitals.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString();
        vitalsId.Should().NotBeNullOrWhiteSpace();

        var stored = await factory.Database.GetCollection<VitalsRecord>("VitalsRecords")
            .Find(v => v.Id == vitalsId).FirstOrDefaultAsync();
        stored.Should().NotBeNull();
        stored!.RecordedBy.Should().Be(nurseUserId);
        stored.RecordedAt.Should().NotBe(default);
        stored.VitalSigns.BloodPressure.Should().Be("120/80");

        var getByNurse = await client.GetAsync($"/api/nursing/vitals/patient/{patientId}");
        getByNurse.StatusCode.Should().Be(HttpStatusCode.OK);
        var nurseBody = JsonDocument.Parse(await getByNurse.Content.ReadAsStringAsync()).RootElement;
        nurseBody.EnumerateArray().Should().HaveCount(1);
        nurseBody.EnumerateArray().First().GetProperty("id").GetString().Should().Be(vitalsId);

        client.DefaultRequestHeaders.Authorization = With(await GetTokenAsync(client, medicoEmail, "ClaveSegura123"));
        var getByDoctor = await client.GetAsync($"/api/nursing/vitals/patient/{patientId}");
        getByDoctor.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task CreateVitals_WithInvalidData_ReturnsBadRequest()
    {
        var client = factory.CreateClient();
        var adminToken = await GetTokenAsync(client, "admin@medicore.do", "Admin123!");
        client.DefaultRequestHeaders.Authorization = With(adminToken);

        var enfermeraEmail = $"enfermera_{Guid.NewGuid():N}@medicore.do";
        await RegisterUserAsync(client, enfermeraEmail, "Enfermero");
        var patientId = await CreatePatientAsync(client);

        client.DefaultRequestHeaders.Authorization = With(await GetTokenAsync(client, enfermeraEmail, "ClaveSegura123"));

        var emptyVitals = await client.PostAsJsonAsync("/api/nursing/vitals", new
        {
            patientId,
            vitalSigns = new { },
            notes = ""
        });
        emptyVitals.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var unknownPatient = await client.PostAsJsonAsync("/api/nursing/vitals", new
        {
            patientId = "inexistente",
            vitalSigns = new { bloodPressure = "120/80" }
        });
        unknownPatient.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task CreateVitals_ByNonNurseRole_ReturnsForbidden()
    {
        var client = factory.CreateClient();
        var adminToken = await GetTokenAsync(client, "admin@medicore.do", "Admin123!");
        client.DefaultRequestHeaders.Authorization = With(adminToken);

        var recepcionEmail = $"recepcion_{Guid.NewGuid():N}@medicore.do";
        await RegisterUserAsync(client, recepcionEmail, "Recepcion");
        var patientId = await CreatePatientAsync(client);

        client.DefaultRequestHeaders.Authorization = With(await GetTokenAsync(client, recepcionEmail, "ClaveSegura123"));

        var createVitals = await client.PostAsJsonAsync("/api/nursing/vitals", new
        {
            patientId,
            vitalSigns = new { bloodPressure = "130/85" }
        });

        createVitals.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    private static async Task<string> GetUserIdAsync(MediCoreApiFactory f, string email)
    {
        var user = await f.Database.GetCollection<User>("Users")
            .Find(u => u.Email == email).FirstOrDefaultAsync();
        return user!.Id;
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
            firstName = "Lucía",
            lastName = "Morillo",
            documentId = $"DOC-{Guid.NewGuid():N}".ToUpper(),
            gender = "Femenino",
            contacts = new[] { new { type = "Phone", value = "809-555-7777" } }
        });
        createPatient.StatusCode.Should().Be(HttpStatusCode.Created);
        return (await createPatient.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString()!;
    }
}