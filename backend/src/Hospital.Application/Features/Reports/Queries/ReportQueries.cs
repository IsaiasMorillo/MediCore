using Hospital.Domain.Common;
using MediatR;

namespace Hospital.Application.Features.Reports.Queries;

public record BillingReportRow(int Year, int Month, int InvoiceCount, decimal TotalInvoiced);

public record MedicationDispensedRow(string MedicationId, string MedicationName, int PrescriptionCount, int TotalQuantity);

public record CategoryCountRow(string Key, string Label, int Count);

public record LowStockRow(string MedicationId, string MedicationName, int StockQuantity, int ReorderLevel);

public record GetInvoicesSummaryReportQuery(DateTime? From = null, DateTime? To = null)
    : IRequest<Result<IReadOnlyList<BillingReportRow>>>;

public record GetMedicationsDispensedReportQuery(int Limit = 10)
    : IRequest<Result<IReadOnlyList<MedicationDispensedRow>>>;

public record GetLaboratoryMostRequestedReportQuery(int Limit = 10)
    : IRequest<Result<IReadOnlyList<CategoryCountRow>>>;

public record GetPatientsMostFrequentReportQuery(int Limit = 10)
    : IRequest<Result<IReadOnlyList<CategoryCountRow>>>;

public record GetLowStockReportQuery()
    : IRequest<Result<IReadOnlyList<LowStockRow>>>;