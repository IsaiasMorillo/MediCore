namespace Hospital.Domain.Enums;

public enum InvoiceStatus
{
    Pendiente,
    Pagada,
    Anulada
}

public enum PaymentMethod
{
    Efectivo,
    EFTPOS,
    Transferencia
}

public enum InvoiceItemType
{
    Consulta,
    Examen,
    Medicamento
}

public enum CoverageType
{
    SinSeguro,
    Basica,
    Premium
}