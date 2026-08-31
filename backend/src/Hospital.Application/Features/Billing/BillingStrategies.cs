using Hospital.Domain.Entities;
using Hospital.Domain.Enums;

namespace Hospital.Application.Features.Billing;

public record BillingBreakdown(
    decimal Subtotal,
    decimal InsuranceCoverage,
    decimal Discount,
    decimal Taxes,
    decimal Total);

public interface IBillingStrategy
{
    CoverageType CoverageType { get; }

    BillingBreakdown Calculate(IReadOnlyList<InvoiceItem> items);
}

public static class BillingMath
{
    public const decimal ItbisRate = 0.18m;

    public static decimal Round2(decimal value) => Math.Round(value, 2, MidpointRounding.AwayFromZero);

    public static decimal ItemSubtotal(InvoiceItem item) => item.UnitPrice * item.Quantity;
}

public class WithoutInsuranceStrategy : IBillingStrategy
{
    public CoverageType CoverageType => CoverageType.SinSeguro;

    public BillingBreakdown Calculate(IReadOnlyList<InvoiceItem> items)
    {
        var subtotal = BillingMath.Round2(items.Sum(BillingMath.ItemSubtotal));
        var taxes = BillingMath.Round2(subtotal * BillingMath.ItbisRate);
        return new BillingBreakdown(subtotal, 0, 0, taxes, BillingMath.Round2(subtotal + taxes));
    }
}

public class ArsCoverageStrategy(decimal coveragePercent, CoverageType coverageType) : IBillingStrategy
{
    public CoverageType CoverageType { get; } = coverageType;

    public BillingBreakdown Calculate(IReadOnlyList<InvoiceItem> items)
    {
        var subtotal = BillingMath.Round2(items.Sum(BillingMath.ItemSubtotal));

        var coveredSubtotal = BillingMath.Round2(
            items.Where(i => i.Type is InvoiceItemType.Consulta or InvoiceItemType.Examen)
                .Sum(BillingMath.ItemSubtotal));

        var coverage = BillingMath.Round2(coveredSubtotal * coveragePercent);
        var patientShare = BillingMath.Round2(subtotal - coverage);
        var taxes = BillingMath.Round2(patientShare * BillingMath.ItbisRate);

        return new BillingBreakdown(subtotal, coverage, 0, taxes, BillingMath.Round2(patientShare + taxes));
    }
}

public class BillingStrategyFactory
{
    private readonly IReadOnlyDictionary<CoverageType, IBillingStrategy> _strategies =
        new Dictionary<CoverageType, IBillingStrategy>
        {
            [CoverageType.SinSeguro] = new WithoutInsuranceStrategy(),
            [CoverageType.Basica] = new ArsCoverageStrategy(0.60m, CoverageType.Basica),
            [CoverageType.Premium] = new ArsCoverageStrategy(0.90m, CoverageType.Premium)
        };

    public IBillingStrategy Get(CoverageType coverageType) =>
        _strategies.TryGetValue(coverageType, out var strategy)
            ? strategy
            : _strategies[CoverageType.SinSeguro];
}

public static class CoverageTypeParser
{
    public static CoverageType Parse(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return CoverageType.SinSeguro;
        }

        return raw.Trim().ToLowerInvariant() switch
        {
            "basica" or "básica" or "basico" or "básico" => CoverageType.Basica,
            "premium" => CoverageType.Premium,
            _ => CoverageType.SinSeguro
        };
    }
}