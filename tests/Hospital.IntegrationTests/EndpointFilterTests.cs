using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using FluentAssertions;
using Hospital.IntegrationTests;
using Xunit;

namespace Hospital.IntegrationTests.Features;

[Collection("MediCore")]
public class EndpointFilterTests(MediCoreApiFactory factory)
{
    [Fact]
    public async Task Post_WithEmptyJsonBody_ReturnsBadRequest()
    {
        var client = factory.CreateClient();

        var adminToken = await LoginAsync(client, "admin@medicore.do", "Admin123!");
        client.DefaultRequestHeaders.Authorization = new("Bearer", adminToken);

        var response = await client.PostAsync("/api/patients",
            new StringContent("", Encoding.UTF8, "application/json"));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        body.GetProperty("error").GetString().Should().Contain("cuerpo");
    }

    [Fact]
    public async Task ValidRequest_PassesFilters_AndIsCreated()
    {
        var client = factory.CreateClient();
        var adminToken = await LoginAsync(client, "admin@medicore.do", "Admin123!");
        client.DefaultRequestHeaders.Authorization = new("Bearer", adminToken);

        var response = await client.PostAsJsonAsync("/api/patients", new
        {
            firstName = "Carmen",
            lastName = "Mejía",
            documentId = $"DOC-{Guid.NewGuid():N}".ToUpper(),
            gender = "Femenino",
            contacts = new[] { new { type = "Phone", value = "849-555-1212" } }
        });

        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    private static async Task<string> LoginAsync(HttpClient client, string email, string password)
    {
        var login = await client.PostAsJsonAsync("/api/auth/login", new { email, password });
        var body = await login.Content.ReadFromJsonAsync<JsonElement>();
        return body.GetProperty("token").GetString()!;
    }
}