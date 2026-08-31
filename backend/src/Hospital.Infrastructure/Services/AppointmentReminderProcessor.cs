using Hospital.Application.Interfaces;
using Hospital.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace Hospital.Infrastructure.Services;

public class AppointmentReminderProcessor(
    IAppointmentRepository appointmentRepository,
    IUserRepository userRepository,
    IEmailSender emailSender,
    ILogger<AppointmentReminderProcessor> logger) : IReminderProcessor
{
    public async Task<int> ProcessPendingAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var upcoming = await appointmentRepository.GetPendingReminderAppointmentsAsync(now, now.AddHours(24), cancellationToken);
        if (upcoming.Count == 0)
        {
            return 0;
        }

        var sent = 0;
        foreach (var appointment in upcoming)
        {
            var user = await userRepository.FindAsync(u => u.PatientId == appointment.PatientId, cancellationToken);
            if (user.FirstOrDefault() is not { } account)
            {
                continue;
            }

            await emailSender.SendAsync(
                account.Email,
                "Recordatorio de cita - MediCore",
                $"Estimado(a) {account.FullName}: le recordamos su cita del " +
                $"{appointment.StartDateTime:dd/MM/yyyy} a las {appointment.StartDateTime:HH:mm}. " +
                "Si no puede asistir, por favor contacte al centro.",
                cancellationToken);

            appointment.ReminderSentAt = DateTime.UtcNow;
            await appointmentRepository.UpdateAsync(appointment, cancellationToken);
            sent++;
        }

        logger.LogInformation("Recordatorios de citas enviados: {Count}", sent);
        return sent;
    }
}