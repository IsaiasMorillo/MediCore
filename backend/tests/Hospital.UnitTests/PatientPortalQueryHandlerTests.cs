using FluentAssertions;
using Hospital.Application.Features.PatientPortal.Queries;
using Hospital.Domain.Entities;
using Hospital.Domain.Enums;
using Hospital.Domain.Interfaces;
using Moq;

namespace Hospital.UnitTests.Application;

public class PatientPortalQueryHandlerTests
{
    private static readonly Doctor Doctor = new()
    {
        Id = "doc-1",
        FirstName = "Herminia",
        LastName = "Médico",
        Specialty = "Medicina General"
    };

    private static readonly Medication Medication = new() { Id = "med-1", Name = "Amoxicilina 500mg" };

    private static Appointment Appointment(string id, DateTime start, AppointmentStatus status) => new()
    {
        Id = id,
        PatientId = "pat-1",
        DoctorId = Doctor.Id,
        StartDateTime = start,
        EndDateTime = start.AddMinutes(30),
        Status = status,
        Notes = "Control"
    };

    [Fact]
    public async Task Upcoming_ReturnsOnlyFutureActiveSortedByStart()
    {
        var now = DateTime.UtcNow;
        var appointments = new List<Appointment>
        {
            Appointment("cancelled", now.AddDays(2), AppointmentStatus.Cancelled),
            Appointment("past", now.AddDays(-1), AppointmentStatus.Scheduled),
            Appointment("later", now.AddDays(3), AppointmentStatus.Confirmed),
            Appointment("soon", now.AddDays(1), AppointmentStatus.Scheduled)
        };

        var appointmentRepository = new Mock<IAppointmentRepository>();
        appointmentRepository.Setup(r => r.FindAsync(
            It.IsAny<System.Linq.Expressions.Expression<Func<Appointment, bool>>>(),
            It.IsAny<CancellationToken>())).ReturnsAsync(appointments);

        var doctorRepository = new Mock<IDoctorRepository>();
        doctorRepository.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync([Doctor]);

        var handler = new GetUpcomingAppointmentsQueryHandler(
            appointmentRepository.Object, doctorRepository.Object);

        var result = await handler.Handle(new GetUpcomingAppointmentsQuery("pat-1"), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value!.Select(a => a.Id).Should().Equal("soon", "later");
        result.Value.First().DoctorName.Should().Be("Herminia Médico");
        result.Value.First().Specialty.Should().Be("Medicina General");
        result.Value.First().Status.Should().Be(AppointmentStatus.Scheduled);
    }

    [Fact]
    public async Task Upcoming_NoAppointments_ReturnsEmpty()
    {
        var appointmentRepository = new Mock<IAppointmentRepository>();
        appointmentRepository.Setup(r => r.FindAsync(
            It.IsAny<System.Linq.Expressions.Expression<Func<Appointment, bool>>>(),
            It.IsAny<CancellationToken>())).ReturnsAsync([]);

        var handler = new GetUpcomingAppointmentsQueryHandler(
            appointmentRepository.Object, new Mock<IDoctorRepository>().Object);

        var result = await handler.Handle(new GetUpcomingAppointmentsQuery("pat-1"), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().BeEmpty();
    }

    [Fact]
    public async Task Upcoming_UnknownDoctor_UsesFallbackName()
    {
        var now = DateTime.UtcNow;
        var appointmentRepository = new Mock<IAppointmentRepository>();
        appointmentRepository.Setup(r => r.FindAsync(
            It.IsAny<System.Linq.Expressions.Expression<Func<Appointment, bool>>>(),
            It.IsAny<CancellationToken>())).ReturnsAsync([Appointment("a1", now.AddDays(1), AppointmentStatus.Scheduled)]);
        var doctorRepository = new Mock<IDoctorRepository>();
        doctorRepository.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync([]);

        var handler = new GetUpcomingAppointmentsQueryHandler(
            appointmentRepository.Object, doctorRepository.Object);

        var result = await handler.Handle(new GetUpcomingAppointmentsQuery("pat-1"), CancellationToken.None);

        result.Value!.Single().DoctorName.Should().Be("Profesional de salud");
    }

    [Fact]
    public async Task ActivePrescriptions_ReturnsOnlyEmitidaWithNames()
    {
        var prescriptions = new List<Prescription>
        {
            new()
            {
                Id = "rx-1",
                PatientId = "pat-1",
                DoctorId = Doctor.Id,
                MedicationId = "med-1",
                Dosage = "1 tableta diaria",
                Quantity = 10,
                Status = PrescriptionStatus.Emitida,
                CreatedAt = new DateTime(2026, 1, 2)
            },
            new()
            {
                Id = "rx-disp",
                PatientId = "pat-1",
                DoctorId = Doctor.Id,
                MedicationId = "med-1",
                Status = PrescriptionStatus.Despachada,
                CreatedAt = new DateTime(2026, 1, 3)
            }
        };

        var prescriptionRepository = new Mock<IPrescriptionRepository>();
        prescriptionRepository.Setup(r => r.GetByPatientAsync("pat-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(prescriptions);

        var medicationRepository = new Mock<IMedicationRepository>();
        medicationRepository.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync([Medication]);

        var doctorRepository = new Mock<IDoctorRepository>();
        doctorRepository.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync([Doctor]);

        var handler = new GetActivePrescriptionsQueryHandler(
            prescriptionRepository.Object, medicationRepository.Object, doctorRepository.Object);

        var result = await handler.Handle(new GetActivePrescriptionsQuery("pat-1"), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        var rx = result.Value!.Single();
        rx.Id.Should().Be("rx-1");
        rx.MedicationName.Should().Be("Amoxicilina 500mg");
        rx.DoctorName.Should().Be("Herminia Médico");
        rx.Quantity.Should().Be(10);
    }

    [Fact]
    public async Task ActivePrescriptions_None_ReturnsEmpty()
    {
        var prescriptionRepository = new Mock<IPrescriptionRepository>();
        prescriptionRepository.Setup(r => r.GetByPatientAsync("pat-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        var handler = new GetActivePrescriptionsQueryHandler(
            prescriptionRepository.Object,
            new Mock<IMedicationRepository>().Object,
            new Mock<IDoctorRepository>().Object);

        var result = await handler.Handle(new GetActivePrescriptionsQuery("pat-1"), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().BeEmpty();
    }
}