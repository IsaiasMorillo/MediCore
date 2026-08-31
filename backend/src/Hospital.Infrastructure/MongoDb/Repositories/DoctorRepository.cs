using System.Text.RegularExpressions;
using Hospital.Domain.Entities;
using Hospital.Domain.Enums;
using Hospital.Domain.Interfaces;
using Hospital.Infrastructure.MongoDb.Repositories.Base;
using MongoDB.Bson;
using MongoDB.Driver;

namespace Hospital.Infrastructure.MongoDb.Repositories;

public class DoctorRepository(IMongoDbContext context)
    : MongoRepository<Doctor>(context.Database, "Doctors"), IDoctorRepository
{
    public async Task<IReadOnlyList<Doctor>> SearchAsync(
        string? specialty,
        string? searchTerm,
        CancellationToken cancellationToken = default)
    {
        var filters = new List<FilterDefinition<Doctor>>();

        if (!string.IsNullOrWhiteSpace(specialty))
        {
            filters.Add(Builders<Doctor>.Filter.Eq(d => d.Specialty, specialty.Trim()));
        }

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var pattern = new BsonRegularExpression(Regex.Escape(searchTerm.Trim()), "i");
            filters.Add(Builders<Doctor>.Filter.Or(
                Builders<Doctor>.Filter.Regex(d => d.FirstName, pattern),
                Builders<Doctor>.Filter.Regex(d => d.LastName, pattern),
                Builders<Doctor>.Filter.Regex(d => d.Specialty, pattern)));
        }

        var filter = filters.Count == 0 ? Builders<Doctor>.Filter.Empty : Builders<Doctor>.Filter.And(filters);
        return await Collection.Find(filter).ToListAsync(cancellationToken);
    }
}

public class AppointmentRepository(IMongoDbContext context)
    : MongoRepository<Appointment>(context.Database, "Appointments"), IAppointmentRepository
{
    public async Task<IReadOnlyList<Appointment>> GetByDoctorAndDateAsync(
        string doctorId,
        DateTime start,
        DateTime end,
        CancellationToken cancellationToken = default)
    {
        var filter = Builders<Appointment>.Filter.And(
            Builders<Appointment>.Filter.Eq(a => a.DoctorId, doctorId),
            Builders<Appointment>.Filter.Gte(a => a.StartDateTime, start),
            Builders<Appointment>.Filter.Lt(a => a.StartDateTime, end));

        return await Collection.Find(filter).ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Appointment>> GetOverlappingAsync(
        string doctorId,
        DateTime start,
        DateTime end,
        string? excludeAppointmentId,
        CancellationToken cancellationToken = default)
    {
        var filter = Builders<Appointment>.Filter.And(
            Builders<Appointment>.Filter.Eq(a => a.DoctorId, doctorId),
            Builders<Appointment>.Filter.Ne(a => a.Status, AppointmentStatus.Cancelled),
            Builders<Appointment>.Filter.Lt(a => a.StartDateTime, end),
            Builders<Appointment>.Filter.Gt(a => a.EndDateTime, start));

        if (!string.IsNullOrWhiteSpace(excludeAppointmentId))
        {
            filter &= Builders<Appointment>.Filter.Ne(a => a.Id, excludeAppointmentId);
        }

        return await Collection.Find(filter).ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Appointment>> GetPendingReminderAppointmentsAsync(
        DateTime fromInclusive,
        DateTime toExclusive,
        CancellationToken cancellationToken = default)
    {
        var filter = Builders<Appointment>.Filter.And(
            Builders<Appointment>.Filter.Gte(a => a.StartDateTime, fromInclusive),
            Builders<Appointment>.Filter.Lt(a => a.StartDateTime, toExclusive),
            Builders<Appointment>.Filter.In(a => a.Status,
                [AppointmentStatus.Scheduled, AppointmentStatus.Confirmed, AppointmentStatus.Rescheduled]),
            Builders<Appointment>.Filter.Eq(a => a.ReminderSentAt, null));

        return await Collection.Find(filter).ToListAsync(cancellationToken);
    }
}