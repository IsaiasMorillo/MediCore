using Hospital.Application.Features.Pharmacy.Queries;
using Hospital.Domain.Common;
using Hospital.Domain.Entities;
using Hospital.Domain.Enums;
using Hospital.Domain.Interfaces;
using MediatR;

namespace Hospital.Application.Features.Pharmacy.Commands;

public class CreateMedicationCommandHandler(IMedicationRepository medicationRepository)
    : IRequestHandler<CreateMedicationCommand, Result<string>>
{
    public async Task<Result<string>> Handle(CreateMedicationCommand command, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(command.Name) || string.IsNullOrWhiteSpace(command.Code))
        {
            return Result.Failure<string>("El nombre y código del medicamento son obligatorios.");
        }

        if (command.StockQuantity < 0)
        {
            return Result.Failure<string>("La cantidad en stock no puede ser negativa.");
        }

        var exists = await medicationRepository.ExistsAsync(
            m => m.Code == command.Code.Trim().ToUpperInvariant(),
            cancellationToken);

        if (exists)
        {
            return Result.Failure<string>("Ya existe un medicamento con ese código.", ErrorType.Conflict);
        }

        var medication = new Medication
        {
            Name = command.Name.Trim(),
            Code = command.Code.Trim().ToUpperInvariant(),
            Category = command.Category ?? string.Empty,
            StockQuantity = command.StockQuantity,
            Price = command.Price,
            ExpirationDate = command.ExpirationDate,
            ReorderLevel = command.ReorderLevel
        };

        await medicationRepository.AddAsync(medication, cancellationToken);
        return Result.Success(medication.Id);
    }
}

public class UpdateMedicationCommandHandler(IMedicationRepository medicationRepository)
    : IRequestHandler<UpdateMedicationCommand, Result<Unit>>
{
    public async Task<Result<Unit>> Handle(UpdateMedicationCommand command, CancellationToken cancellationToken)
    {
        var medication = await medicationRepository.GetByIdAsync(command.Id, cancellationToken);
        if (medication is null)
        {
            return Result.Failure<Unit>("Medicamento no encontrado.", ErrorType.NotFound);
        }

        medication.Name = command.Name.Trim();
        medication.Code = command.Code.Trim().ToUpperInvariant();
        medication.Category = command.Category;
        medication.StockQuantity = command.StockQuantity;
        medication.Price = command.Price;
        medication.ExpirationDate = command.ExpirationDate;
        medication.ReorderLevel = command.ReorderLevel;
        medication.IsActive = command.IsActive;

        await medicationRepository.UpdateAsync(medication, cancellationToken);
        return Result.Success(Unit.Value);
    }
}

public class AdjustStockCommandHandler(IMedicationRepository medicationRepository)
    : IRequestHandler<AdjustStockCommand, Result<MedicationResponse>>
{
    public async Task<Result<MedicationResponse>> Handle(AdjustStockCommand command, CancellationToken cancellationToken)
    {
        var medication = await medicationRepository.GetByIdAsync(command.Id, cancellationToken);
        if (medication is null)
        {
            return Result.Failure<MedicationResponse>("Medicamento no encontrado.", ErrorType.NotFound);
        }

        var newStock = medication.StockQuantity + command.QuantityChange;
        if (newStock < 0)
        {
            return Result.Failure<MedicationResponse>("El stock no puede quedar negativo.", ErrorType.Conflict);
        }

        medication.StockQuantity = newStock;
        medication.UpdatedAt = DateTime.UtcNow;

        await medicationRepository.UpdateAsync(medication, cancellationToken);
        return Result.Success(ToResponse(medication));
    }

    internal static MedicationResponse ToResponse(Medication medication) => new(
        medication.Id,
        medication.Name,
        medication.Code,
        medication.Category,
        medication.StockQuantity,
        medication.Price,
        medication.ExpirationDate,
        medication.ReorderLevel,
        medication.IsActive);
}

