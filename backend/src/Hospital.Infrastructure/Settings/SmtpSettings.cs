namespace Hospital.Infrastructure.Settings;

public class SmtpSettings
{
    public const string SectionName = "SmtpSettings";

    public bool Enabled { get; set; }

    public string Host { get; set; } = string.Empty;

    public int Port { get; set; } = 587;

    public string Username { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    public string FromEmail { get; set; } = string.Empty;

    public string FromName { get; set; } = "MediCore HMS";

    public bool UseSsl { get; set; } = true;
}