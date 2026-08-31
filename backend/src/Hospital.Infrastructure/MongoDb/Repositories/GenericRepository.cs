using Hospital.Domain.Entities;
using Hospital.Domain.Enums;
using Hospital.Infrastructure.MongoDb;
using MongoDB.Driver;

namespace Hospital.Infrastructure.MongoDb.Repositories;

public class GenericRepository<T>(IMongoDbContext context)
    : Base.MongoRepository<T>(context.Database, typeof(T).Name + "s")
    where T : Domain.Common.Entity
{
}

public class UserSeeder(IMongoDbContext context)
{
    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        var filter = Builders<User>.Filter.Eq(u => u.Email, "admin@medicore.do");
        var existing = await context.Users.Find(filter).FirstOrDefaultAsync(cancellationToken);
        if (existing is not null)
        {
            return;
        }

        var admin = new User
        {
            Email = "admin@medicore.do",
            FullName = "Administrador del Sistema",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
            Roles = [UserRole.Admin],
            IsActive = true
        };

        await context.Users.InsertOneAsync(admin, cancellationToken: cancellationToken);
    }
}