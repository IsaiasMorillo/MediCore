using Hospital.Domain.Common;
using Hospital.Domain.Entities;
using Hospital.Domain.Enums;
using MediatR;

namespace Hospital.Application.Features.Pharmacy.Queries;

public record GetMedicationsQuery(string? SearchTerm = null) : IRequest<Result<IReadOnlyList<MedicationResponse>>>;

public record GetPatientPrescriptionsQuery(string PatientId)
    : IRequest<Result<IReadOnlyList<PrescriptionResponse>>>;

public record MedicationResponse(
    string Id,
    string Name,
    string Code,
    string Category,
    int StockQuantity,
    decimal Price,
    DateTime? ExpirationDate,
    int ReorderLevel,
    bool IsActive);

public record PrescriptionResponse(
    string Id,
    string PatientId,
    string DoctorId,
    string? MedicalRecordId,
    string MedicationId,
    string MedicationName,
    string Dosage,
    string Frequency,
    int Quantity,
    string Instructions,
    PrescriptionStatus Status,
    DateTime? DispensedAt,
    string? DispensedBy);