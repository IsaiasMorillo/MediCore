using Hospital.Domain.Common;

namespace Hospital.Domain.Entities;

public class VitalsRecord : Entity
{
    public string PatientId { get; set; } = string.Empty;

    public string? AppointmentId { get; set; }

    public VitalSigns VitalSigns { get; set; } = new();

    public string Notes { get; set; } = string.Empty;

    public string RecordedBy { get; set; } = string.Empty;

    public DateTime RecordedAt { get; set; } = DateTime.UtcNow;
}