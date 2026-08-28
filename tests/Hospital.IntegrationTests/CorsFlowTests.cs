using System.Net;
using FluentAssertions;
using Xunit;

namespace Hospital.IntegrationTests.Features;

[Collection("MediCore")]
public class CorsFlowTests(MediCoreApiFactory factory)
{
    [Fact]
    public async Task Preflight_FromConfiguredFrontend_IsAllowed()
    {
        using var request = CreatePreflight("http://localhost:5173");

        var response = await factory.CreateClient().SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        response.Headers.GetValues("Access-Control-Allow-Origin")
            .Single().Should().Be("http://localhost:5173");
        response.Headers.GetValues("Access-Control-Allow-Headers")
            .Single().Should().Contain("Authorization");
        response.Headers.GetValues("Access-Control-Allow-Methods")
            .Single().Should().Contain("GET");
    }

    [Fact]
    public async Task Preflight_FromUnconfiguredOrigin_IsNotAllowed()
    {
        using var request = CreatePreflight("http://localhost:5174");

        var response = await factory.CreateClient().SendAsync(request);

        response.Headers.Contains("Access-Control-Allow-Origin").Should().BeFalse();
    }

    private static HttpRequestMessage CreatePreflight(string origin)
    {
        var request = new HttpRequestMessage(HttpMethod.Options, "/api/patients");
        request.Headers.Add("Origin", origin);
        request.Headers.Add("Access-Control-Request-Method", "GET");
        request.Headers.Add("Access-Control-Request-Headers", "Authorization, Content-Type");
        return request;
    }
}
