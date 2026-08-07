using Hospital.Domain.Common;
using Hospital.Domain.Enums;

namespace Hospital.Domain.Entities;

public class Appointment : Entity
{
    public string PatientId { get; set; } = string.Empty;

    public string DoctorId { get; set; } = string.Empty;

    public DateTime StartDateTime { get; set; }

    public DateTime EndDateTime { get; set; }

    public int DurationMinutes { get; set; } = 30;

    public AppointmentStatus Status { get; set; } = AppointmentStatus.Scheduled;

    public string Notes { get; set; } = string.Empty;

    public DateTime? ReminderSentAt { get; set; }
}