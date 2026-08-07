using Hospital.Domain.Common;
using Hospital.Domain.Enums;

namespace Hospital.Domain.Entities;

public class LaboratoryOrder : Entity
{
    public string PatientId { get; set; } = string.Empty;

    public string DoctorId { get; set; } = string.Empty;

    public string? MedicalRecordId { get; set; }

    public TestType TestType { get; set; }

    public LaboratoryOrderStatus Status { get; set; } = LaboratoryOrderStatus.SolicitudPendiente;

    public DateTime RequestedAt { get; set; }

    public Dictionary<string, object?>? Results { get; set; }

    public string? SetBy { get; set; }

    public DateTime? ResultsLoadedAt { get; set; }
}