using FluentAssertions;
using Hospital.Application.Features.Appointments;
using Hospital.Application.Features.Appointments.Queries;
using Hospital.Domain.Entities;
using Hospital.Domain.Enums;
using Hospital.Domain.Interfaces;
using Moq;

namespace Hospital.UnitTests.Application;

public class GetGlobalAvailabilityQueryHandlerTests
{
    private static Doctor Doctor(string id, string firstName, DayOfWeek? day = null) => new()
    {
        Id = id,
        FirstName = firstName,
        LastName = "Médico",
        Specialty = "Medicina General",
        IsActive = true,
        Schedule = day is null
            ? []
            : [new AvailabilityShift { Day = day.Value, StartTime = new TimeOnly(8, 0), EndTime = new TimeOnly(11, 0) }]
    };

    private static DateOnly Monday() => DateOnly.FromDateTime(new DateTime(2026, 8, 10));

    private static Mock<IAppointmentRepository> Appointments(params Appointment[] appointments)
    {
        var mock = new Mock<IAppointmentRepository>();
        mock.Setup(r => r.FindAsync(
                It.IsAny<System.Linq.Expressions.Expression<Func<Appointment, bool>>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(appointments);
        return mock;
    }

    [Fact]
    public async Task ReturnsActiveDoctorsWithFreeSlots()
    {
        var doctorRepository = new Mock<IDoctorRepository>();
        doctorRepository.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                Doctor("doc-1", "Ana", DayOfWeek.Monday),
                Doctor("doc-2", "Bruno", DayOfWeek.Tuesday)
            ]);
        var handler = new GetGlobalAvailabilityQueryHandler(
            doctorRepository.Object, Appointments().Object);

        var result = await handler.Handle(new GetGlobalAvailabilityQuery(Monday()), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().HaveCount(2);
        result.Value.Should().BeInAscendingOrder(d => d.DoctorName);
        var ana = result.Value!.First(d => d.DoctorId == "doc-1");
        ana.FreeSlots.Should().HaveCount(6);
        ana.FreeSlots.First().TimeOfDay.Should().Be(new TimeSpan(8, 0, 0));
        result.Value.First(d => d.DoctorId == "doc-2").FreeSlots.Should().BeEmpty();
    }

    [Fact]
    public async Task CancelledAppointments_DoNotConsumeSlots()
    {
        var doctorRepository = new Mock<IDoctorRepository>();
        doctorRepository.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync([Doctor("doc-1", "Ana", DayOfWeek.Monday)]);
        var monday = Monday();
        var handler = new GetGlobalAvailabilityQueryHandler(
            doctorRepository.Object,
            Appointments(new Appointment
            {
                DoctorId = "doc-1",
                Status = AppointmentStatus.Cancelled,
                StartDateTime = monday.ToDateTime(new TimeOnly(8, 0), DateTimeKind.Utc),
                EndDateTime = monday.ToDateTime(new TimeOnly(8, 30), DateTimeKind.Utc)
            }).Object);

        var result = await handler.Handle(new GetGlobalAvailabilityQuery(monday), CancellationToken.None);

        result.Value!.Single().FreeSlots.Should().HaveCount(6);
    }

    [Fact]
    public async Task ActiveAppointment_RemovesItsSlot()
    {
        var doctorRepository = new Mock<IDoctorRepository>();
        doctorRepository.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync([Doctor("doc-1", "Ana", DayOfWeek.Monday)]);
        var monday = Monday();
        var handler = new GetGlobalAvailabilityQueryHandler(
            doctorRepository.Object,
            Appointments(new Appointment
            {
                DoctorId = "doc-1",
                Status = AppointmentStatus.Confirmed,
                StartDateTime = monday.ToDateTime(new TimeOnly(8, 0), DateTimeKind.Utc),
                EndDateTime = monday.ToDateTime(new TimeOnly(8, 30), DateTimeKind.Utc)
            }).Object);

        var result = await handler.Handle(new GetGlobalAvailabilityQuery(monday), CancellationToken.None);

        result.Value!.Single().FreeSlots.Should().HaveCount(5);
        result.Value.Single().FreeSlots.Should().NotContain(monday.ToDateTime(new TimeOnly(8, 0), DateTimeKind.Utc));
    }

    [Fact]
    public async Task InactiveDoctors_AreExcluded()
    {
        var doctorRepository = new Mock<IDoctorRepository>();
        var inactive = Doctor("doc-9", "Zoe", DayOfWeek.Monday);
        inactive.IsActive = false;
        doctorRepository.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync([inactive, Doctor("doc-1", "Ana", DayOfWeek.Monday)]);
        var handler = new GetGlobalAvailabilityQueryHandler(
            doctorRepository.Object, Appointments().Object);

        var result = await handler.Handle(new GetGlobalAvailabilityQuery(Monday()), CancellationToken.None);

        result.Value.Should().ContainSingle(d => d.DoctorId == "doc-1");
    }

    [Fact]
    public async Task NoDoctors_ReturnsEmptyList()
    {
        var doctorRepository = new Mock<IDoctorRepository>();
        doctorRepository.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        var handler = new GetGlobalAvailabilityQueryHandler(
            doctorRepository.Object, Appointments().Object);

        var result = await handler.Handle(new GetGlobalAvailabilityQuery(Monday()), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().BeEmpty();
    }
}