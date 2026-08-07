using FluentAssertions;
using Hospital.Domain.Entities;
using Hospital.Domain.Enums;
using Hospital.Infrastructure.Authentication;
using Hospital.Application.Features.Auth.Commands;
using Microsoft.Extensions.Options;

namespace Hospital.UnitTests.Infrastructure;

public class JwtTokenGeneratorTests
{
    private static JwtTokenGenerator CreateGenerator()
    {
        var settings = new JwtSettings
        {
            Secret = "TestSecretKey_AtLeast32CharactersLong_0123456789",
            Issuer = "MediCoreTest",
            Audience = "MediCoreTestClients",
            ExpirationMinutes = 60
        };
        return new JwtTokenGenerator(Options.Create(settings));
    }

    [Fact]
    public void GenerateToken_WithValidUser_ReturnsNonEmptyToken()
    {
        var generator = CreateGenerator();
        var user = new User
        {
            Id = "user-123",
            Email = "medico@medicore.do",
            FullName = "Dr. Prueba",
            Roles = [UserRole.Medico]
        };

        var token = generator.GenerateToken(user);

        token.Should().NotBeNullOrWhiteSpace();
        token.Split('.').Should().HaveCount(3);
    }

    [Fact]
    public void GenerateToken_WithValidUser_ContainsSubjectAndRoles()
    {
        var generator = CreateGenerator();
        var user = new User
        {
            Id = "user-456",
            Email = "admin@medicore.do",
            FullName = "Admin",
            Roles = [UserRole.Admin, UserRole.Medico]
        };

        var token = generator.GenerateToken(user);

        var handler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(token);

        jwt.Subject.Should().Be(user.Id);
        jwt.Claims.Any(c => c.Type == "email" && c.Value == user.Email).Should().BeTrue();
        jwt.Claims.Count(c => c.Type.ToLowerInvariant().EndsWith("role")).Should().Be(2);
    }
}