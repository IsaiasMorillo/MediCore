using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Hospital.IntegrationTests;
using Xunit;

namespace Hospital.IntegrationTests.Features;

[Collection("MediCore")]
public class BillingFlowTests(MediCoreApiFactory factory)
{
    [Fact]
    public async Task Invoice_CreatePayCancel_EndToEnd()
    {
        var client = factory.CreateClient();

        var adminToken = await GetTokenAsync(client, "admin@medicore.do", "Admin123!");
        client.DefaultRequestHeaders.Authorization = With(adminToken);

        var recepcionEmail = $"recepcion_{Guid.NewGuid():N}@medicore.do";
        await RegisterUserAsync(client, recepcionEmail, "Recepcion");

        var patientId = await CreatePatientAsync(client, coverageType: "Premium");
        var doctorId = await CreateDoctorAsync(client);
        var appointmentId = await CreateAppointmentAsync(client, patientId, doctorId);

        client.DefaultRequestHeaders.Authorization = With(await GetTokenAsync(client, recepcionEmail, "ClaveSegura123"));

        var createInvoice = await client.PostAsJsonAsync("/api/invoices", new
        {
            patientId,
            createdBy = "Recepcion Turno A",
            items = new[]
            {
                new { type = "Consulta", description = "Consulta Medicina Interna", quantity = 1, unitPrice = 1500m, appointmentId = (string?)appointmentId },
                new { type = "Examen", description = "Hemograma completo", quantity = 1, unitPrice = 2500m, appointmentId = (string?)null },
                new { type = "Medicamento", description = "Metformina 850 mg", quantity = 2, unitPrice = 500m, appointmentId = (string?)null }
            }
        });
        createInvoice.StatusCode.Should().Be(HttpStatusCode.Created);
        var invoiceBody = await createInvoice.Content.ReadFromJsonAsync<JsonElement>();
        invoiceBody.GetProperty("number").GetString().Should().StartWith("FAC-");
        invoiceBody.GetProperty("subtotal").GetDecimal().Should().Be(5000m);
        invoiceBody.GetProperty("insuranceCoverage").GetDecimal().Should().Be(3600m);
        invoiceBody.GetProperty("taxes").GetDecimal().Should().Be(252.00m);
        invoiceBody.GetProperty("total").GetDecimal().Should().Be(1652.00m);
        invoiceBody.GetProperty("coverageType").GetString().Should().Be("Premium");
        invoiceBody.GetProperty("status").GetString().Should().Be("Pendiente");
        var invoiceId = invoiceBody.GetProperty("id").GetString()!;

        var pay = await client.PostAsJsonAsync($"/api/invoices/{invoiceId}/pay",
            new { method = "EFTPOS", amount = 1652.00m, paidBy = "Recepcion Turno A" });
        pay.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var getInvoice = await client.GetAsync($"/api/invoices/{invoiceId}");
        getInvoice.StatusCode.Should().Be(HttpStatusCode.OK);
        var paidBody = await getInvoice.Content.ReadFromJsonAsync<JsonElement>();
        paidBody.GetProperty("status").GetString().Should().Be("Pagada");
        paidBody.GetProperty("paidAmount").GetDecimal().Should().Be(1652.00m);
        paidBody.GetProperty("balance").GetDecimal().Should().Be(0m);

        var secondPay = await client.PostAsJsonAsync($"/api/invoices/{invoiceId}/pay",
            new { method = "Efectivo", amount = 10m });
        secondPay.StatusCode.Should().Be(HttpStatusCode.Conflict);

        var patientInvoices = await client.GetAsync($"/api/invoices/patient/{patientId}");
        patientInvoices.StatusCode.Should().Be(HttpStatusCode.OK);
        var invoicesJson = await patientInvoices.Content.ReadFromJsonAsync<JsonElement>();
        invoicesJson.EnumerateArray().Should().Contain(i => i.GetProperty("id").GetString() == invoiceId);
    }

