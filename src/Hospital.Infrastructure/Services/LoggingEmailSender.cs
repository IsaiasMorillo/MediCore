using Hospital.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace Hospital.Infrastructure.Services;

public class LoggingEmailSender(ILogger<LoggingEmailSender> logger) : IEmailSender
{
    public Task SendAsync(string to, string subject, string body, CancellationToken cancellationToken = default)
    {
        logger.LogInformation("Email simulando envío a {To}: {Subject} | {Body}", to, subject, body);
        return Task.CompletedTask;
    }
}