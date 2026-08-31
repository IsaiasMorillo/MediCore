using System.Text.RegularExpressions;
using Hospital.Domain.Entities;
using Hospital.Domain.Interfaces;
using Hospital.Infrastructure.MongoDb.Repositories.Base;
using MongoDB.Bson;
using MongoDB.Driver;

namespace Hospital.Infrastructure.MongoDb.Repositories;

public class PatientRepository(IMongoDbContext context)
    : MongoRepository<Patient>(context.Database, "Patients"), IPatientRepository
{
    public async Task<IReadOnlyList<Patient>> SearchAsync(
        string? searchTerm,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(searchTerm))
        {
            return await GetAllAsync(cancellationToken);
        }

        var term = Regex.Escape(searchTerm.Trim());
        var pattern = new BsonRegularExpression(term, "i");
        var filter = Builders<Patient>.Filter.Or(
            Builders<Patient>.Filter.Regex(p => p.PersonalData.FirstName, pattern),
            Builders<Patient>.Filter.Regex(p => p.PersonalData.LastName, pattern),
            Builders<Patient>.Filter.Regex(p => p.PersonalData.DocumentId, pattern));

        return await Collection.Find(filter).ToListAsync(cancellationToken);
    }
}