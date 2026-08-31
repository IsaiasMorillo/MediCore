using Hospital.Domain.Entities;
using Hospital.Domain.Interfaces;
using Hospital.Infrastructure.MongoDb.Repositories.Base;
using MongoDB.Driver;

namespace Hospital.Infrastructure.MongoDb.Repositories;

public class InvoiceRepository(IMongoDbContext context)
    : MongoRepository<Invoice>(context.Database, "Invoices"), IInvoiceRepository
{
    public async Task<IReadOnlyList<Invoice>> GetByPatientAsync(
        string patientId,
        CancellationToken cancellationToken = default)
    {
        return await Collection.Find(i => i.PatientId == patientId)
            .SortByDescending(i => i.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<Invoice?> GetByNumberAsync(
        string number,
        CancellationToken cancellationToken = default)
    {
        return await Collection.Find(i => i.Number == number).FirstOrDefaultAsync(cancellationToken);
    }
}