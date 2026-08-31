using FluentAssertions;
using Hospital.Application.Interfaces;
using Hospital.Domain.Entities;
using Hospital.Domain.Enums;
using Hospital.Domain.Interfaces;
using Hospital.Infrastructure.Services;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace Hospital.UnitTests.Application;

public class AppointmentReminderProcessorTests
{
    private static Appointment Appointment(string id, string patientId, DateTime start) => new()
    {
        Id = id,
        PatientId = patientId,
        DoctorId = "doc-1",
        StartDateTime = start,
        EndDateTime = start.AddMinutes(30),
        Status = AppointmentStatus.Scheduled
    };

    [Fact]
    public async Task Process_SendsEmailAndMarksReminderSentForLinkedAccounts()
    {
        var start = DateTime.UtcNow.AddHours(5);
        var pending = new List<Appointment>
        {
            Appointment("a1", "pat-1", start),
            Appointment("a2", "pat-2", start.AddHours(1))
        };

        var appointmentRepository = new Mock<IAppointmentRepository>();
        appointmentRepository.Setup(r => r.GetPendingReminderAppointmentsAsync(
                It.IsAny<DateTime>(), It.IsAny<DateTime>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(pending);

        var userRepository = new Mock<IUserRepository>();
        userRepository.Setup(r => r.FindAsync(
                It.IsAny<System.Linq.Expressions.Expression<Func<User, bool>>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([new User { Email = "paciente@correo.do", FullName = "Petronila", PatientId = "pat-1" }]);

        var emailSender = new Mock<IEmailSender>();

        var processor = new AppointmentReminderProcessor(
            appointmentRepository.Object,
            userRepository.Object,
            emailSender.Object,
            NullLogger<AppointmentReminderProcessor>.Instance);

        var count = await processor.ProcessPendingAsync(CancellationToken.None);

        count.Should().Be(2);
        emailSender.Verify(s => s.SendAsync(
            "paciente@correo.do",
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<CancellationToken>()), Times.Exactly(2));
        appointmentRepository.Verify(r => r.UpdateAsync(It.Is<Appointment>(a =>
            a.ReminderSentAt.HasValue), It.IsAny<CancellationToken>()), Times.Exactly(2));
    }

    [Fact]
    public async Task Process_PatientWithoutPortalAccount_IsSkipped()
    {
        var start = DateTime.UtcNow.AddHours(5);
        var pending = new List<Appointment> { Appointment("a1", "pat-1", start) };

        var appointmentRepository = new Mock<IAppointmentRepository>();
        appointmentRepository.Setup(r => r.GetPendingReminderAppointmentsAsync(
                It.IsAny<DateTime>(), It.IsAny<DateTime>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(pending);

        var userRepository = new Mock<IUserRepository>();
        userRepository.Setup(r => r.FindAsync(
                It.IsAny<System.Linq.Expressions.Expression<Func<User, bool>>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        var emailSender = new Mock<IEmailSender>();

        var processor = new AppointmentReminderProcessor(
            appointmentRepository.Object,
            userRepository.Object,
            emailSender.Object,
            NullLogger<AppointmentReminderProcessor>.Instance);

        var count = await processor.ProcessPendingAsync(CancellationToken.None);

        count.Should().Be(0);
        emailSender.Verify(s => s.SendAsync(
            It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
        appointmentRepository.Verify(r => r.UpdateAsync(
            It.IsAny<Appointment>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Process_NoPendingAppointments_ReturnsZero()
    {
        var appointmentRepository = new Mock<IAppointmentRepository>();
        appointmentRepository.Setup(r => r.GetPendingReminderAppointmentsAsync(
                It.IsAny<DateTime>(), It.IsAny<DateTime>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        var processor = new AppointmentReminderProcessor(
            appointmentRepository.Object,
            new Mock<IUserRepository>().Object,
            new Mock<IEmailSender>().Object,
            NullLogger<AppointmentReminderProcessor>.Instance);

        var count = await processor.ProcessPendingAsync(CancellationToken.None);

        count.Should().Be(0);
    }
}