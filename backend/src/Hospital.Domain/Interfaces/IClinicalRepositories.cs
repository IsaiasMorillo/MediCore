using Hospital.Domain.Entities;

namespace Hospital.Domain.Interfaces;

public interface IMedicalRecordRepository : IRepository<MedicalRecord>
{
    Task<IReadOnlyList<MedicalRecord>> GetByPatientAsync(
        string patientId,
        CancellationToken cancellationToken = default);

    Task<bool> ExistsForAppointmentAsync(
        string appointmentId,
        CancellationToken cancellationToken = default);
}

public interface ILaboratoryOrderRepository : IRepository<LaboratoryOrder>
{
    Task<IReadOnlyList<LaboratoryOrder>> GetByPatientAsync(
        string patientId,
        CancellationToken cancellationToken = default);
}

public interface IMedicationRepository : IRepository<Medication>
{
    Task<IReadOnlyList<Medication>> SearchAsync(
        string? searchTerm,
        CancellationToken cancellationToken = default);
}

public interface IPrescriptionRepository : IRepository<Prescription>
{
    Task<IReadOnlyList<Prescription>> GetByPatientAsync(
        string patientId,
        CancellationToken cancellationToken = default);
}

public interface IVitalsRepository : IRepository<VitalsRecord>
{
    Task<IReadOnlyList<VitalsRecord>> GetByPatientAsync(
        string patientId,
        CancellationToken cancellationToken = default);
}