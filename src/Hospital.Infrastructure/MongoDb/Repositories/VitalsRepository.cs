using Hospital.Domain.Entities;
using Hospital.Domain.Interfaces;
using Hospital.Infrastructure.MongoDb.Repositories.Base;
using MongoDB.Driver;

namespace Hospital.Infrastructure.MongoDb.Repositories;

public class VitalsRepository(IMongoDbContext context)
    : MongoRepository<VitalsRecord>(context.Database, "VitalsRecords"), IVitalsRepository
{
    public async Task<IReadOnlyList<VitalsRecord>> GetByPatientAsync(
        string patientId,
        CancellationToken cancellationToken = default)
    {
        return await Collection.Find(v => v.PatientId == patientId)
            .SortByDescending(v => v.RecordedAt)
            .ToListAsync(cancellationToken);
    }
}