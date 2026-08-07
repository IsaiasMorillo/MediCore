using Hospital.Domain.Entities;

namespace Hospital.Domain.Interfaces;

public interface IDoctorRepository : IRepository<Doctor>
{
    Task<IReadOnlyList<Doctor>> SearchAsync(
        string? specialty,
        string? searchTerm,
        CancellationToken cancellationToken = default);
}

public interface IAppointmentRepository : IRepository<Appointment>
{
    Task<IReadOnlyList<Appointment>> GetByDoctorAndDateAsync(
        string doctorId,
        DateTime start,
        DateTime end,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Appointment>> GetOverlappingAsync(
        string doctorId,
        DateTime start,
        DateTime end,
        string? excludeAppointmentId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Appointment>> GetPendingReminderAppointmentsAsync(
        DateTime fromInclusive,
        DateTime toExclusive,
        CancellationToken cancellationToken = default);
}