using Hospital.Domain.Entities;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace Hospital.Infrastructure.MongoDb;

public interface IMongoDbContext
{
    IMongoDatabase Database { get; }

    IMongoCollection<User> Users { get; }

    IMongoCollection<Patient> Patients { get; }

    IMongoCollection<Doctor> Doctors { get; }

    IMongoCollection<Appointment> Appointments { get; }

    IMongoCollection<MedicalRecord> MedicalRecords { get; }

    IMongoCollection<LaboratoryOrder> LaboratoryOrders { get; }

    IMongoCollection<Medication> Medications { get; }

    IMongoCollection<Prescription> Prescriptions { get; }

    IMongoCollection<Invoice> Invoices { get; }

    IMongoCollection<VitalsRecord> VitalsRecords { get; }
}

public class MongoDbContext : IMongoDbContext
{
    private readonly IMongoDatabase _database;

    public MongoDbContext(IOptions<MongoDbSettings> options)
    {
        var client = new MongoClient(options.Value.ConnectionString);
        _database = client.GetDatabase(options.Value.DatabaseName);

        Users.Indexes.CreateOne(new CreateIndexModel<User>(
            Builders<User>.IndexKeys.Ascending(u => u.Email),
            new CreateIndexOptions { Unique = true }));

        Patients.Indexes.CreateOne(new CreateIndexModel<Patient>(
            Builders<Patient>.IndexKeys.Ascending(p => p.PersonalData.DocumentId),
            new CreateIndexOptions { Unique = true }));
        Patients.Indexes.CreateOne(new CreateIndexModel<Patient>(
            Builders<Patient>.IndexKeys.Text(p => p.PersonalData.FirstName)
                .Text(p => p.PersonalData.LastName)
                .Text(p => p.PersonalData.DocumentId)));

        Doctors.Indexes.CreateOne(new CreateIndexModel<Doctor>(
            Builders<Doctor>.IndexKeys.Ascending(d => d.LicenseNumber),
            new CreateIndexOptions { Unique = true }));
        Doctors.Indexes.CreateOne(new CreateIndexModel<Doctor>(
            Builders<Doctor>.IndexKeys.Text(d => d.FirstName)
                .Text(d => d.LastName)
                .Text(d => d.Specialty)));

        Appointments.Indexes.CreateOne(new CreateIndexModel<Appointment>(
            Builders<Appointment>.IndexKeys.Ascending(a => a.DoctorId)
                .Ascending(a => a.StartDateTime)));
        Appointments.Indexes.CreateOne(new CreateIndexModel<Appointment>(
            Builders<Appointment>.IndexKeys.Ascending(a => a.PatientId)
                .Ascending(a => a.StartDateTime)));

        MedicalRecords.Indexes.CreateOne(new CreateIndexModel<MedicalRecord>(
            Builders<MedicalRecord>.IndexKeys.Ascending(r => r.PatientId)
                .Descending(r => r.ConsultationDate)));
        MedicalRecords.Indexes.CreateOne(new CreateIndexModel<MedicalRecord>(
            Builders<MedicalRecord>.IndexKeys.Ascending(r => r.AppointmentId)));

        LaboratoryOrders.Indexes.CreateOne(new CreateIndexModel<LaboratoryOrder>(
            Builders<LaboratoryOrder>.IndexKeys.Ascending(o => o.PatientId)
                .Ascending(o => o.RequestedAt)));

        Medications.Indexes.CreateOne(new CreateIndexModel<Medication>(
            Builders<Medication>.IndexKeys.Ascending(m => m.Code),
            new CreateIndexOptions { Unique = true }));

        Prescriptions.Indexes.CreateOne(new CreateIndexModel<Prescription>(
            Builders<Prescription>.IndexKeys.Ascending(p => p.PatientId)));

        Invoices.Indexes.CreateOne(new CreateIndexModel<Invoice>(
            Builders<Invoice>.IndexKeys.Ascending(i => i.Number),
            new CreateIndexOptions { Unique = true }));
        Invoices.Indexes.CreateOne(new CreateIndexModel<Invoice>(
            Builders<Invoice>.IndexKeys.Ascending(i => i.PatientId)
                .Descending(i => i.CreatedAt)));

        VitalsRecords.Indexes.CreateOne(new CreateIndexModel<VitalsRecord>(
            Builders<VitalsRecord>.IndexKeys.Ascending(v => v.PatientId)
                .Descending(v => v.RecordedAt)));
    }

    public IMongoDatabase Database => _database;

    public IMongoCollection<User> Users => _database.GetCollection<User>("Users");

    public IMongoCollection<Patient> Patients => _database.GetCollection<Patient>("Patients");

    public IMongoCollection<Doctor> Doctors => _database.GetCollection<Doctor>("Doctors");

    public IMongoCollection<Appointment> Appointments => _database.GetCollection<Appointment>("Appointments");

    public IMongoCollection<MedicalRecord> MedicalRecords => _database.GetCollection<MedicalRecord>("MedicalRecords");

    public IMongoCollection<LaboratoryOrder> LaboratoryOrders => _database.GetCollection<LaboratoryOrder>("LaboratoryOrders");

    public IMongoCollection<Medication> Medications => _database.GetCollection<Medication>("Medications");

    public IMongoCollection<Prescription> Prescriptions => _database.GetCollection<Prescription>("Prescriptions");

    public IMongoCollection<Invoice> Invoices => _database.GetCollection<Invoice>("Invoices");

    public IMongoCollection<VitalsRecord> VitalsRecords => _database.GetCollection<VitalsRecord>("VitalsRecords");
}