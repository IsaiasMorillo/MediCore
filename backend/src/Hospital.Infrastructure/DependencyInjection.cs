using Hospital.Application.Features.Laboratory;
using Hospital.Application.Interfaces;
using Hospital.Domain.Interfaces;
using Hospital.Infrastructure.Authentication;
using Hospital.Infrastructure.MongoDb;
using Hospital.Infrastructure.MongoDb.Repositories;
using Hospital.Infrastructure.Security;
using Hospital.Infrastructure.Services;
using Microsoft.Extensions.DependencyInjection;

namespace Hospital.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services)
    {
        services.AddSingleton<IMongoDbContext, MongoDbContext>();

        services.AddScoped(typeof(IRepository<>), typeof(GenericRepository<>));
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IPatientRepository, PatientRepository>();
        services.AddScoped<IDoctorRepository, DoctorRepository>();
        services.AddScoped<IAppointmentRepository, AppointmentRepository>();
        services.AddScoped<IMedicalRecordRepository, MedicalRecordRepository>();
        services.AddScoped<ILaboratoryOrderRepository, LaboratoryOrderRepository>();
        services.AddScoped<IMedicationRepository, MedicationRepository>();
        services.AddScoped<IPrescriptionRepository, PrescriptionRepository>();
        services.AddScoped<IInvoiceRepository, InvoiceRepository>();
        services.AddScoped<IReportRepository, ReportRepository>();
        services.AddScoped<IVitalsRepository, VitalsRepository>();

        services.AddScoped<ILaboratoryOrderFactory, LaboratoryOrderFactory>();

        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddSingleton<ITokenGenerator, JwtTokenGenerator>();
        services.AddSingleton<IEmailSender, SmtpEmailSender>();
        services.AddScoped<IReminderProcessor, AppointmentReminderProcessor>();
        services.AddHostedService<AppointmentReminderHostedService>();
        services.AddScoped<UserSeeder>();

        return services;
    }
}