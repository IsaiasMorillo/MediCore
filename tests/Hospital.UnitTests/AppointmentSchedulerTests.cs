using FluentAssertions;
using Hospital.Application.Services;
using Hospital.Domain.Entities;
using Hospital.Domain.Enums;

namespace Hospital.UnitTests.Application;

public class AppointmentSchedulerTests
{
    private static Doctor CreateDoctor(DayOfWeek day, TimeOnly start, TimeOnly end)
    {
        return new Doctor
        {
            FirstName = "Dr.",
            LastName = "Prueba",
            Specialty = "Cardiología",
            Schedule = [new AvailabilityShift { Day = day, StartTime = start, EndTime = end }]
        };
    }

    private static DateOnly NextDate(DayOfWeek day)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var days = ((int)day - (int)today.DayOfWeek + 7) % 7;
        return today.AddDays(days == 0 ? 7 : days);
    }

    [Fact]
    public void ComputeFreeSlots_WithNoAppointments_ReturnsAllThirtyMinuteSlots()
    {
        var date = NextDate(DayOfWeek.Monday);
        var doctor = CreateDoctor(DayOfWeek.Monday, new TimeOnly(9, 0), new TimeOnly(10, 0));

        var free = AppointmentScheduler.ComputeFreeSlots(doctor, [], date);

        free.Should().HaveCount(2);
        free[0].Should().Be(date.ToDateTime(new TimeOnly(9, 0), DateTimeKind.Utc));
        free[1].Should().Be(date.ToDateTime(new TimeOnly(9, 30), DateTimeKind.Utc));
    }

    [Fact]
    public void ComputeFreeSlots_WithOccupiedSlot_ExcludesIt()
    {
        var date = NextDate(DayOfWeek.Monday);
        var doctor = CreateDoctor(DayOfWeek.Monday, new TimeOnly(9, 0), new TimeOnly(10, 0));
        var occupied = new Appointment
        {
            DoctorId = doctor.Id,
            StartDateTime = date.ToDateTime(new TimeOnly(9, 0), DateTimeKind.Utc),
            EndDateTime = date.ToDateTime(new TimeOnly(9, 30), DateTimeKind.Utc),
            DurationMinutes = 30,
            Status = AppointmentStatus.Scheduled
        };

        var free = AppointmentScheduler.ComputeFreeSlots(doctor, [occupied], date);

        free.Should().HaveCount(1);
        free.Should().NotContain(date.ToDateTime(new TimeOnly(9, 0), DateTimeKind.Utc));
        free.Should().Contain(date.ToDateTime(new TimeOnly(9, 30), DateTimeKind.Utc));
    }

    [Fact]
    public void ComputeFreeSlots_CancelledAppointmentDoesNotBlockSlot()
    {
        var date = NextDate(DayOfWeek.Monday);
        var doctor = CreateDoctor(DayOfWeek.Monday, new TimeOnly(9, 0), new TimeOnly(10, 0));
        var cancelled = new Appointment
        {
            DoctorId = doctor.Id,
            StartDateTime = date.ToDateTime(new TimeOnly(9, 0), DateTimeKind.Utc),
            EndDateTime = date.ToDateTime(new TimeOnly(9, 30), DateTimeKind.Utc),
            DurationMinutes = 30,
            Status = AppointmentStatus.Cancelled
        };

        var free = AppointmentScheduler.ComputeFreeSlots(doctor, [cancelled], date);

        free.Should().HaveCount(2);
    }

    [Fact]
    public void ComputeFreeSlots_WhenDoctorDoesNotWorkThatDay_ReturnsEmpty()
    {
        var date = NextDate(DayOfWeek.Saturday);
        var doctor = CreateDoctor(DayOfWeek.Monday, new TimeOnly(9, 0), new TimeOnly(10, 0));

        var free = AppointmentScheduler.ComputeFreeSlots(doctor, [], date);

        free.Should().BeEmpty();
    }

    [Fact]
    public void IsAvailable_OutsideSchedule_ReturnsFalse()
    {
        var date = NextDate(DayOfWeek.Monday);
        var doctor = CreateDoctor(DayOfWeek.Monday, new TimeOnly(9, 0), new TimeOnly(17, 0));

        var result = AppointmentScheduler.IsAvailable(
            doctor, [],
            date.ToDateTime(new TimeOnly(17, 30), DateTimeKind.Utc),
            30);

        result.Should().BeFalse();
    }

    [Fact]
    public void IsAvailable_WithinSchedule_ReturnsTrue()
    {
        var date = NextDate(DayOfWeek.Monday);
        var doctor = CreateDoctor(DayOfWeek.Monday, new TimeOnly(9, 0), new TimeOnly(17, 0));

        var result = AppointmentScheduler.IsAvailable(
            doctor, [],
            date.ToDateTime(new TimeOnly(10, 0), DateTimeKind.Utc),
            30);

        result.Should().BeTrue();
    }

    [Fact]
    public void IsAvailable_WithOverlappingAppointment_ReturnsFalse()
    {
        var date = NextDate(DayOfWeek.Monday);
        var doctor = CreateDoctor(DayOfWeek.Monday, new TimeOnly(9, 0), new TimeOnly(17, 0));
        var existing = new Appointment
        {
            StartDateTime = date.ToDateTime(new TimeOnly(10, 0), DateTimeKind.Utc),
            EndDateTime = date.ToDateTime(new TimeOnly(10, 30), DateTimeKind.Utc),
            DurationMinutes = 30
        };

        var result = AppointmentScheduler.IsAvailable(
            doctor, [existing],
            date.ToDateTime(new TimeOnly(10, 15), DateTimeKind.Utc),
            30);

        result.Should().BeFalse();
    }
}