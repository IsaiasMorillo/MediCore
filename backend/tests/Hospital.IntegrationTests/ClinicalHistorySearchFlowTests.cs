using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Hospital.IntegrationTests;
using Xunit;

namespace Hospital.IntegrationTests.Features;

[Collection("MediCore")]
public class ClinicalHistorySearchFlowTests(MediCoreApiFactory factory)
{
    [Fact]
    public async Task SearchClinicalHistory_ByNameDocumentAndId_ReturnsFullClinicalPicture()
    {
        var client = factory.CreateClient();
        var adminToken = await GetTokenAsync(client, "admin@medicore.do", "Admin123!");
        client.DefaultRequestHeaders.Authorization = With(adminToken);

        var medicoEmail = $"medico_{Guid.NewGuid():N}@medicore.do";
        await RegisterUserAsync(client, medicoEmail, "Medico");

        var documentId = $"DOC-{Guid.NewGuid():N}".ToUpper();
        var createPatient = await client.PostAsJsonAsync("/api/patients", new
        {
            firstName = "Quirina",
            lastName = "Ventura",
            documentId,
            gender = "Femenino",
            contacts = new[] { new { type = "Phone", value = "809-555-7777" } },
            clinicalHistory = new
            {
                allergies = new[] { "Penicilina" },
                chronicDiseases = new[] { "Hipertensión" },
                currentMedications = new[] { "Losartán 50 mg" }
            }
        });
        createPatient.StatusCode.Should().Be(HttpStatusCode.Created);
        var patientId = (await createPatient.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString()!;

        var doctorId = await CreateDoctorAsync(client);

        client.DefaultRequestHeaders.Authorization = With(await GetTokenAsync(client, medicoEmail, "ClaveSegura123"));

        var createRecord = await client.PostAsJsonAsync("/api/medical-records", new
        {
            patientId,
            doctorId,
            vitalSigns = new { bloodPressure = "130/85", heartRate = 80, temperature = 36.9, weightKg = 70.2 },
            diagnosis = "Hipertensión arterial controlada",
            observations = "Control trimestral sin novedades",
            treatmentPlan = "Continuar Losartán 50 mg"
        });
        createRecord.StatusCode.Should().Be(HttpStatusCode.Created);
        var recordId = (await createRecord.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString()!;

        // Búsqueda por nombre
        var byName = await client.GetFromJsonAsync<JsonElement>("/api/medical-records/search?term=Quirina");
        var matchByName = FindPatient(byName, documentId);
        matchByName.Should().NotBeNull();
        var match = matchByName!.Value;
        match.GetProperty("patientName").GetString().Should().Be("Quirina Ventura");
        match.GetProperty("clinicalHistory").GetProperty("allergies").EnumerateArray()
            .Should().Contain(a => a.GetString() == "Penicilina");
        var records = match.GetProperty("medicalRecords").EnumerateArray().ToList();
        records.Should().Contain(r => r.GetProperty("id").GetString() == recordId);
        records.First(r => r.GetProperty("id").GetString() == recordId)
            .GetProperty("diagnosis").GetString().Should().Be("Hipertensión arterial controlada");

        // Búsqueda por documento
        var byDocument = await client.GetFromJsonAsync<JsonElement>(
            $"/api/medical-records/search?term={Uri.EscapeDataString(documentId)}");
        byDocument.EnumerateArray().Should().Contain(p => p.GetProperty("patientId").GetString() == patientId);

        // Búsqueda por ID de paciente
        var byId = await client.GetFromJsonAsync<JsonElement>($"/api/medical-records/search?term={patientId}");
        byId.EnumerateArray().Should().ContainSingle(p => p.GetProperty("patientId").GetString() == patientId);

        // Sin coincidencias
        var noMatch = await client.GetFromJsonAsync<JsonElement>("/api/medical-records/search?term=zzz_no_existe");
        noMatch.EnumerateArray().Should().BeEmpty();

        // Término vacío → 400
        var emptyTerm = await client.GetAsync("/api/medical-records/search?term=");
        emptyTerm.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    private static JsonElement? FindPatient(JsonElement response, string documentId)
    {
        foreach (var patient in response.EnumerateArray())
        {
            if (patient.GetProperty("documentId").GetString() == documentId)
            {
                return patient;
            }
        }

        return null;
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

    private static async Task<string> CreateDoctorAsync(HttpClient client)
    {
        var createDoctor = await client.PostAsJsonAsync("/api/doctors", new
        {
            firstName = "Dra.",
            lastName = "Quirós",
            specialty = "Cardiología",
            licenseNumber = $"LIC-{Guid.NewGuid():N}".ToUpperInvariant(),
            experienceYears = 10,
            office = "Consultorio 401",
            schedule = new[] { new { day = (int)DayOfWeek.Monday, startTime = "08:00", endTime = "11:00" } }
        });
        createDoctor.StatusCode.Should().Be(HttpStatusCode.Created);
        return (await createDoctor.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString()!;
    }
}