    [Fact]
    public async Task Invoice_WithoutInsurance_CancelledCanNotBePaid()
    {
        var client = factory.CreateClient();
        var adminToken = await GetTokenAsync(client, "admin@medicore.do", "Admin123!");
        client.DefaultRequestHeaders.Authorization = With(adminToken);

        var recepcionEmail = $"recepcion_{Guid.NewGuid():N}@medicore.do";
        await RegisterUserAsync(client, recepcionEmail, "Recepcion");

        var patientId = await CreatePatientAsync(client, coverageType: null);

        client.DefaultRequestHeaders.Authorization = With(await GetTokenAsync(client, recepcionEmail, "ClaveSegura123"));

        var createInvoice = await client.PostAsJsonAsync("/api/invoices", new
        {
            patientId,
            createdBy = "Recepcion Turno A",
            items = new[]
            {
                new { type = "Consulta", description = "Consulta general", quantity = 1, unitPrice = 1000m }
            }
        });
        createInvoice.StatusCode.Should().Be(HttpStatusCode.Created);
        var invoiceBody = await createInvoice.Content.ReadFromJsonAsync<JsonElement>();
        invoiceBody.GetProperty("coverageType").GetString().Should().Be("SinSeguro");
        invoiceBody.GetProperty("insuranceCoverage").GetDecimal().Should().Be(0m);
        invoiceBody.GetProperty("taxes").GetDecimal().Should().Be(180.00m);
        invoiceBody.GetProperty("total").GetDecimal().Should().Be(1180.00m);
        var invoiceId = invoiceBody.GetProperty("id").GetString()!;

        var cancel = await client.PostAsJsonAsync($"/api/invoices/{invoiceId}/cancel", new { reason = "Cancelación por solicitud" });
        cancel.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var payAfterCancel = await client.PostAsJsonAsync($"/api/invoices/{invoiceId}/pay",
            new { method = "Efectivo", amount = 1180m });
        payAfterCancel.StatusCode.Should().Be(HttpStatusCode.Conflict);

        var cancelAgain = await client.PostAsJsonAsync($"/api/invoices/{invoiceId}/cancel", new { });
        cancelAgain.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Invoice_WithUnknownPatient_ReturnsNotFound()
    {
        var client = factory.CreateClient();
        var adminToken = await GetTokenAsync(client, "admin@medicore.do", "Admin123!");
        client.DefaultRequestHeaders.Authorization = With(adminToken);

        var createInvoice = await client.PostAsJsonAsync("/api/invoices", new
        {
            patientId = "inexistente",
            createdBy = "admin",
            items = new[] { new { type = "Consulta", description = "Consulta", quantity = 1, unitPrice = 100m } }
        });

        createInvoice.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task PayInvoice_WithOverpayment_ReturnsConflict()
    {
        var client = factory.CreateClient();
        var adminToken = await GetTokenAsync(client, "admin@medicore.do", "Admin123!");
        client.DefaultRequestHeaders.Authorization = With(adminToken);

        var patientId = await CreatePatientAsync(client, coverageType: null);
        var createInvoice = await client.PostAsJsonAsync("/api/invoices", new
        {
            patientId,
            createdBy = "admin",
            items = new[] { new { type = "Consulta", description = "Consulta", quantity = 1, unitPrice = 100m } }
        });
        createInvoice.StatusCode.Should().Be(HttpStatusCode.Created);
        var invoiceId = (await createInvoice.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString()!;

        var pay = await client.PostAsJsonAsync($"/api/invoices/{invoiceId}/pay",
            new { method = "Efectivo", amount = 9999m });

        pay.StatusCode.Should().Be(HttpStatusCode.Conflict);
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

    private static async Task<string> CreatePatientAsync(HttpClient client, string? coverageType)
    {
        var medicalInsurance = coverageType is null
            ? null
            : new { provider = "ARS Humano", policyNumber = $"POL-{Guid.NewGuid():N}", coverageType };

        var createPatient = await client.PostAsJsonAsync("/api/patients", new
        {
            firstName = "Lucía",
            lastName = "Rodríguez",
            documentId = $"DOC-{Guid.NewGuid():N}".ToUpper(),
            gender = "Femenino",
            contacts = new[] { new { type = "Phone", value = "809-555-1111" } },
            medicalInsurance
        });
        createPatient.StatusCode.Should().Be(HttpStatusCode.Created);
        return (await createPatient.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString()!;
    }

    private static async Task<string> CreateDoctorAsync(HttpClient client)
    {
        var createDoctor = await client.PostAsJsonAsync("/api/doctors", new
        {
            firstName = "Dr.",
            lastName = "Bermúdez",
            specialty = "Medicina Interna",
            licenseNumber = $"LIC-{Guid.NewGuid():N}".ToUpperInvariant(),
            experienceYears = 15,
            office = "Consultorio 204",
            schedule = new[] { new { day = (int)DayOfWeek.Monday, startTime = "08:00", endTime = "11:00" } }
        });
        createDoctor.StatusCode.Should().Be(HttpStatusCode.Created);
        return (await createDoctor.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString()!;
    }

    private static async Task<string> CreateAppointmentAsync(HttpClient client, string patientId, string doctorId)
    {
        var start = NextMondayMorning();
        var createAppointment = await client.PostAsJsonAsync("/api/appointments", new
        {
            patientId,
            doctorId,
            startDateTime = start,
            durationMinutes = 30,
            notes = "Consulta de control"
        });
        createAppointment.StatusCode.Should().Be(HttpStatusCode.Created);
        return (await createAppointment.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString()!;
    }

    private static DateTime NextMondayMorning()
    {
        var daysUntilMonday = ((int)DayOfWeek.Monday - (int)DateTime.UtcNow.DayOfWeek + 7) % 7;
        if (daysUntilMonday == 0)
        {
            daysUntilMonday = 7;
        }

        return DateTime.UtcNow.Date.AddDays(daysUntilMonday).AddHours(9);
    }
}