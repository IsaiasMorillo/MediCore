using FluentAssertions;
using Hospital.Infrastructure.Security;

namespace Hospital.UnitTests.Infrastructure;

public class PasswordHasherTests
{
    private readonly PasswordHasher _hasher = new();

    [Fact]
    public void Hash_ShouldProduceBcryptHash()
    {
        var hash = _hasher.Hash("MiClaveSegura123");

        hash.Should().NotBeNullOrWhiteSpace();
        hash.StartsWith("$2").Should().BeTrue();
    }

    [Fact]
    public void Verify_WithCorrectPassword_ReturnsTrue()
    {
        var hash = _hasher.Hash("MiClaveSegura123");

        _hasher.Verify("MiClaveSegura123", hash).Should().BeTrue();
    }

    [Fact]
    public void Verify_WithWrongPassword_ReturnsFalse()
    {
        var hash = _hasher.Hash("MiClaveSegura123");

        _hasher.Verify("ClaveIncorrecta", hash).Should().BeFalse();
    }
}