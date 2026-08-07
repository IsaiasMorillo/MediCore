using Hospital.Application.Features.Reports.Queries;
using Hospital.Application.Interfaces;
using Hospital.Domain.Common;
using MediatR;

namespace Hospital.Application.Features.Reports;

public class GetInvoicesSummaryReportQueryHandler(IReportRepository reportRepository)
    : IRequestHandler<GetInvoicesSummaryReportQuery, Result<IReadOnlyList<BillingReportRow>>>
{
    public async Task<Result<IReadOnlyList<BillingReportRow>>> Handle(
        GetInvoicesSummaryReportQuery query,
        CancellationToken cancellationToken)
    {
        var from = query.From ?? new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
        var toExclusive = (query.To ?? DateTime.UtcNow.Date).AddDays(1);

        var rows = await reportRepository.GetInvoicesSummaryAsync(from, toExclusive, cancellationToken);
        return Result.Success(rows);
    }
}

public class GetMedicationsDispensedReportQueryHandler(IReportRepository reportRepository)
    : IRequestHandler<GetMedicationsDispensedReportQuery, Result<IReadOnlyList<MedicationDispensedRow>>>
{
    public async Task<Result<IReadOnlyList<MedicationDispensedRow>>> Handle(
        GetMedicationsDispensedReportQuery query,
        CancellationToken cancellationToken)
    {
        var limit = query.Limit is < 1 or > 50 ? 10 : query.Limit;
        var rows = await reportRepository.GetTopDispensedMedicationsAsync(limit, cancellationToken);
        return Result.Success(rows);
    }
}

public class GetLaboratoryMostRequestedReportQueryHandler(IReportRepository reportRepository)
    : IRequestHandler<GetLaboratoryMostRequestedReportQuery, Result<IReadOnlyList<CategoryCountRow>>>
{
    public async Task<Result<IReadOnlyList<CategoryCountRow>>> Handle(
        GetLaboratoryMostRequestedReportQuery query,
        CancellationToken cancellationToken)
    {
        var limit = query.Limit is < 1 or > 50 ? 10 : query.Limit;
        var rows = await reportRepository.GetMostRequestedLaboratoryTestsAsync(limit, cancellationToken);
        return Result.Success(rows);
    }
}

public class GetPatientsMostFrequentReportQueryHandler(IReportRepository reportRepository)
    : IRequestHandler<GetPatientsMostFrequentReportQuery, Result<IReadOnlyList<CategoryCountRow>>>
{
    public async Task<Result<IReadOnlyList<CategoryCountRow>>> Handle(
        GetPatientsMostFrequentReportQuery query,
        CancellationToken cancellationToken)
    {
        var limit = query.Limit is < 1 or > 50 ? 10 : query.Limit;
        var rows = await reportRepository.GetMostFrequentPatientsAsync(limit, cancellationToken);
        return Result.Success(rows);
    }
}

public class GetLowStockReportQueryHandler(IReportRepository reportRepository)
    : IRequestHandler<GetLowStockReportQuery, Result<IReadOnlyList<LowStockRow>>>
{
    public async Task<Result<IReadOnlyList<LowStockRow>>> Handle(
        GetLowStockReportQuery query,
        CancellationToken cancellationToken)
    {
        var rows = await reportRepository.GetLowStockMedicationsAsync(cancellationToken);
        return Result.Success(rows);
    }
}