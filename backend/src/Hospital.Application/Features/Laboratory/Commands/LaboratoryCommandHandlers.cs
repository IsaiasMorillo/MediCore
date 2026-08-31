using System.Text.Json;
using Hospital.Application.Features.Laboratory.Queries;
using Hospital.Domain.Common;
using Hospital.Domain.Entities;
using Hospital.Domain.Enums;
using Hospital.Domain.Interfaces;
using MediatR;

namespace Hospital.Application.Features.Laboratory.Commands;

public class CreateLaboratoryOrderCommandHandler(
    IPatientRepository patientRepository,
    IDoctorRepository doctorRepository,
    IMedicalRecordRepository medicalRecordRepository,
    ILaboratoryOrderRepository laboratoryOrderRepository,
    ILaboratoryOrderFactory factory) : IRequestHandler<CreateLaboratoryOrderCommand, Result<string>>
{
    public async Task<Result<string>> Handle(CreateLaboratoryOrderCommand command, CancellationToken cancellationToken)
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

        if (!string.IsNullOrWhiteSpace(command.MedicalRecordId))
        {
            var record = await medicalRecordRepository.GetByIdAsync(command.MedicalRecordId, cancellationToken);
            if (record is null)
            {
                return Result.Failure<string>("Registro clínico no encontrado.", ErrorType.NotFound);
            }
        }

        var validationError = factory.Validate(command.TestType);
        if (validationError != string.Empty)
        {
            return Result.Failure<string>(validationError);
        }

        var order = new LaboratoryOrder
        {
            PatientId = command.PatientId,
            DoctorId = command.DoctorId,
            MedicalRecordId = command.MedicalRecordId,
            TestType = command.TestType,
            RequestedAt = DateTime.UtcNow
        };

        await laboratoryOrderRepository.AddAsync(order, cancellationToken);
        return Result.Success(order.Id);
    }
}

public class LoadLaboratoryResultsCommandHandler(
    ILaboratoryOrderRepository laboratoryOrderRepository) : IRequestHandler<LoadLaboratoryResultsCommand, Result<Unit>>
{
    public async Task<Result<Unit>> Handle(LoadLaboratoryResultsCommand command, CancellationToken cancellationToken)
    {
        var order = await laboratoryOrderRepository.GetByIdAsync(command.OrderId, cancellationToken);
        if (order is null)
        {
            return Result.Failure<Unit>("Orden de laboratorio no encontrada.", ErrorType.NotFound);
        }

        if (order.Status == LaboratoryOrderStatus.ResultadoCargado)
        {
            return Result.Failure<Unit>("La orden ya tiene resultados cargados.", ErrorType.Conflict);
        }

        if (command.Results is null || command.Results.Count == 0)
        {
            return Result.Failure<Unit>("Debe proporcionar al menos un resultado.");
        }

        order.Results = command.Results.ToDictionary(pair => pair.Key, pair => ToBson(pair.Value));
        order.Status = LaboratoryOrderStatus.ResultadoCargado;
        order.ResultsLoadedAt = DateTime.UtcNow;
        order.UpdatedAt = DateTime.UtcNow;

        await laboratoryOrderRepository.UpdateAsync(order, cancellationToken);
        return Result.Success(Unit.Value);
    }
private static object? ToBson(object? value)
    {
        return value switch
        {
            JsonElement element => FromJsonElement(element),
            _ => value
        };
    }

    private static object? FromJsonElement(JsonElement element)
    {
        switch (element.ValueKind)
        {
            case JsonValueKind.Null:
                return null;
            case JsonValueKind.String:
                return element.GetString();
            case JsonValueKind.True:
            case JsonValueKind.False:
                return element.GetBoolean();
            case JsonValueKind.Number:
                return element.TryGetInt32(out var intValue) ? intValue
                    : element.TryGetDouble(out var doubleValue) ? doubleValue
                    : (object?)null;
            case JsonValueKind.Array:
                return element.EnumerateArray().Select(FromJsonElement).ToList();
            case JsonValueKind.Object:
                return element.EnumerateObject()
                    .ToDictionary(property => property.Name, property => FromJsonElement(property.Value));
            default:
                return null;
        }
    }
}

public class GetLaboratoryOrderQueryHandler(ILaboratoryOrderRepository laboratoryOrderRepository)
    : IRequestHandler<GetLaboratoryOrderQuery, Result<LaboratoryOrderResponse>>
{
    public async Task<Result<LaboratoryOrderResponse>> Handle(
        GetLaboratoryOrderQuery query,
        CancellationToken cancellationToken)
    {
        var order = await laboratoryOrderRepository.GetByIdAsync(query.Id, cancellationToken);
        if (order is null)
        {
            return Result.Failure<LaboratoryOrderResponse>("Orden de laboratorio no encontrada.", ErrorType.NotFound);
        }

        return Result.Success(ToResponse(order));
    }

    internal static LaboratoryOrderResponse ToResponse(LaboratoryOrder order) => new(
        order.Id,
        order.PatientId,
        order.DoctorId,
        order.MedicalRecordId,
        order.TestType,
        order.Status,
        order.RequestedAt,
        order.Results,
        order.ResultsLoadedAt);
}

public class GetPatientLaboratoryOrdersQueryHandler(ILaboratoryOrderRepository laboratoryOrderRepository)
    : IRequestHandler<GetPatientLaboratoryOrdersQuery, Result<IReadOnlyList<LaboratoryOrderResponse>>>
{
    public async Task<Result<IReadOnlyList<LaboratoryOrderResponse>>> Handle(
        GetPatientLaboratoryOrdersQuery query,
        CancellationToken cancellationToken)
    {
        var orders = await laboratoryOrderRepository.GetByPatientAsync(query.PatientId, cancellationToken);
        return Result.Success(
            (IReadOnlyList<LaboratoryOrderResponse>)orders.Select(GetLaboratoryOrderQueryHandler.ToResponse).ToList());
    }
}