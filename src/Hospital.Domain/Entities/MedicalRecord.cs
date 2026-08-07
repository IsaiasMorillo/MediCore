using Hospital.Domain.Common;

namespace Hospital.Domain.Entities;

public class MedicalRecord : Entity
{
    public string PatientId { get; set; } = string.Empty;

    public string DoctorId { get; set; } = string.Empty;

    public string? AppointmentId { get; set; }

    public DateTime ConsultationDate { get; set; }

    public VitalSigns VitalSigns { get; set; } = new();

    public string Diagnosis { get; set; } = string.Empty;

    public string Observations { get; set; } = string.Empty;

    public string TreatmentPlan { get; set; } = string.Empty;

    public List<string> PrescriptionIds { get; set; } = [];

    public List<string> LaboratoryOrderIds { get; set; } = [];

    public bool IsImmutable { get; set; } = true;
}

public class VitalSigns
{
    public string BloodPressure { get; set; } = string.Empty;

    public int? HeartRate { get; set; }

    public double? Temperature { get; set; }

    public double? WeightKg { get; set; }
}