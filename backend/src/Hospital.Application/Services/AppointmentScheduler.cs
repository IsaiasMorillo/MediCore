using Hospital.Domain.Entities;
using Hospital.Domain.Enums;

namespace Hospital.Application.Services;

public static class AppointmentScheduler
{
    public const int DefaultSlotMinutes = 30;

    public static IReadOnlyList<DateTime> ComputeFreeSlots(
        Doctor doctor,
        IReadOnlyList<Appointment> appointments,
        DateOnly date)
    {
        var shifts = doctor.Schedule
            .Where(s => s.Day == date.DayOfWeek)
            .OrderBy(s => s.StartTime)
            .ToList();

        if (shifts.Count == 0)
        {
            return [];
        }

        var freeSlots = new List<DateTime>();
        var active = ActiveAppointments(appointments);

        foreach (var shift in shifts)
        {
            var cursor = date.ToDateTime(shift.StartTime, DateTimeKind.Utc);
            var shiftEnd = date.ToDateTime(shift.EndTime, DateTimeKind.Utc);

            while (cursor + TimeSpan.FromMinutes(DefaultSlotMinutes) <= shiftEnd)
            {
                var slotEnd = cursor + TimeSpan.FromMinutes(DefaultSlotMinutes);
                if (!active.Any(a => Overlaps(a, cursor, slotEnd)))
                {
                    freeSlots.Add(cursor);
                }
                cursor = slotEnd;
            }
        }

        return freeSlots;
    }

    public static bool IsAvailable(
        Doctor doctor,
        IReadOnlyList<Appointment> appointments,
        DateTime start,
        int durationMinutes)
    {
        var end = start.AddMinutes(durationMinutes);
        var shift = doctor.Schedule.FirstOrDefault(s =>
            s.Day == start.DayOfWeek &&
            start.TimeOfDay >= s.StartTime.ToTimeSpan() &&
            end.TimeOfDay <= s.EndTime.ToTimeSpan());

        if (shift is null)
        {
            return false;
        }

        return !ActiveAppointments(appointments).Any(a => Overlaps(a, start, end));
    }

    private static bool Overlaps(Appointment appointment, DateTime start, DateTime end)
    {
        return appointment.StartDateTime < end && appointment.EndDateTime > start;
    }

    private static bool IsActive(Appointment appointment)
    {
        return appointment.Status is not (AppointmentStatus.Cancelled or AppointmentStatus.Completed);
    }

    public static IReadOnlyList<Appointment> ActiveAppointments(IEnumerable<Appointment> appointments)
    {
        return appointments.Where(IsActive).ToList();
    }
}