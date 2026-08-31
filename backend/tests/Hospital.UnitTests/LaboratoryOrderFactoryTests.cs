using FluentAssertions;
using Hospital.Application.Features.Laboratory;
using Hospital.Domain.Enums;

namespace Hospital.UnitTests.Application;

public class LaboratoryOrderFactoryTests
{
    private readonly LaboratoryOrderFactory _factory = new();

    [Theory]
    [InlineData(TestType.Hemograma)]
    [InlineData(TestType.Orina)]
    [InlineData(TestType.Radiografia)]
    [InlineData(TestType.Resonancia)]
    [InlineData(TestType.Tac)]
    [InlineData(TestType.Ecografia)]
    public void Validate_WithSupportedType_ReturnsEmpty(TestType type)
    {
        _factory.Validate(type).Should().BeEmpty();
    }

    [Fact]
    public void Validate_WithUnsupportedType_ReturnsError()
    {
        _factory.Validate((TestType)999).Should().NotBeEmpty();
    }

    [Fact]
    public void BuildResultTemplate_ForHemograma_ReturnsHematologyFields()
    {
        var template = _factory.BuildResultTemplate(TestType.Hemograma);

        template.Should().ContainKeys("hemoglobina", "hematocrito", "leucocitos", "plaquetas");
        template!.Values.All(v => v is null).Should().BeTrue();
    }

    [Fact]
    public void BuildResultTemplate_ForOrina_ReturnsUrineFields()
    {
        var template = _factory.BuildResultTemplate(TestType.Orina);

        template.Should().ContainKeys("ph", "densidad", "glucosa", "proteinas");
    }

    [Fact]
    public void BuildResultTemplate_ForImaging_ContainsRegionAndFindings()
    {
        var tac = _factory.BuildResultTemplate(TestType.Tac);
        var eco = _factory.BuildResultTemplate(TestType.Ecografia);

        tac.Should().ContainKeys("region", "conContraste", "hallazgos");
        eco.Should().ContainKeys("organo", "hallazgos", "conclusion");
    }

    [Fact]
    public void BuildResultTemplate_ForUnknownType_ReturnsNull()
    {
        _factory.BuildResultTemplate((TestType)999).Should().BeNull();
    }

    [Fact]
    public void SupportedTestTypes_ContainsAllSix()
    {
        _factory.SupportedTestTypes.Should().HaveCount(6);
    }
}