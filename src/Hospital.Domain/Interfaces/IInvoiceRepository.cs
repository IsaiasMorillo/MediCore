using Hospital.Domain.Entities;

namespace Hospital.Domain.Interfaces;

public interface IInvoiceRepository : IRepository<Invoice>
{
    Task<IReadOnlyList<Invoice>> GetByPatientAsync(
        string patientId,
        CancellationToken cancellationToken = default);

    Task<Invoice?> GetByNumberAsync(
        string number,
        CancellationToken cancellationToken = default);
}