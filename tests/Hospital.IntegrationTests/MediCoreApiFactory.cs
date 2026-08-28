using Hospital.Application.Features.Auth.Commands;
using Hospital.Infrastructure.MongoDb;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using MongoDB.Driver;
using Testcontainers.MongoDb;
using Xunit;

namespace Hospital.IntegrationTests;

public class MediCoreApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly MongoDbContainer _mongo = new MongoDbBuilder().Build();

    public IMongoDatabase Database { get; private set; } = null!;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting("https_port", "5001");
        builder.UseSetting("Cors:AllowedOrigins:0", "http://localhost:5173");

        builder.ConfigureServices(services =>
        {
            services.Configure<MongoDbSettings>(settings =>
            {
                settings.ConnectionString = _mongo.GetConnectionString();
                settings.DatabaseName = "MediCoreTestDb";
            });

            services.Configure<JwtSettings>(settings =>
            {
                settings.Secret = "IntegrationTestSecretKey_AtLeast32Chars_0123456789";
                settings.Issuer = "MediCoreTest";
                settings.Audience = "MediCoreTestClients";
                settings.ExpirationMinutes = 60;
            });
        });
    }

    public async Task InitializeAsync()
    {
        await _mongo.StartAsync();
        var client = new MongoClient(_mongo.GetConnectionString());
        Database = client.GetDatabase("MediCoreTestDb");
    }

    public new async Task DisposeAsync()
    {
        await base.DisposeAsync();
        await _mongo.DisposeAsync();
    }
}

[CollectionDefinition("MediCore")]
public class MediCoreCollection : ICollectionFixture<MediCoreApiFactory>
{
}
