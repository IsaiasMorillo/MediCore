using Hospital.Domain.Common;
using Hospital.Domain.Enums;

namespace Hospital.Domain.Entities;

public class Invoice : Entity
{
    public string Number { get; set; } = string.Empty;

    public string PatientId { get; set; } = string.Empty;

    public string CreatedBy { get; set; } = string.Empty;

    public DateTime InvoiceDate { get; set; } = DateTime.UtcNow;

    public CoverageType CoverageType { get; set; } = CoverageType.SinSeguro;

    public List<InvoiceItem> Items { get; set; } = [];

    public decimal Subtotal { get; set; }

    public decimal InsuranceCoverage { get; set; }

    public decimal Discount { get; set; }

    public decimal Taxes { get; set; }

    public decimal Total { get; set; }

    public InvoiceStatus Status { get; set; } = InvoiceStatus.Pendiente;

    public List<Payment> Payments { get; set; } = [];
}

public class InvoiceItem
{
    public InvoiceItemType Type { get; set; }

    public string Description { get; set; } = string.Empty;

    public int Quantity { get; set; }

    public decimal UnitPrice { get; set; }

    public decimal Subtotal { get; set; }

    public string? AppointmentId { get; set; }

    public string? LaboratoryOrderId { get; set; }

    public string? PrescriptionId { get; set; }
}

public class Payment
{
    public PaymentMethod Method { get; set; }

    public decimal Amount { get; set; }

    public DateTime PaidAt { get; set; } = DateTime.UtcNow;

    public string? PaidBy { get; set; }

    public string? Reference { get; set; }
}