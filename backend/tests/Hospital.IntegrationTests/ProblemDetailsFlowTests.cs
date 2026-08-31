using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using FluentAssertions;
using Xunit;

namespace Hospital.IntegrationTests.Features;

[Collection("MediCore")]
public class ProblemDetailsFlowTests(MediCoreApiFactory factory)
{
    [Fact]
    public async Task AnonymousRequest_ReturnsProblemDetails401()
    {
        var response = await factory.CreateClient().GetAsync("/api/patients");

        var body = await AssertProblemDetailsAsync(response, HttpStatusCode.Unauthorized);
        body.GetProperty("status").GetInt32().Should().Be((int)HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task AuthenticatedUserWithoutRequiredRole_ReturnsProblemDetails403()
    {
        var adminClient = factory.CreateClient();
        var adminToken = await LoginAsync(adminClient, "admin@medicore.do", "Admin123!");
        var receptionEmail = $"reception_{Guid.NewGuid():N}@medicore.do";

        adminClient.DefaultRequestHeaders.Authorization = With(adminToken);
        var register = await adminClient.PostAsJsonAsync("/api/auth/register", new
        {
            email = receptionEmail,
            fullName = "Recepcion ProblemDetails",
            password = "ClaveSegura123",
            roles = new[] { "Recepcion" }
        });
        register.StatusCode.Should().Be(HttpStatusCode.Created);

        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = With(await LoginAsync(
            client,
            receptionEmail,
            "ClaveSegura123"));

        var response = await client.GetAsync("/api/reports/invoices-summary");

        var body = await AssertProblemDetailsAsync(response, HttpStatusCode.Forbidden);
        body.GetProperty("status").GetInt32().Should().Be((int)HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task DomainNotFound_ReturnsProblemDetails404()
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = With(await LoginAsync(
            client,
            "admin@medicore.do",
            "Admin123!"));

        var response = await client.GetAsync("/api/invoices/does-not-exist");

        var body = await AssertProblemDetailsAsync(response, HttpStatusCode.NotFound);
        body.GetProperty("detail").GetString().Should().Contain("Factura");
    }

    [Fact]
    public async Task ValidationFailure_ReturnsProblemDetails400()
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = With(await LoginAsync(
            client,
            "admin@medicore.do",
            "Admin123!"));

        var response = await client.PostAsync(
            "/api/patients",
            new StringContent(string.Empty, Encoding.UTF8, "application/json"));

        var body = await AssertProblemDetailsAsync(response, HttpStatusCode.BadRequest);
        body.GetProperty("error").GetString().Should().Contain("cuerpo");
    }

    private static async Task<JsonElement> AssertProblemDetailsAsync(
        HttpResponseMessage response,
        HttpStatusCode expectedStatus)
    {
        response.StatusCode.Should().Be(expectedStatus);
        response.Content.Headers.ContentType?.MediaType
            .Should().Be("application/problem+json");

        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        body.TryGetProperty("type", out _).Should().BeTrue();
        body.TryGetProperty("title", out _).Should().BeTrue();
        body.TryGetProperty("status", out _).Should().BeTrue();
        body.GetProperty("traceId").GetString().Should().NotBeNullOrWhiteSpace();
        return body;
    }

    private static async Task<string> LoginAsync(HttpClient client, string email, string password)
    {
        var response = await client.PostAsJsonAsync("/api/auth/login", new { email, password });
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        return body.GetProperty("token").GetString()!;
    }

    private static AuthenticationHeaderValue With(string token) => new("Bearer", token);
}
