using Hospital.Application.Features.Reports.Queries;

namespace Hospital.Application.Interfaces;

public interface IReportRepository
{
    Task<IReadOnlyList<BillingReportRow>> GetInvoicesSummaryAsync(
        DateTime fromInclusive,
        DateTime toExclusive,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<MedicationDispensedRow>> GetTopDispensedMedicationsAsync(
        int limit,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<CategoryCountRow>> GetMostRequestedLaboratoryTestsAsync(
        int limit,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<CategoryCountRow>> GetMostFrequentPatientsAsync(
        int limit,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<LowStockRow>> GetLowStockMedicationsAsync(
        CancellationToken cancellationToken = default);
}