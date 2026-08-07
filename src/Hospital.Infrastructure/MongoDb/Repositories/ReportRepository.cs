using Hospital.Application.Features.Reports.Queries;
using Hospital.Application.Interfaces;
using Hospital.Domain.Entities;
using Hospital.Domain.Enums;
using Hospital.Infrastructure.MongoDb;
using MongoDB.Driver;

namespace Hospital.Infrastructure.MongoDb.Repositories;

public class ReportRepository(IMongoDbContext context) : IReportRepository
{
    public async Task<IReadOnlyList<BillingReportRow>> GetInvoicesSummaryAsync(
        DateTime fromInclusive,
        DateTime toExclusive,
        CancellationToken cancellationToken = default)
    {
        var filter = Builders<Invoice>.Filter.Eq(i => i.Status, InvoiceStatus.Pagada)
            & Builders<Invoice>.Filter.Gte(i => i.InvoiceDate, fromInclusive)
            & Builders<Invoice>.Filter.Lt(i => i.InvoiceDate, toExclusive);

        return await context.Invoices.Aggregate()
            .Match(filter)
            .Group(
                i => new { i.InvoiceDate.Year, i.InvoiceDate.Month },
                g => new BillingReportRow(g.Key.Year, g.Key.Month, g.Count(), g.Sum(x => x.Total)))
            .SortByDescending(x => x.Year)
            .ThenByDescending(x => x.Month)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<MedicationDispensedRow>> GetTopDispensedMedicationsAsync(
        int limit,
        CancellationToken cancellationToken = default)
    {
        var aggregates = await context.Prescriptions.Aggregate()
            .Match(p => p.Status == PrescriptionStatus.Despachada)
            .Group(
                p => p.MedicationId,
                g => new { MedicationId = g.Key, PrescriptionCount = g.Count(), TotalQuantity = g.Sum(x => x.Quantity) })
            .SortByDescending(x => x.TotalQuantity)
            .Limit(limit)
            .ToListAsync(cancellationToken);

        var medicationIds = aggregates.Select(a => a.MedicationId).ToList();
        var medications = await context.Medications
            .Find(Builders<Medication>.Filter.In(m => m.Id, medicationIds))
            .ToListAsync(cancellationToken);
        var names = medications.ToDictionary(m => m.Id, m => m.Name);

        return aggregates
            .Select(a => new MedicationDispensedRow(
                a.MedicationId,
                names.TryGetValue(a.MedicationId, out var name) ? name : "Desconocido",
                a.PrescriptionCount,
                a.TotalQuantity))
            .ToList();
    }

    public async Task<IReadOnlyList<CategoryCountRow>> GetMostRequestedLaboratoryTestsAsync(
        int limit,
        CancellationToken cancellationToken = default)
    {
        var rows = await context.LaboratoryOrders.Aggregate()
            .Group(o => o.TestType, g => new { TestType = g.Key, Count = g.Count() })
            .SortByDescending(x => x.Count)
            .Limit(limit)
            .ToListAsync(cancellationToken);

        return rows
            .Select(x => new CategoryCountRow(x.TestType.ToString(), x.TestType.ToString(), x.Count))
            .ToList();
    }

    public async Task<IReadOnlyList<CategoryCountRow>> GetMostFrequentPatientsAsync(
        int limit,
        CancellationToken cancellationToken = default)
    {
        var aggregates = await context.Appointments.Aggregate()
            .Match(a => a.Status != AppointmentStatus.Cancelled)
            .Group(a => a.PatientId, g => new { PatientId = g.Key, Count = g.Count() })
            .SortByDescending(x => x.Count)
            .Limit(limit)
            .ToListAsync(cancellationToken);

        var patientIds = aggregates.Select(a => a.PatientId).ToList();
        var patients = await context.Patients
            .Find(Builders<Patient>.Filter.In(p => p.Id, patientIds))
            .ToListAsync(cancellationToken);
        var names = patients.ToDictionary(p => p.Id, p => $"{p.PersonalData.FirstName} {p.PersonalData.LastName}".Trim());

        return aggregates
            .Select(a => new CategoryCountRow(
                a.PatientId,
                names.TryGetValue(a.PatientId, out var name) ? name : "Desconocido",
                a.Count))
            .ToList();
    }

    public async Task<IReadOnlyList<LowStockRow>> GetLowStockMedicationsAsync(
        CancellationToken cancellationToken = default)
    {
        var medications = await context.Medications
            .Find(m => m.IsActive && m.StockQuantity <= m.ReorderLevel)
            .ToListAsync(cancellationToken);

        return medications
            .Select(m => new LowStockRow(m.Id, m.Name, m.StockQuantity, m.ReorderLevel))
            .ToList();
    }
}