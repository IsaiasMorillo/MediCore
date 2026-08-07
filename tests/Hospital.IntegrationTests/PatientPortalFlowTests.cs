using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Hospital.Application.Interfaces;
using Hospital.Domain.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Hospital.IntegrationTests.Features;

[Collection("MediCore")]
public class PatientPortalFlowTests(MediCoreApiFactory factory)
{
    [Fact]
    public async Task UpcomingAppointments_ShowsOnlyOwnWithDoctorName()
    {
        var client = factory.CreateClient();
        var adminToken = await GetTokenAsync(client, "admin@medicore.do", "Admin123!");

        var patientA = await CreatePatientAsync(client, adminToken);
        var patientB = await CreatePatientAsync(client, adminToken);
        await RegisterPortalAccountAsync(client, adminToken, patientA, "portal.a@correo.do");
        await RegisterPortalAccountAsync(client, adminToken, patientB, "portal.b@correo.do");

        var doctorId = await CreateDoctorAsync(client, adminToken, "Herminia");

        var startA = DateTime.UtcNow.AddDays(10).Date.AddHours(9);
        var startB = DateTime.UtcNow.AddDays(10).Date.AddHours(10);
        await CreateAppointmentAsync(client, adminToken, patientA, doctorId, startA);
        await CreateAppointmentAsync(client, adminToken, patientB, doctorId, startB);

        var clientA = factory.CreateClient();
        clientA.DefaultRequestHeaders.Authorization = With(await GetTokenAsync(clientA, "portal.a@correo.do", "ClaveSegura123"));

        var myAppointments = await clientA.GetFromJsonAsync<JsonElement>("/api/patient-portal/upcoming-appointments");
        var items = myAppointments.EnumerateArray().ToList();
        items.Should().HaveCount(1);

        var appointment = items.Single();
        appointment.GetProperty("startDateTime").GetDateTime().Should().Be(startA);
        appointment.GetProperty("doctorName").GetString().Should().Be("Herminia Médico");
        appointment.GetProperty("specialty").GetString().Should().Be("Medicina General");
        appointment.GetProperty("status").GetString().Should().Be("Scheduled");

        var clientB = factory.CreateClient();
        clientB.DefaultRequestHeaders.Authorization = With(await GetTokenAsync(clientB, "portal.b@correo.do", "ClaveSegura123"));

        var otherAppointments = await clientB.GetFromJsonAsync<JsonElement>("/api/patient-portal/upcoming-appointments");
        otherAppointments.EnumerateArray().Single()
            .GetProperty("startDateTime").GetDateTime().Should().Be(startB);
    }

    [Fact]
    public async Task ActivePrescriptions_ShowsOnlyOwnVigentes()
    {
        var client = factory.CreateClient();
        var adminToken = await GetTokenAsync(client, "admin@medicore.do", "Admin123!");

        var medicoEmail = $"medico_{Guid.NewGuid():N}@medicore.do";
        await RegisterUserAsync(client, adminToken, medicoEmail, "Medico");
        var farmaciaEmail = $"farmacia_{Guid.NewGuid():N}@medicore.do";
        await RegisterUserAsync(client, adminToken, farmaciaEmail, "Farmacia");

        var patientA = await CreatePatientAsync(client, adminToken);
        var patientB = await CreatePatientAsync(client, adminToken);
        await RegisterPortalAccountAsync(client, adminToken, patientA, "portal.rx.a@correo.do");
        await RegisterPortalAccountAsync(client, adminToken, patientB, "portal.rx.b@correo.do");

        var doctorId = await CreateDoctorAsync(client, adminToken, "Julio");
        var medicationId = await CreateMedicationAsync(client, await GetTokenAsync(client, farmaciaEmail, "ClaveSegura123"));

        var medicoToken = await GetTokenAsync(client, medicoEmail, "ClaveSegura123");
        var prescriptionA = await CreatePrescriptionAsync(client, medicoToken, patientA, doctorId, medicationId);
        var prescriptionB = await CreatePrescriptionAsync(client, medicoToken, patientB, doctorId, medicationId);

        var clientPharmacy = factory.CreateClient();
        clientPharmacy.DefaultRequestHeaders.Authorization = With(await GetTokenAsync(clientPharmacy, farmaciaEmail, "ClaveSegura123"));
        var dispenseA = await clientPharmacy.PostAsJsonAsync($"/api/pharmacy/prescriptions/{prescriptionA}/dispense",
            new { dispensedBy = "Farmacéutico Turno 1" });
        dispenseA.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var clientA = factory.CreateClient();
        clientA.DefaultRequestHeaders.Authorization = With(await GetTokenAsync(clientA, "portal.rx.a@correo.do", "ClaveSegura123"));
        var myPrescriptions = await clientA.GetFromJsonAsync<JsonElement>("/api/patient-portal/active-prescriptions");
        myPrescriptions.EnumerateArray().Should().BeEmpty();

        var clientB = factory.CreateClient();
        clientB.DefaultRequestHeaders.Authorization = With(await GetTokenAsync(clientB, "portal.rx.b@correo.do", "ClaveSegura123"));
        var otherPrescriptions = await clientB.GetFromJsonAsync<JsonElement>("/api/patient-portal/active-prescriptions");
        var otherItems = otherPrescriptions.EnumerateArray().ToList();
        otherItems.Should().HaveCount(1);
        otherItems.Single().GetProperty("id").GetString().Should().Be(prescriptionB);
    }

