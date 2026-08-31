using Hospital.Domain.Entities;
using Hospital.Domain.Interfaces;
using Hospital.Infrastructure.MongoDb.Repositories.Base;
using MongoDB.Driver;

namespace Hospital.Infrastructure.MongoDb.Repositories;

public class UserRepository(IMongoDbContext context)
    : MongoRepository<User>(context.Database, "Users"), IUserRepository
{
    public async Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        return await FirstOrDefaultAsync(u => u.Email == email, cancellationToken);
    }

    public async Task<User?> GetByPasswordResetTokenAsync(string token, CancellationToken cancellationToken = default)
    {
        return await FirstOrDefaultAsync(u => u.PasswordResetToken == token, cancellationToken);
    }
}