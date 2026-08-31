using Hospital.Domain.Entities;

namespace Hospital.Domain.Interfaces;

public interface IUserRepository : IRepository<User>
{
    Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);

    Task<User?> GetByPasswordResetTokenAsync(string token, CancellationToken cancellationToken = default);
}