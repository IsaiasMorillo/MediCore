using Hospital.Domain.Common;

namespace Hospital.Domain.Entities;

public class Doctor : Entity
{
    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    public string Specialty { get; set; } = string.Empty;

    public string LicenseNumber { get; set; } = string.Empty;

    public int ExperienceYears { get; set; }

    public string Office { get; set; } = string.Empty;

    public List<AvailabilityShift> Schedule { get; set; } = [];

    public bool IsActive { get; set; } = true;
}

public class AvailabilityShift
{
    public DayOfWeek Day { get; set; }

    public TimeOnly StartTime { get; set; }

    public TimeOnly EndTime { get; set; }
}