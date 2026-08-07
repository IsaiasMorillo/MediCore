using Hospital.Application.Features.Pharmacy.Queries;
using Hospital.Domain.Common;
using Hospital.Domain.Entities;
using MediatR;

namespace Hospital.Application.Features.Pharmacy.Commands;

public record CreateMedicationCommand(
    string Name,
    string Code,
    string Category,
    int StockQuantity,
    decimal Price,
    DateTime? ExpirationDate,
    int ReorderLevel) : IRequest<Result<string>>;

public record UpdateMedicationCommand(
    string Id,
    string Name,
    string Code,
    string Category,
    int StockQuantity,
    decimal Price,
    DateTime? ExpirationDate,
    int ReorderLevel,
    bool IsActive) : IRequest<Result<Unit>>;

public record AdjustStockCommand(string Id, int QuantityChange) : IRequest<Result<MedicationResponse>>;

public record CreatePrescriptionCommand(
    string PatientId,
    string DoctorId,
    string? MedicalRecordId,
    string MedicationId,
    string Dosage,
    string Frequency,
    int Quantity,
    string Instructions) : IRequest<Result<string>>;

public record DispensePrescriptionCommand(string Id, string? DispensedBy) : IRequest<Result<Unit>>;