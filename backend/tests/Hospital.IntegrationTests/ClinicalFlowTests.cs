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
public class ClinicalFlowTests(MediCoreApiFactory factory)
{
    [Fact]
    public async Task MedicalRecord_LabOrder_Prescription_Dispense_EndToEnd()
    {
        var client = factory.CreateClient();

        var adminToken = await GetTokenAsync(client, "admin@medicore.do", "Admin123!");
        client.DefaultRequestHeaders.Authorization = With(adminToken);

        var medicoEmail = $"medico_{Guid.NewGuid():N}@medicore.do";
        var labEmail = $"lab_{Guid.NewGuid():N}@medicore.do";
        var farmEmail = $"farma_{Guid.NewGuid():N}@medicore.do";
        await RegisterUserAsync(client, medicoEmail, "Medico");
        await RegisterUserAsync(client, labEmail, "Laboratorio");
        await RegisterUserAsync(client, farmEmail, "Farmacia");

        var createPatient = await client.PostAsJsonAsync("/api/patients", new
        {
            firstName = "María",
            lastName = "Fernández",
            documentId = $"DOC-{Guid.NewGuid():N}".ToUpper(),
            gender = "Femenino",
            contacts = new[] { new { type = "Phone", value = "829-555-2222" } }
        });
        createPatient.StatusCode.Should().Be(HttpStatusCode.Created);
        var patientId = (await createPatient.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString();

        var createDoctor = await client.PostAsJsonAsync("/api/doctors", new
        {
            firstName = "Dr.",
            lastName = "Roberto",
            specialty = "Medicina Interna",
            licenseNumber = $"LIC-{Guid.NewGuid():N}".ToUpperInvariant(),
            experienceYears = 12,
            office = "Consultorio 301",
            schedule = new[]
            {
                new { day = (int)DayOfWeek.Monday, startTime = "08:00", endTime = "11:00" }
            }
        });
        createDoctor.StatusCode.Should().Be(HttpStatusCode.Created);
        var doctorId = (await createDoctor.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString();

        var medicoToken = await GetTokenAsync(client, medicoEmail, "ClaveSegura123");
        client.DefaultRequestHeaders.Authorization = With(medicoToken);

        var createRecord = await client.PostAsJsonAsync("/api/medical-records", new
        {
            patientId,
            doctorId,
            vitalSigns = new { bloodPressure = "110/70", heartRate = 78, temperature = 36.8, weightKg = 65.5 },
            diagnosis = "Diabetes tipo 2",
            observations = "Control trimestral",
            treatmentPlan = "Metformina 850 mg"
        });
        createRecord.StatusCode.Should().Be(HttpStatusCode.Created);
        var recordId = (await createRecord.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString();

        var duplicateRecord = await client.PostAsJsonAsync("/api/medical-records", new
        {
            patientId,
            doctorId,
            appointmentId = "x",
            diagnosis = "Diabetes tipo 2",
            treatmentPlan = "Metformina"
        });
        duplicateRecord.StatusCode.Should().Be(HttpStatusCode.Created);

        var createLabOrder = await client.PostAsJsonAsync("/api/laboratory/orders", new
        {
            patientId,
            doctorId,
            medicalRecordId = recordId,
            testType = "Hemograma"
        });
        createLabOrder.StatusCode.Should().Be(HttpStatusCode.Created);
        var labOrderId = (await createLabOrder.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString();

        client.DefaultRequestHeaders.Authorization = With(await GetTokenAsync(client, labEmail, "ClaveSegura123"));

        var loadResults = await client.PostAsJsonAsync($"/api/laboratory/orders/{labOrderId}/results",
            new Dictionary<string, object?>
            {
                ["hemoglobina"] = 13.8,
                ["hematocrito"] = 41,
                ["leucocitos"] = 7200,
                ["plaquetas"] = 250000
            });
        loadResults.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var getOrder = await client.GetAsync($"/api/laboratory/orders/{labOrderId}");
        getOrder.StatusCode.Should().Be(HttpStatusCode.OK);
        var orderBody = await getOrder.Content.ReadFromJsonAsync<JsonElement>();
        orderBody.GetProperty("status").GetString().Should().Be("ResultadoCargado");
        orderBody.GetProperty("results").GetProperty("hemoglobina").GetDouble().Should().Be(13.8);

        var secondLoad = await client.PostAsJsonAsync($"/api/laboratory/orders/{labOrderId}/results",
            new Dictionary<string, object?> { ["hemoglobina"] = 14 });
        secondLoad.StatusCode.Should().Be(HttpStatusCode.Conflict);

        client.DefaultRequestHeaders.Authorization = With(adminToken);

        var createMedication = await client.PostAsJsonAsync("/api/pharmacy/medications", new
        {
            name = "Metformina 850 mg",
            code = $"MET-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}",
            category = "Antidiabéticos",
            stockQuantity = 50,
            price = 120.50m,
            reorderLevel = 10
        });
        createMedication.StatusCode.Should().Be(HttpStatusCode.Created);
        var medicationId = (await createMedication.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString();

        client.DefaultRequestHeaders.Authorization = With(medicoToken);

        var createPrescription = await client.PostAsJsonAsync("/api/pharmacy/prescriptions", new
        {
            patientId,
            doctorId,
            medicalRecordId = recordId,
            medicationId,
            dosage = "1 tableta",
            frequency = "Cada 12 horas",
            quantity = 30,
            instructions = "Con las comidas"
        });
        createPrescription.StatusCode.Should().Be(HttpStatusCode.Created);
        var prescriptionId = (await createPrescription.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString();

        client.DefaultRequestHeaders.Authorization = With(await GetTokenAsync(client, farmEmail, "ClaveSegura123"));

        var dispense = await client.PostAsJsonAsync($"/api/pharmacy/prescriptions/{prescriptionId}/dispense",
            new { dispensedBy = "Farmacéutico Turno A" });
        dispense.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var secondDispense = await client.PostAsJsonAsync($"/api/pharmacy/prescriptions/{prescriptionId}/dispense",
            new { dispensedBy = "Farmacéutico Turno B" });
        secondDispense.StatusCode.Should().Be(HttpStatusCode.Conflict);

        var patientPrescriptions = await client.GetStringAsync($"/api/pharmacy/prescriptions/patient/{patientId}");
        var prescriptionsJson = JsonDocument.Parse(patientPrescriptions).RootElement;
        var myPrescription = prescriptionsJson.EnumerateArray()
            .First(p => p.GetProperty("id").GetString() == prescriptionId);
        myPrescription.GetProperty("status").GetString().Should().Be("Despachada");
        myPrescription.GetProperty("medicationName").GetString().Should().Be("Metformina 850 mg");

        var storedMedication = await factory.Database.GetCollection<Medication>("Medications")
            .Find(m => m.Id == medicationId).FirstOrDefaultAsync();
        storedMedication.Should().NotBeNull();
        storedMedication!.StockQuantity.Should().Be(20);

        var storedRecord = await factory.Database.GetCollection<MedicalRecord>("MedicalRecords")
            .Find(r => r.Id == recordId).FirstOrDefaultAsync();
        storedRecord.Should().NotBeNull();
        storedRecord!.PrescriptionIds.Should().Contain(prescriptionId);
        storedRecord.IsImmutable.Should().BeTrue();
    }

    [Fact]
    public async Task Dispense_WithInsufficientStock_ReturnsConflict()
    {
        var client = factory.CreateClient();
        var adminToken = await GetTokenAsync(client, "admin@medicore.do", "Admin123!");
        client.DefaultRequestHeaders.Authorization = With(adminToken);

        var medicoEmail = $"medico_{Guid.NewGuid():N}@medicore.do";
        var farmEmail = $"farma_{Guid.NewGuid():N}@medicore.do";
        await RegisterUserAsync(client, medicoEmail, "Medico");
        await RegisterUserAsync(client, farmEmail, "Farmacia");

        var patientId = await CreatePatientAsync(client);
        var doctorId = await CreateDoctorAsync(client);
        var medicationId = await CreateMedicationAsync(client, 5);

        client.DefaultRequestHeaders.Authorization = With(await GetTokenAsync(client, medicoEmail, "ClaveSegura123"));
        var createPrescription = await client.PostAsJsonAsync("/api/pharmacy/prescriptions", new
        {
            patientId,
            doctorId,
            medicationId,
            dosage = "1 tableta",
            frequency = "Diaria",
            quantity = 10
        });
        createPrescription.StatusCode.Should().Be(HttpStatusCode.Created);
        var prescriptionId = (await createPrescription.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString();

        client.DefaultRequestHeaders.Authorization = With(await GetTokenAsync(client, farmEmail, "ClaveSegura123"));
        var dispense = await client.PostAsJsonAsync($"/api/pharmacy/prescriptions/{prescriptionId}/dispense",
            new { dispensedBy = "Farmacéutico Turno A" });

        dispense.StatusCode.Should().Be(HttpStatusCode.Conflict);
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

    private async Task<string> CreatePatientAsync(HttpClient client)
    {
        var createPatient = await client.PostAsJsonAsync("/api/patients", new
        {
            firstName = "Ana",
            lastName = "Pérez",
            documentId = $"DOC-{Guid.NewGuid():N}".ToUpper(),
            gender = "Femenino",
            contacts = new[] { new { type = "Phone", value = "849-555-3333" } }
        });
        createPatient.StatusCode.Should().Be(HttpStatusCode.Created);
        return (await createPatient.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString()!;
    }

    private async Task<string> CreateDoctorAsync(HttpClient client)
    {
        var createDoctor = await client.PostAsJsonAsync("/api/doctors", new
        {
            firstName = "Dr.",
            lastName = "Carlos",
            specialty = "Medicina General",
            licenseNumber = $"LIC-{Guid.NewGuid():N}".ToUpperInvariant(),
            experienceYears = 5,
            office = "Consultorio 101",
            schedule = new[]
            {
                new { day = (int)DayOfWeek.Tuesday, startTime = "09:00", endTime = "12:00" }
            }
        });
        createDoctor.StatusCode.Should().Be(HttpStatusCode.Created);
        return (await createDoctor.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString()!;
    }

    private async Task<string> CreateMedicationAsync(HttpClient client, int stock)
    {
        var createMedication = await client.PostAsJsonAsync("/api/pharmacy/medications", new
        {
            name = "Ibuprofeno 400 mg",
            code = $"IBU-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}",
            category = "Antiinflamatorios",
            stockQuantity = stock,
            price = 85.00m,
            reorderLevel = 5
        });
        createMedication.StatusCode.Should().Be(HttpStatusCode.Created);
        return (await createMedication.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString()!;
    }
}