using FluentAssertions;
using Hospital.Application.Features.Billing;
using Hospital.Domain.Entities;
using Hospital.Domain.Enums;

namespace Hospital.UnitTests.Application;

public class BillingStrategyTests
{
    private static List<InvoiceItem> Items(
        decimal consulta = 0,
        decimal examen = 0,
        decimal medicamento = 0,
        int cantidadMedicamento = 1)
    {
        var items = new List<InvoiceItem>();
        if (consulta > 0)
        {
            items.Add(new InvoiceItem { Type = InvoiceItemType.Consulta, Description = "Consulta", Quantity = 1, UnitPrice = consulta });
        }

        if (examen > 0)
        {
            items.Add(new InvoiceItem { Type = InvoiceItemType.Examen, Description = "Examen", Quantity = 1, UnitPrice = examen });
        }

        if (medicamento > 0)
        {
            items.Add(new InvoiceItem
            {
                Type = InvoiceItemType.Medicamento,
                Description = "Medicamento",
                Quantity = cantidadMedicamento,
                UnitPrice = medicamento
            });
        }

        return items;
    }

    [Fact]
    public void WithoutInsurance_AppliesFullItbis18Percent()
    {
        var strategy = new WithoutInsuranceStrategy();

        var breakdown = strategy.Calculate(Items(consulta: 100));

        breakdown.Subtotal.Should().Be(100m);
        breakdown.InsuranceCoverage.Should().Be(0);
        breakdown.Taxes.Should().Be(18.00m);
        breakdown.Total.Should().Be(118.00m);
    }

    [Fact]
    public void WithoutInsurance_RoundsTaxesToTwoDecimals()
    {
        var strategy = new WithoutInsuranceStrategy();

        var breakdown = strategy.Calculate(Items(consulta: 33.33m));

        breakdown.Taxes.Should().Be(6.00m);
        breakdown.Total.Should().Be(39.33m);
    }

    [Fact]
    public void BasicCoverage_Covers60PercentOfMedicalItemsAndTaxesOnlyPatientShare()
    {
        var strategy = new BillingStrategyFactory().Get(CoverageType.Basica);

        var breakdown = strategy.Calculate(Items(consulta: 1500, examen: 2500, medicamento: 500, cantidadMedicamento: 2));

        breakdown.Subtotal.Should().Be(5000m);
        breakdown.InsuranceCoverage.Should().Be(2400m);
        breakdown.Taxes.Should().Be(468.00m);
        breakdown.Total.Should().Be(3068.00m);
    }

    [Fact]
    public void PremiumCoverage_Covers90PercentOfMedicalItems()
    {
        var strategy = new BillingStrategyFactory().Get(CoverageType.Premium);

        var breakdown = strategy.Calculate(Items(consulta: 1500, examen: 2500, medicamento: 500, cantidadMedicamento: 2));

        breakdown.Subtotal.Should().Be(5000m);
        breakdown.InsuranceCoverage.Should().Be(3600m);
        breakdown.Taxes.Should().Be(252.00m);
        breakdown.Total.Should().Be(1652.00m);
    }

    [Fact]
    public void InsuranceCoverage_DoesNotApplyToMedicationItems()
    {
        var strategy = new BillingStrategyFactory().Get(CoverageType.Premium);

        var breakdown = strategy.Calculate(Items(medicamento: 1000, cantidadMedicamento: 1));

        breakdown.Subtotal.Should().Be(1000m);
        breakdown.InsuranceCoverage.Should().Be(0m);
        breakdown.Taxes.Should().Be(180.00m);
        breakdown.Total.Should().Be(1180.00m);
    }

    [Fact]
    public void Factory_WithUnknownCoverageType_FallsBackToWithoutInsurance()
    {
        var strategy = new BillingStrategyFactory();

        var breakdown = strategy.Get((CoverageType)999).Calculate(Items(consulta: 100));

        breakdown.Taxes.Should().Be(18.00m);
        breakdown.Total.Should().Be(118.00m);
    }

    [Fact]
    public void CoverageTypeParser_NormalizesSpanishValues()
    {
        CoverageTypeParser.Parse("Básica").Should().Be(CoverageType.Basica);
        CoverageTypeParser.Parse("premium").Should().Be(CoverageType.Premium);
        CoverageTypeParser.Parse("").Should().Be(CoverageType.SinSeguro);
        CoverageTypeParser.Parse("OtroPlan").Should().Be(CoverageType.SinSeguro);
    }
}