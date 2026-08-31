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
public class AuthFlowTests(MediCoreApiFactory factory)
{
    [Fact]
    public async Task Register_Login_And_ResetPassword_EndToEnd()
    {
        var client = factory.CreateClient();
        var uniqueEmail = $"medico_{Guid.NewGuid():N}@medicore.do";

        var adminLogin = await client.PostAsJsonAsync("/api/auth/login", new { email = "admin@medicore.do", password = "Admin123!" });
        adminLogin.StatusCode.Should().Be(HttpStatusCode.OK);
        var adminBody = await adminLogin.Content.ReadFromJsonAsync<JsonElement>();
        var adminToken = adminBody.GetProperty("token").GetString();
        adminToken.Should().NotBeNullOrWhiteSpace();

        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", adminToken);

        var register = await client.PostAsJsonAsync("/api/auth/register", new
        {
            email = uniqueEmail,
            fullName = "Dra. Prueba",
            password = "ClaveSegura123",
            roles = new[] { "Medico" }
        });
        register.StatusCode.Should().Be(HttpStatusCode.Created);

        client.DefaultRequestHeaders.Authorization = null;

        var login = await client.PostAsJsonAsync("/api/auth/login", new { email = uniqueEmail, password = "ClaveSegura123" });
        login.StatusCode.Should().Be(HttpStatusCode.OK);
        var loginBody = await login.Content.ReadFromJsonAsync<JsonElement>();
        loginBody.GetProperty("token").GetString().Should().NotBeNullOrWhiteSpace();
        loginBody.GetProperty("user").GetProperty("roles").EnumerateArray()
            .Select(r => r.GetString()).Should().Contain("Medico");

        var forgot = await client.PostAsJsonAsync("/api/auth/forgot-password", new { email = uniqueEmail });
        forgot.StatusCode.Should().Be(HttpStatusCode.OK);

        var user = await factory.Database.GetCollection<User>("Users")
            .Find(u => u.Email == uniqueEmail).FirstOrDefaultAsync();
        user.Should().NotBeNull();
        user!.PasswordResetToken.Should().NotBeNullOrWhiteSpace();

        var reset = await client.PostAsJsonAsync("/api/auth/reset-password", new
        {
            token = user.PasswordResetToken,
            newPassword = "NuevaClave456"
        });
        reset.StatusCode.Should().Be(HttpStatusCode.OK);

        var loginOld = await client.PostAsJsonAsync("/api/auth/login", new { email = uniqueEmail, password = "ClaveSegura123" });
        loginOld.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

        var loginNew = await client.PostAsJsonAsync("/api/auth/login", new { email = uniqueEmail, password = "NuevaClave456" });
        loginNew.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Login_WithInvalidCredentials_ReturnsUnauthorized()
    {
        var client = factory.CreateClient();

        var login = await client.PostAsJsonAsync("/api/auth/login", new { email = "nadie@medicore.do", password = "Incorrecta123" });

        login.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Register_WithoutToken_ReturnsUnauthorized()
    {
        var client = factory.CreateClient();

        var register = await client.PostAsJsonAsync("/api/auth/register", new
        {
            email = "sin_token@medicore.do",
            fullName = "Sin Token",
            password = "ClaveSegura123",
            roles = new[] { "Medico" }
        });

        register.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}