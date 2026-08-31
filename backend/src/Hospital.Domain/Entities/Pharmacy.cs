using Hospital.Domain.Common;
using Hospital.Domain.Enums;

namespace Hospital.Domain.Entities;

public class Medication : Entity
{
    public string Name { get; set; } = string.Empty;

    public string Code { get; set; } = string.Empty;

    public string Category { get; set; } = string.Empty;

    public int StockQuantity { get; set; }

    public decimal Price { get; set; }

    public DateTime? ExpirationDate { get; set; }

    public int ReorderLevel { get; set; } = 10;

    public bool IsActive { get; set; } = true;
}

public class Prescription : Entity
{
    public string PatientId { get; set; } = string.Empty;

    public string DoctorId { get; set; } = string.Empty;

    public string? MedicalRecordId { get; set; }

    public string MedicationId { get; set; } = string.Empty;

    public string Dosage { get; set; } = string.Empty;

    public string Frequency { get; set; } = string.Empty;

    public int Quantity { get; set; }

    public string Instructions { get; set; } = string.Empty;

    public PrescriptionStatus Status { get; set; } = PrescriptionStatus.Emitida;

    public DateTime? DispensedAt { get; set; }

    public string? DispensedBy { get; set; }
}