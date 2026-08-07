using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Hospital.IntegrationTests;
using Xunit;

namespace Hospital.IntegrationTests.Features;

[Collection("MediCore")]
public class ReportsFlowTests(MediCoreApiFactory factory)
{
    [Fact]
    public async Task Reports_AggregationPipelines_ReturnExpectedRows()
    {
        var client = factory.CreateClient();
        var adminToken = await GetTokenAsync(client, "admin@medicore.do", "Admin123!");
        client.DefaultRequestHeaders.Authorization = With(adminToken);

        var medicoEmail = $"medico_{Guid.NewGuid():N}@medicore.do";
        var farmaciaEmail = $"farmacia_{Guid.NewGuid():N}@medicore.do";
        var laboratorioEmail = $"lab_{Guid.NewGuid():N}@medicore.do";
        await RegisterUserAsync(client, medicoEmail, "Medico");
        await RegisterUserAsync(client, farmaciaEmail, "Farmacia");
        await RegisterUserAsync(client, laboratorioEmail, "Laboratorio");

        var patient1Id = await CreatePatientAsync(client, "Ana");
        var patient2Id = await CreatePatientAsync(client, "Bruno");
        var doctorId = await CreateDoctorAsync(client);

        await CreateAppointmentAsync(client, patient1Id, doctorId, 8);
        await CreateAppointmentAsync(client, patient1Id, doctorId, 8, 30);
        await CreateAppointmentAsync(client, patient2Id, doctorId, 9);

        client.DefaultRequestHeaders.Authorization = With(await GetTokenAsync(client, medicoEmail, "ClaveSegura123"));

        await CreateLabOrderAsync(client, patient1Id, doctorId, "Hemograma");
        await CreateLabOrderAsync(client, patient2Id, doctorId, "Orina");

        client.DefaultRequestHeaders.Authorization = With(adminToken);

        var medicationId = await CreateMedicationAsync(client, name: "Losartán 50 mg", stock: 50, reorder: 10);
        var lowStockMedicationId = await CreateMedicationAsync(client, name: "Amlodipina 5 mg", stock: 3, reorder: 10);
        var dispensedMedicationName = "Losartán 50 mg";

        client.DefaultRequestHeaders.Authorization = With(await GetTokenAsync(client, medicoEmail, "ClaveSegura123"));

        var createPrescription = await client.PostAsJsonAsync("/api/pharmacy/prescriptions", new
        {
            patientId = patient1Id,
            doctorId,
            medicationId,
            dosage = "1 tableta",
            frequency = "Diaria",
            quantity = 30,
            instructions = "Tomar en ayunas"
        });
        createPrescription.StatusCode.Should().Be(HttpStatusCode.Created);
        var prescriptionId = (await createPrescription.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString()!;

        var createLowStockPrescription = await client.PostAsJsonAsync("/api/pharmacy/prescriptions", new
        {
            patientId = patient2Id,
            doctorId,
            medicationId = lowStockMedicationId,
            dosage = "1 tableta",
            frequency = "Cada 12 horas",
            quantity = 10
        });
        createLowStockPrescription.StatusCode.Should().Be(HttpStatusCode.Created);

        client.DefaultRequestHeaders.Authorization = With(await GetTokenAsync(client, farmaciaEmail, "ClaveSegura123"));
        var dispense = await client.PostAsJsonAsync($"/api/pharmacy/prescriptions/{prescriptionId}/dispense",
            new { dispensedBy = "Farmacéutico Turno A" });
        dispense.StatusCode.Should().Be(HttpStatusCode.NoContent);

        // Invoice pagada para el reporte de facturación
        client.DefaultRequestHeaders.Authorization = With(adminToken);
        var createInvoice = await client.PostAsJsonAsync("/api/invoices", new
        {
            patientId = patient1Id,
            createdBy = "admin",
            items = new[] { new { type = "Consulta", description = "Consulta", quantity = 1, unitPrice = 3000m } }
        });
        createInvoice.StatusCode.Should().Be(HttpStatusCode.Created);
        var invoiceId = (await createInvoice.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString()!;
        var pay = await client.PostAsJsonAsync($"/api/invoices/{invoiceId}/pay",
            new { method = "Transferencia", amount = 3540m });
        pay.StatusCode.Should().Be(HttpStatusCode.NoContent);

        // ---- Reportes ----

        var summary = await client.GetFromJsonAsync<JsonElement>("/api/reports/invoices-summary");
        var summaryRow = summary.EnumerateArray()
            .First(r => r.GetProperty("year").GetInt32() == DateTime.UtcNow.Year
                        && r.GetProperty("month").GetInt32() == DateTime.UtcNow.Month);
        summaryRow.GetProperty("invoiceCount").GetInt32().Should().BeGreaterThanOrEqualTo(1);
        summaryRow.GetProperty("totalInvoiced").GetDecimal().Should().BeGreaterThanOrEqualTo(3540m);

        client.DefaultRequestHeaders.Authorization = With(await GetTokenAsync(client, farmaciaEmail, "ClaveSegura123"));

        var lowStock = await client.GetFromJsonAsync<JsonElement>("/api/reports/low-stock");
        lowStock.EnumerateArray()
            .Should().Contain(m => m.GetProperty("medicationName").GetString() == "Amlodipina 5 mg");

        var dispensed = await client.GetFromJsonAsync<JsonElement>("/api/reports/medications-dispensed");
        dispensed.EnumerateArray()
            .Should().Contain(m => m.GetProperty("medicationName").GetString() == dispensedMedicationName);

        client.DefaultRequestHeaders.Authorization = With(await GetTokenAsync(client, laboratorioEmail, "ClaveSegura123"));
        var labReport = await client.GetFromJsonAsync<JsonElement>("/api/reports/laboratory-most-requested");
        var labRows = labReport.EnumerateArray().ToList();
        labRows.Should().Contain(r =>
            r.GetProperty("label").GetString() == "Hemograma" && r.GetProperty("count").GetInt32() >= 1);
        labRows.Should().Contain(r =>
            r.GetProperty("label").GetString() == "Orina" && r.GetProperty("count").GetInt32() >= 1);

        client.DefaultRequestHeaders.Authorization = With(adminToken);
        var frequent = await client.GetFromJsonAsync<JsonElement>("/api/reports/patients-most-frequent");
        frequent.EnumerateArray().First()
            .GetProperty("count").GetInt32().Should().BeGreaterThanOrEqualTo(2);
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

    private static async Task<string> CreatePatientAsync(HttpClient client, string name)
    {
        var createPatient = await client.PostAsJsonAsync("/api/patients", new
        {
            firstName = name,
            lastName = "Paciente",
            documentId = $"DOC-{Guid.NewGuid():N}".ToUpper(),
            gender = "Masculino",
            contacts = new[] { new { type = "Phone", value = "809-555-4444" } }
        });
        createPatient.StatusCode.Should().Be(HttpStatusCode.Created);
        return (await createPatient.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString()!;
    }

    private static async Task<string> CreateDoctorAsync(HttpClient client)
    {
        var createDoctor = await client.PostAsJsonAsync("/api/doctors", new
        {
            firstName = "Dra.",
            lastName = "Núñez",
            specialty = "Cardiología",
            licenseNumber = $"LIC-{Guid.NewGuid():N}".ToUpperInvariant(),
            experienceYears = 8,
            office = "Consultorio 105",
            schedule = new[] { new { day = (int)DayOfWeek.Monday, startTime = "08:00", endTime = "11:00" } }
        });
        createDoctor.StatusCode.Should().Be(HttpStatusCode.Created);
        return (await createDoctor.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString()!;
    }

    private static async Task CreateAppointmentAsync(HttpClient client, string patientId, string doctorId, int hour, int minute = 0)
    {
        var monday = NextMondayMorning().Date;
        var start = new DateTime(monday.Year, monday.Month, monday.Day, hour, minute, 0);
        var createAppointment = await client.PostAsJsonAsync("/api/appointments", new
        {
            patientId,
            doctorId,
            startDateTime = start,
            durationMinutes = 30,
            notes = "Consulta"
        });
        createAppointment.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    private static async Task CreateLabOrderAsync(HttpClient client, string patientId, string doctorId, string testType)
    {
        var order = await client.PostAsJsonAsync("/api/laboratory/orders", new
        {
            patientId,
            doctorId,
            testType
        });
        order.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    private static async Task<string> CreateMedicationAsync(HttpClient client, string name, int stock, int reorder)
    {
        var createMedication = await client.PostAsJsonAsync("/api/pharmacy/medications", new
        {
            name,
            code = $"MK-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}",
            category = "Cardiología",
            stockQuantity = stock,
            price = 300.00m,
            reorderLevel = reorder
        });
        createMedication.StatusCode.Should().Be(HttpStatusCode.Created);
        return (await createMedication.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString()!;
    }

    private static DateTime NextMondayMorning()
    {
        var daysUntilMonday = ((int)DayOfWeek.Monday - (int)DateTime.UtcNow.DayOfWeek + 7) % 7;
        if (daysUntilMonday == 0)
        {
            daysUntilMonday = 7;
        }

        return DateTime.UtcNow.Date.AddDays(daysUntilMonday);
    }
}