    [Fact]
    public async Task ActivePrescriptions_RequiresPortalAccountAndShowsNames()
    {
        var client = factory.CreateClient();
        var adminToken = await GetTokenAsync(client, "admin@medicore.do", "Admin123!");

        var medicoEmail = $"medico_{Guid.NewGuid():N}@medicore.do";
        await RegisterUserAsync(client, adminToken, medicoEmail, "Medico");

        var patientA = await CreatePatientAsync(client, adminToken);
        await RegisterPortalAccountAsync(client, adminToken, patientA, "portal.names@correo.do");

        var doctorId = await CreateDoctorAsync(client, adminToken, "Julio");
        var medicationId = await CreateMedicationAsync(client, adminToken);

        var medicoToken = await GetTokenAsync(client, medicoEmail, "ClaveSegura123");
        await CreatePrescriptionAsync(client, medicoToken, patientA, doctorId, medicationId);

        var clientA = factory.CreateClient();
        clientA.DefaultRequestHeaders.Authorization = With(await GetTokenAsync(clientA, "portal.names@correo.do", "ClaveSegura123"));

        var myPrescriptions = await clientA.GetFromJsonAsync<JsonElement>("/api/patient-portal/active-prescriptions");
        var prescription = myPrescriptions.EnumerateArray().Single();
        prescription.GetProperty("medicationName").GetString().Should().Be("Amoxicilina 500mg");
        prescription.GetProperty("doctorName").GetString().Should().Be("Julio Médico");
        prescription.GetProperty("quantity").GetInt32().Should().Be(5);
        prescription.GetProperty("dosage").GetString().Should().Be("1 tableta cada 8 horas");

        var unauthenticated = factory.CreateClient();
        var forbidden = await unauthenticated.GetAsync("/api/patient-portal/active-prescriptions");
        forbidden.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Reminders_AreMarkedSentForPatientsWithPortalAccount()
    {
        var client = factory.CreateClient();
        var adminToken = await GetTokenAsync(client, "admin@medicore.do", "Admin123!");

        var patient = await CreatePatientAsync(client, adminToken);
        await RegisterPortalAccountAsync(client, adminToken, patient, "portal.reminder@correo.do");
        var doctorId = await CreateDoctorAsync(client, adminToken, "Carlos");

        var start = DateTime.UtcNow.AddHours(2);
        var appointmentId = await CreateAppointmentAsync(client, adminToken, patient, doctorId, start);

        using var scope = factory.Services.CreateScope();
        var processor = scope.ServiceProvider.GetRequiredService<IReminderProcessor>();
        var sent = await processor.ProcessPendingAsync(CancellationToken.None);
        sent.Should().Be(1);

        var repository = scope.ServiceProvider.GetRequiredService<IAppointmentRepository>();
        var appointment = await repository.GetByIdAsync(appointmentId);
        appointment!.ReminderSentAt.Should().NotBeNull();

        var sentAgain = await processor.ProcessPendingAsync(CancellationToken.None);
        sentAgain.Should().Be(0);
    }

    private static System.Net.Http.Headers.AuthenticationHeaderValue With(string token) =>
        new("Bearer", token);

    private static async Task<string> GetTokenAsync(HttpClient client, string email, string password)
    {
        var login = await client.PostAsJsonAsync("/api/auth/login", new { email, password });
        login.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await login.Content.ReadFromJsonAsync<JsonElement>();
        return body.GetProperty("token").GetString()!;
    }

    private async Task RegisterUserAsync(HttpClient client, string adminToken, string email, string role)
    {
        var request = factory.CreateClient();
        request.DefaultRequestHeaders.Authorization = With(adminToken);
        var register = await request.PostAsJsonAsync("/api/auth/register", new
        {
            email,
            fullName = $"Usuario {role}",
            password = "ClaveSegura123",
            roles = new[] { role }
        });
        register.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    private async Task<string> CreatePatientAsync(HttpClient client, string adminToken)
    {
        var request = factory.CreateClient();
        request.DefaultRequestHeaders.Authorization = With(adminToken);
        var createPatient = await request.PostAsJsonAsync("/api/patients", new
        {
            firstName = "Petronila",
            lastName = "Mancebo",
            documentId = $"DOC-{Guid.NewGuid():N}".ToUpper(),
            gender = "Femenino",
            contacts = new[] { new { type = "Phone", value = "829-555-8888" } }
        });
        createPatient.StatusCode.Should().Be(HttpStatusCode.Created);
        return (await createPatient.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString()!;
    }

    private async Task RegisterPortalAccountAsync(HttpClient client, string adminToken, string patientId, string email)
    {
        var request = factory.CreateClient();
        request.DefaultRequestHeaders.Authorization = With(adminToken);
        var register = await request.PostAsJsonAsync("/api/auth/patient-account", new
        {
            patientId,
            email,
            fullName = "Petronila Mancebo",
            password = "ClaveSegura123"
        });
        register.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    private async Task<string> CreateDoctorAsync(HttpClient client, string adminToken, string firstName)
    {
        var request = factory.CreateClient();
        request.DefaultRequestHeaders.Authorization = With(adminToken);
        var schedule = Enumerable.Range(0, 7)
            .Select(day => new { day, startTime = "00:00", endTime = "23:59" })
            .ToArray();
        var createDoctor = await request.PostAsJsonAsync("/api/doctors", new
        {
            firstName,
            lastName = "Médico",
            specialty = "Medicina General",
            licenseNumber = $"LIC-{Guid.NewGuid():N}".ToUpperInvariant(),
            experienceYears = 6,
            office = "Consultorio 108",
            schedule
        });
        createDoctor.StatusCode.Should().Be(HttpStatusCode.Created);
        return (await createDoctor.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString()!;
    }

    private async Task<string> CreateAppointmentAsync(
        HttpClient client, string adminToken, string patientId, string doctorId, DateTime startDateTime)
    {
        var request = factory.CreateClient();
        request.DefaultRequestHeaders.Authorization = With(adminToken);
        var createAppointment = await request.PostAsJsonAsync("/api/appointments", new
        {
            patientId,
            doctorId,
            startDateTime,
            durationMinutes = 30,
            notes = "Consulta de control"
        });
        createAppointment.StatusCode.Should().Be(HttpStatusCode.Created);
        return (await createAppointment.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString()!;
    }

    private async Task<string> CreateMedicationAsync(HttpClient client, string token)
    {
        var request = factory.CreateClient();
        request.DefaultRequestHeaders.Authorization = With(token);
        var createMedication = await request.PostAsJsonAsync("/api/pharmacy/medications", new
        {
            name = "Amoxicilina 500mg",
            code = $"MED-{Guid.NewGuid():N}".ToUpperInvariant(),
            category = "Antibióticos",
            stockQuantity = 100,
            price = 250.00m,
            expirationDate = DateTime.UtcNow.AddYears(1),
            reorderLevel = 10
        });
        createMedication.StatusCode.Should().Be(HttpStatusCode.Created);
        return (await createMedication.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString()!;
    }

    private async Task<string> CreatePrescriptionAsync(
        HttpClient client, string medicoToken, string patientId, string doctorId, string medicationId)
    {
        var request = factory.CreateClient();
        request.DefaultRequestHeaders.Authorization = With(medicoToken);
        var createPrescription = await request.PostAsJsonAsync("/api/pharmacy/prescriptions", new
        {
            patientId,
            doctorId,
            medicationId,
            dosage = "1 tableta cada 8 horas",
            frequency = "Cada 8 horas por 7 días",
            quantity = 5,
            instructions = "Tomar después de las comidas"
        });
        createPrescription.StatusCode.Should().Be(HttpStatusCode.Created);
        return (await createPrescription.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString()!;
    }
}
