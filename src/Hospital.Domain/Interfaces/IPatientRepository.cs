using Hospital.Domain.Entities;

namespace Hospital.Domain.Interfaces;

public interface IPatientRepository : IRepository<Patient>
{
    Task<IReadOnlyList<Patient>> SearchAsync(
        string? searchTerm,
        CancellationToken cancellationToken = default);
}