public class CreatePrescriptionCommandHandler(
    IPatientRepository patientRepository,
    IDoctorRepository doctorRepository,
    IMedicationRepository medicationRepository,
    IMedicalRecordRepository medicalRecordRepository,
    IPrescriptionRepository prescriptionRepository) : IRequestHandler<CreatePrescriptionCommand, Result<string>>
{
    public async Task<Result<string>> Handle(CreatePrescriptionCommand command, CancellationToken cancellationToken)
    {
        var patient = await patientRepository.GetByIdAsync(command.PatientId, cancellationToken);
        if (patient is null)
        {
            return Result.Failure<string>("Paciente no encontrado.", ErrorType.NotFound);
        }

        var doctor = await doctorRepository.GetByIdAsync(command.DoctorId, cancellationToken);
        if (doctor is null)
        {
            return Result.Failure<string>("Médico no encontrado.", ErrorType.NotFound);
        }

        var medication = await medicationRepository.GetByIdAsync(command.MedicationId, cancellationToken);
        if (medication is null)
        {
            return Result.Failure<string>("Medicamento no encontrado.", ErrorType.NotFound);
        }

        if (command.Quantity <= 0)
        {
            return Result.Failure<string>("La cantidad recetada debe ser mayor que cero.");
        }

        var prescription = new Prescription
        {
            PatientId = command.PatientId,
            DoctorId = command.DoctorId,
            MedicalRecordId = command.MedicalRecordId,
            MedicationId = command.MedicationId,
            Dosage = command.Dosage ?? string.Empty,
            Frequency = command.Frequency ?? string.Empty,
            Quantity = command.Quantity,
            Instructions = command.Instructions ?? string.Empty
        };

        await prescriptionRepository.AddAsync(prescription, cancellationToken);

        if (!string.IsNullOrWhiteSpace(command.MedicalRecordId))
        {
            var record = await medicalRecordRepository.GetByIdAsync(command.MedicalRecordId, cancellationToken);
            if (record is not null && !record.PrescriptionIds.Contains(prescription.Id))
            {
                record.PrescriptionIds.Add(prescription.Id);
                await medicalRecordRepository.UpdateAsync(record, cancellationToken);
            }
        }

        return Result.Success(prescription.Id);
    }
}

public class DispensePrescriptionCommandHandler(
    IPrescriptionRepository prescriptionRepository,
    IMedicationRepository medicationRepository) : IRequestHandler<DispensePrescriptionCommand, Result<Unit>>
{
    public async Task<Result<Unit>> Handle(DispensePrescriptionCommand command, CancellationToken cancellationToken)
    {
        var prescription = await prescriptionRepository.GetByIdAsync(command.Id, cancellationToken);
        if (prescription is null)
        {
            return Result.Failure<Unit>("Receta no encontrada.", ErrorType.NotFound);
        }

        if (prescription.Status == PrescriptionStatus.Despachada)
        {
            return Result.Failure<Unit>("La receta ya fue despachada.", ErrorType.Conflict);
        }

        if (prescription.Status == PrescriptionStatus.Cancelada)
        {
            return Result.Failure<Unit>("No se puede despachar una receta cancelada.", ErrorType.Conflict);
        }

        var medication = await medicationRepository.GetByIdAsync(prescription.MedicationId, cancellationToken);
        if (medication is null)
        {
            return Result.Failure<Unit>("El medicamento ya no existe en inventario.", ErrorType.NotFound);
        }

        if (medication.StockQuantity < prescription.Quantity)
        {
            return Result.Failure<Unit>(
                $"Stock insuficiente: se requieren {prescription.Quantity} unidades y solo hay {medication.StockQuantity}.",
                ErrorType.Conflict);
        }

        medication.StockQuantity -= prescription.Quantity;
        medication.UpdatedAt = DateTime.UtcNow;
        await medicationRepository.UpdateAsync(medication, cancellationToken);

        prescription.Status = PrescriptionStatus.Despachada;
        prescription.DispensedAt = DateTime.UtcNow;
        prescription.DispensedBy = command.DispensedBy;
        prescription.UpdatedAt = DateTime.UtcNow;
        await prescriptionRepository.UpdateAsync(prescription, cancellationToken);

        return Result.Success(Unit.Value);
    }
}

public class GetMedicationsQueryHandler(IMedicationRepository medicationRepository)
    : IRequestHandler<GetMedicationsQuery, Result<IReadOnlyList<MedicationResponse>>>
{
    public async Task<Result<IReadOnlyList<MedicationResponse>>> Handle(
        GetMedicationsQuery query,
        CancellationToken cancellationToken)
    {
        var medications = await medicationRepository.SearchAsync(query.SearchTerm, cancellationToken);
        return Result.Success(
            (IReadOnlyList<MedicationResponse>)medications.Select(AdjustStockCommandHandler.ToResponse).ToList());
    }
}

public class GetPatientPrescriptionsQueryHandler(
    IPrescriptionRepository prescriptionRepository,
    IMedicationRepository medicationRepository) : IRequestHandler<GetPatientPrescriptionsQuery, Result<IReadOnlyList<PrescriptionResponse>>>
{
    public async Task<Result<IReadOnlyList<PrescriptionResponse>>> Handle(
        GetPatientPrescriptionsQuery query,
        CancellationToken cancellationToken)
    {
        var prescriptions = await prescriptionRepository.GetByPatientAsync(query.PatientId, cancellationToken);
        var medications = await medicationRepository.GetAllAsync(cancellationToken);
        var medicationNames = medications.ToDictionary(m => m.Id, m => m.Name);

        var response = prescriptions.Select(p => new PrescriptionResponse(
            p.Id,
            p.PatientId,
            p.DoctorId,
            p.MedicalRecordId,
            p.MedicationId,
            medicationNames.TryGetValue(p.MedicationId, out var name) ? name : "Desconocido",
            p.Dosage,
            p.Frequency,
            p.Quantity,
            p.Instructions,
            p.Status,
            p.DispensedAt,
            p.DispensedBy)).ToList();

        return Result.Success((IReadOnlyList<PrescriptionResponse>)response);
    }
}