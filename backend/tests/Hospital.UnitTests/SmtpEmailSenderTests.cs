using FluentAssertions;
using Hospital.Infrastructure.Services;
using Hospital.Infrastructure.Settings;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace Hospital.UnitTests.Infrastructure;

public class SmtpEmailSenderTests
{
    [Fact]
    public async Task Send_WhenDisabled_DoesNotThrow()
    {
        var sender = new SmtpEmailSender(
            Options.Create(new SmtpSettings { Enabled = false }),
            NullLogger<SmtpEmailSender>.Instance);

        var act = async () => await sender.SendAsync("paciente@correo.do", "Asunto", "Cuerpo");

        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task Send_WhenHostMissing_DoesNotThrow()
    {
        var sender = new SmtpEmailSender(
            Options.Create(new SmtpSettings { Enabled = true, Host = "", FromEmail = "no-reply@medicore.do" }),
            NullLogger<SmtpEmailSender>.Instance);

        var act = async () => await sender.SendAsync("paciente@correo.do", "Asunto", "Cuerpo");

        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task Send_WhenFromMissing_DoesNotThrow()
    {
        var sender = new SmtpEmailSender(
            Options.Create(new SmtpSettings { Enabled = true, Host = "smtp.example.com", FromEmail = "" }),
            NullLogger<SmtpEmailSender>.Instance);

        var act = async () => await sender.SendAsync("paciente@correo.do", "Asunto", "Cuerpo");

        await act.Should().NotThrowAsync();
    }
}