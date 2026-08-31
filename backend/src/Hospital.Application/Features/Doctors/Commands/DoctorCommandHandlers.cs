using Hospital.Application.Features.Doctors.Queries;
using Hospital.Domain.Common;
using Hospital.Domain.Entities;
using Hospital.Domain.Interfaces;
using MediatR;

namespace Hospital.Application.Features.Doctors.Commands;

public class CreateDoctorCommandHandler(IDoctorRepository doctorRepository)
    : IRequestHandler<CreateDoctorCommand, Result<string>>
{
    public async Task<Result<string>> Handle(CreateDoctorCommand command, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(command.FirstName) || string.IsNullOrWhiteSpace(command.LastName))
        {
            return Result.Failure<string>("El nombre y apellido del médico son obligatorios.");
        }

        if (string.IsNullOrWhiteSpace(command.Specialty))
        {
            return Result.Failure<string>("La especialidad es obligatoria.");
        }

        if (string.IsNullOrWhiteSpace(command.LicenseNumber))
        {
            return Result.Failure<string>("El número de licencia médica es obligatorio.");
        }

        var exists = await doctorRepository.ExistsAsync(
            d => d.LicenseNumber == command.LicenseNumber.Trim(),
            cancellationToken);

        if (exists)
        {
            return Result.Failure<string>("Ya existe un médico con ese número de licencia.", ErrorType.Conflict);
        }

        var validation = ValidateSchedule(command.Schedule);
        if (validation is not null)
        {
            return Result.Failure<string>(validation);
        }

        var doctor = new Doctor
        {
            FirstName = command.FirstName.Trim(),
            LastName = command.LastName.Trim(),
            Specialty = command.Specialty.Trim(),
            LicenseNumber = command.LicenseNumber.Trim(),
            ExperienceYears = command.ExperienceYears,
            Office = command.Office,
            Schedule = command.Schedule ?? []
        };

        await doctorRepository.AddAsync(doctor, cancellationToken);
        return Result.Success(doctor.Id);
    }

    internal static string? ValidateSchedule(List<AvailabilityShift>? schedule)
    {
        if (schedule is null || schedule.Count == 0)
        {
            return "El médico debe tener al menos un turno en su agenda.";
        }

        if (schedule.Any(s => s.StartTime >= s.EndTime))
        {
            return "La hora de inicio de un turno debe ser anterior a la hora de fin.";
        }

        return null;
    }
}

public class UpdateDoctorCommandHandler(IDoctorRepository doctorRepository)
    : IRequestHandler<UpdateDoctorCommand, Result<Unit>>
{
    public async Task<Result<Unit>> Handle(UpdateDoctorCommand command, CancellationToken cancellationToken)
    {
        var doctor = await doctorRepository.GetByIdAsync(command.Id, cancellationToken);
        if (doctor is null)
        {
            return Result.Failure<Unit>("Médico no encontrado.", ErrorType.NotFound);
        }

        var duplicate = await doctorRepository.FirstOrDefaultAsync(
            d => d.LicenseNumber == command.LicenseNumber.Trim() && d.Id != command.Id,
            cancellationToken);

        if (duplicate is not null)
        {
            return Result.Failure<Unit>("Ya existe otro médico con ese número de licencia.", ErrorType.Conflict);
        }

        var validation = CreateDoctorCommandHandler.ValidateSchedule(command.Schedule);
        if (validation is not null)
        {
            return Result.Failure<Unit>(validation);
        }

        doctor.FirstName = command.FirstName.Trim();
        doctor.LastName = command.LastName.Trim();
        doctor.Specialty = command.Specialty.Trim();
        doctor.LicenseNumber = command.LicenseNumber.Trim();
        doctor.ExperienceYears = command.ExperienceYears;
        doctor.Office = command.Office;
        doctor.Schedule = command.Schedule ?? [];
        doctor.IsActive = command.IsActive;

        await doctorRepository.UpdateAsync(doctor, cancellationToken);
        return Result.Success(Unit.Value);
    }
}

public class DeleteDoctorCommandHandler(IDoctorRepository doctorRepository)
    : IRequestHandler<DeleteDoctorCommand, Result<Unit>>
{
    public async Task<Result<Unit>> Handle(DeleteDoctorCommand command, CancellationToken cancellationToken)
    {
        var doctor = await doctorRepository.GetByIdAsync(command.Id, cancellationToken);
        if (doctor is null)
        {
            return Result.Failure<Unit>("Médico no encontrado.", ErrorType.NotFound);
        }

        await doctorRepository.DeleteAsync(command.Id, cancellationToken);
        return Result.Success(Unit.Value);
    }
}

public class GetDoctorQueryHandler(IDoctorRepository doctorRepository)
    : IRequestHandler<GetDoctorQuery, Result<DoctorResponse>>
{
    public async Task<Result<DoctorResponse>> Handle(GetDoctorQuery query, CancellationToken cancellationToken)
    {
        var doctor = await doctorRepository.GetByIdAsync(query.Id, cancellationToken);
        if (doctor is null)
        {
            return Result.Failure<DoctorResponse>("Médico no encontrado.", ErrorType.NotFound);
        }

        return Result.Success(ToResponse(doctor));
    }

    internal static DoctorResponse ToResponse(Doctor doctor) => new(
        doctor.Id,
        doctor.FirstName,
        doctor.LastName,
        doctor.Specialty,
        doctor.LicenseNumber,
        doctor.ExperienceYears,
        doctor.Office,
        doctor.Schedule,
        doctor.IsActive);
}

public class GetDoctorsQueryHandler(IDoctorRepository doctorRepository)
    : IRequestHandler<GetDoctorsQuery, Result<IReadOnlyList<DoctorResponse>>>
{
    public async Task<Result<IReadOnlyList<DoctorResponse>>> Handle(
        GetDoctorsQuery query,
        CancellationToken cancellationToken)
    {
        var doctors = await doctorRepository.SearchAsync(query.Specialty, query.SearchTerm, cancellationToken);
        return Result.Success((IReadOnlyList<DoctorResponse>)doctors.Select(GetDoctorQueryHandler.ToResponse).ToList());
    }
}