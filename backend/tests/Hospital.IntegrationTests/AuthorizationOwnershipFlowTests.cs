using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Xunit;

namespace Hospital.IntegrationTests.Features;

[Collection("MediCore")]
public class AuthorizationOwnershipFlowTests(MediCoreApiFactory factory)
{
    [Theory]
    [InlineData("/api/patients")]
    [InlineData("/api/appointments/missing")]
    [InlineData("/api/medical-records/missing")]
    [InlineData("/api/laboratory/orders/missing")]
    [InlineData("/api/pharmacy/medications")]
    [InlineData("/api/invoices/missing")]
    [InlineData("/api/nursing/vitals/patient/missing")]
    [InlineData("/api/reports/invoices-summary")]
    [InlineData("/api/patient-portal/upcoming-appointments")]
    public async Task ProtectedEndpoint_WithoutAuthentication_ReturnsUnauthorized(string path)
    {
        var response = await factory.CreateClient().GetAsync(path);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized, path);
    }

    [Fact]
    public async Task Patient_CannotAccessInternalPatientResourcesByChangingIds()
    {
        var adminClient = factory.CreateClient();
        var adminToken = await LoginAsync(adminClient, "admin@medicore.do", "Admin123!");
        adminClient.DefaultRequestHeaders.Authorization = With(adminToken);

        var ownPatientId = await CreatePatientAsync(adminClient);
        var otherPatientId = await CreatePatientAsync(adminClient);
        await RegisterPortalAccountAsync(adminClient, adminToken, ownPatientId);

        var patientClient = factory.CreateClient();
        var patientToken = await LoginAsync(
            patientClient,
            PortalEmailFor(ownPatientId),
            "ClaveSegura123");
        patientClient.DefaultRequestHeaders.Authorization = With(patientToken);

        var paths = new[]
        {
            $"/api/patients/{otherPatientId}",
            "/api/appointments/missing",
            "/api/medical-records/missing",
            "/api/laboratory/orders/missing",
            $"/api/laboratory/orders/patient/{otherPatientId}",
            "/api/pharmacy/medications",
            $"/api/pharmacy/prescriptions/patient/{otherPatientId}",
            "/api/invoices/missing",
            $"/api/invoices/patient/{otherPatientId}",
            $"/api/nursing/vitals/patient/{otherPatientId}"
        };

        foreach (var path in paths)
        {
            var response = await patientClient.GetAsync(path);
            response.StatusCode.Should().Be(HttpStatusCode.Forbidden, path);
        }
    }

    [Fact]
    public async Task PatientPortal_ReturnsOnlyOwnInvoicesAndLoadedLaboratoryResults()
    {
        var adminClient = factory.CreateClient();
        var adminToken = await LoginAsync(adminClient, "admin@medicore.do", "Admin123!");
        adminClient.DefaultRequestHeaders.Authorization = With(adminToken);

        var patientA = await CreatePatientAsync(adminClient);
        var patientB = await CreatePatientAsync(adminClient);
        await RegisterPortalAccountAsync(adminClient, adminToken, patientA);
        await RegisterPortalAccountAsync(adminClient, adminToken, patientB);

        var doctorId = await CreateDoctorAsync(adminClient);
        var labEmail = $"lab_{Guid.NewGuid():N}@medicore.do";
        await RegisterUserAsync(adminClient, adminToken, labEmail, "Laboratorio");

        var orderA = await CreateLaboratoryOrderAsync(adminClient, patientA, doctorId);
        var orderB = await CreateLaboratoryOrderAsync(adminClient, patientB, doctorId);

        var labClient = factory.CreateClient();
        labClient.DefaultRequestHeaders.Authorization = With(await LoginAsync(
            labClient,
            labEmail,
            "ClaveSegura123"));
        await LoadLaboratoryResultsAsync(labClient, orderA);
        await LoadLaboratoryResultsAsync(labClient, orderB);

        var invoiceA = await CreateInvoiceAsync(adminClient, patientA);
        var invoiceB = await CreateInvoiceAsync(adminClient, patientB);

        var patientClient = factory.CreateClient();
        patientClient.DefaultRequestHeaders.Authorization = With(await LoginAsync(
            patientClient,
            PortalEmailFor(patientA),
            "ClaveSegura123"));

        var invoicesResponse = await patientClient.GetAsync("/api/patient-portal/invoices");
        invoicesResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var invoices = await invoicesResponse.Content.ReadFromJsonAsync<JsonElement>();
        var invoiceIds = invoices.EnumerateArray()
            .Select(invoice => invoice.GetProperty("id").GetString())
            .ToList();
        invoiceIds.Should().Contain(invoiceA);
        invoiceIds.Should().NotContain(invoiceB);

        var resultsResponse = await patientClient.GetAsync("/api/patient-portal/laboratory-results");
        resultsResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var results = await resultsResponse.Content.ReadFromJsonAsync<JsonElement>();
        var orderIds = results.EnumerateArray()
            .Select(order => order.GetProperty("id").GetString())
            .ToList();
        orderIds.Should().Contain(orderA);
        orderIds.Should().NotContain(orderB);
    }

    [Fact]
    public async Task PatientRoleWithoutPatientClaim_CannotAccessPortal()
    {
        var adminClient = factory.CreateClient();
        var adminToken = await LoginAsync(adminClient, "admin@medicore.do", "Admin123!");
        var unlinkedEmail = $"unlinked_{Guid.NewGuid():N}@medicore.do";
        await RegisterUserAsync(adminClient, adminToken, unlinkedEmail, "Paciente");

        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = With(await LoginAsync(
            client,
            unlinkedEmail,
            "ClaveSegura123"));

        var response = await client.GetAsync("/api/patient-portal/upcoming-appointments");

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    private static string PortalEmailFor(string patientId) => $"portal_{patientId}@correo.do";

    private async Task<string> LoginAsync(HttpClient client, string email, string password)
    {
        var response = await client.PostAsJsonAsync("/api/auth/login", new { email, password });
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        return body.GetProperty("token").GetString()!;
    }

    private async Task RegisterUserAsync(HttpClient client, string adminToken, string email, string role)
    {
        client.DefaultRequestHeaders.Authorization = With(adminToken);
        var response = await client.PostAsJsonAsync("/api/auth/register", new
        {
            email,
            fullName = $"Usuario {role}",
            password = "ClaveSegura123",
            roles = new[] { role }
        });
        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    private async Task RegisterPortalAccountAsync(HttpClient client, string adminToken, string patientId)
    {
        var email = PortalEmailFor(patientId);
        client.DefaultRequestHeaders.Authorization = With(adminToken);
        var response = await client.PostAsJsonAsync("/api/auth/patient-account", new
        {
            patientId,
            email,
            fullName = "Paciente MediCore",
            password = "ClaveSegura123"
        });
        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    private static async Task<string> CreatePatientAsync(HttpClient client)
    {
        var response = await client.PostAsJsonAsync("/api/patients", new
        {
            firstName = "Paciente",
            lastName = "Seguro",
            documentId = $"DOC-{Guid.NewGuid():N}".ToUpperInvariant(),
            gender = "Otro",
            contacts = new[] { new { type = "Phone", value = "809-555-0000" } }
        });
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        return (await response.Content.ReadFromJsonAsync<JsonElement>())
            .GetProperty("id").GetString()!;
    }

    private static async Task<string> CreateDoctorAsync(HttpClient client)
    {
        var response = await client.PostAsJsonAsync("/api/doctors", new
        {
            firstName = "Doctor",
            lastName = "Portal",
            specialty = "Medicina General",
            licenseNumber = $"LIC-{Guid.NewGuid():N}".ToUpperInvariant(),
            experienceYears = 5,
            office = "Consultorio 1",
            schedule = new[]
            {
                new { day = (int)DayOfWeek.Monday, startTime = "08:00", endTime = "12:00" }
            }
        });
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        return (await response.Content.ReadFromJsonAsync<JsonElement>())
            .GetProperty("id").GetString()!;
    }

    private static async Task<string> CreateLaboratoryOrderAsync(
        HttpClient client,
        string patientId,
        string doctorId)
    {
        var response = await client.PostAsJsonAsync("/api/laboratory/orders", new
        {
            patientId,
            doctorId,
            testType = "Hemograma"
        });
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        return (await response.Content.ReadFromJsonAsync<JsonElement>())
            .GetProperty("id").GetString()!;
    }

    private static async Task LoadLaboratoryResultsAsync(HttpClient client, string orderId)
    {
        var response = await client.PostAsJsonAsync($"/api/laboratory/orders/{orderId}/results",
            new Dictionary<string, object?>
            {
                ["hemoglobina"] = 13.5,
                ["leucocitos"] = 7200
            });
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    private static async Task<string> CreateInvoiceAsync(HttpClient client, string patientId)
    {
        var response = await client.PostAsJsonAsync("/api/invoices", new
        {
            patientId,
            createdBy = "test",
            items = new[]
            {
                new { type = "Consulta", description = "Consulta", quantity = 1, unitPrice = 100m }
            }
        });
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        return (await response.Content.ReadFromJsonAsync<JsonElement>())
            .GetProperty("id").GetString()!;
    }

    private static System.Net.Http.Headers.AuthenticationHeaderValue With(string token) =>
        new("Bearer", token);
}
