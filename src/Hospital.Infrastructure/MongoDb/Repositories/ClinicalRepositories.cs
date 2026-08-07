using System.Text.RegularExpressions;
using Hospital.Domain.Entities;
using Hospital.Domain.Interfaces;
using Hospital.Infrastructure.MongoDb.Repositories.Base;
using MongoDB.Bson;
using MongoDB.Driver;

namespace Hospital.Infrastructure.MongoDb.Repositories;

public class MedicalRecordRepository(IMongoDbContext context)
    : MongoRepository<MedicalRecord>(context.Database, "MedicalRecords"), IMedicalRecordRepository
{
    public async Task<IReadOnlyList<MedicalRecord>> GetByPatientAsync(
        string patientId,
        CancellationToken cancellationToken = default)
    {
        return await Collection.Find(r => r.PatientId == patientId).ToListAsync(cancellationToken);
    }

    public async Task<bool> ExistsForAppointmentAsync(
        string appointmentId,
        CancellationToken cancellationToken = default)
    {
        return await Collection.Find(r => r.AppointmentId == appointmentId).AnyAsync(cancellationToken);
    }
}

public class LaboratoryOrderRepository(IMongoDbContext context)
    : MongoRepository<LaboratoryOrder>(context.Database, "LaboratoryOrders"), ILaboratoryOrderRepository
{
    public async Task<IReadOnlyList<LaboratoryOrder>> GetByPatientAsync(
        string patientId,
        CancellationToken cancellationToken = default)
    {
        return await Collection.Find(o => o.PatientId == patientId).ToListAsync(cancellationToken);
    }
}

public class MedicationRepository(IMongoDbContext context)
    : MongoRepository<Medication>(context.Database, "Medications"), IMedicationRepository
{
    public async Task<IReadOnlyList<Medication>> SearchAsync(
        string? searchTerm,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(searchTerm))
        {
            return await GetAllAsync(cancellationToken);
        }

        var pattern = new BsonRegularExpression(Regex.Escape(searchTerm.Trim()), "i");
        var filter = Builders<Medication>.Filter.Or(
            Builders<Medication>.Filter.Regex(m => m.Name, pattern),
            Builders<Medication>.Filter.Regex(m => m.Code, pattern),
            Builders<Medication>.Filter.Regex(m => m.Category, pattern));

        return await Collection.Find(filter).ToListAsync(cancellationToken);
    }
}

public class PrescriptionRepository(IMongoDbContext context)
    : MongoRepository<Prescription>(context.Database, "Prescriptions"), IPrescriptionRepository
{
    public async Task<IReadOnlyList<Prescription>> GetByPatientAsync(
        string patientId,
        CancellationToken cancellationToken = default)
    {
        return await Collection.Find(p => p.PatientId == patientId).ToListAsync(cancellationToken);
    }
}