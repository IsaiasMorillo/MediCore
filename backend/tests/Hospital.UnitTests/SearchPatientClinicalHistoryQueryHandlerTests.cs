using FluentAssertions;
using Hospital.Application.Features.MedicalRecords.Commands;
using Hospital.Application.Features.MedicalRecords.Queries;
using Hospital.Domain.Common;
using Hospital.Domain.Entities;
using Hospital.Domain.Interfaces;
using Moq;

namespace Hospital.UnitTests.Application;

public class SearchPatientClinicalHistoryQueryHandlerTests
{
    private static Patient Patient(string id, string firstName, string lastName, string documentId) => new()
    {
        Id = id,
        PersonalData = new PersonalData { FirstName = firstName, LastName = lastName, DocumentId = documentId },
        ClinicalHistory = new ClinicalHistory
        {
            Allergies = ["Penicilina"],
            ChronicDiseases = ["Hipertensión"]
        }
    };

    [Fact]
    public async Task Search_ByName_ReturnsPatientWithRecordsSortedDesc()
    {
        var patientRepository = new Mock<IPatientRepository>();
        patientRepository.Setup(r => r.GetByIdAsync("María", It.IsAny<CancellationToken>()))
            .ReturnsAsync((Patient?)null);
        patientRepository.Setup(r => r.SearchAsync("María", It.IsAny<CancellationToken>()))
            .ReturnsAsync([Patient("pat-1", "María", "Pérez", "402-1234567-8")]);

        var medicalRecordRepository = new Mock<IMedicalRecordRepository>();
        medicalRecordRepository.Setup(r => r.GetByPatientAsync("pat-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new MedicalRecord { Id = "rec-old", PatientId = "pat-1", Diagnosis = "Gripe", ConsultationDate = new DateTime(2026, 1, 1) },
                new MedicalRecord { Id = "rec-new", PatientId = "pat-1", Diagnosis = "Infección", ConsultationDate = new DateTime(2026, 6, 1) }
            ]);

        var handler = new SearchPatientClinicalHistoryQueryHandler(
            patientRepository.Object, medicalRecordRepository.Object);

        var result = await handler.Handle(
            new SearchPatientClinicalHistoryQuery("María"), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        var patient = result.Value!.Single();
        patient.PatientName.Should().Be("María Pérez");
        patient.DocumentId.Should().Be("402-1234567-8");
        patient.ClinicalHistory.Allergies.Should().Contain("Penicilina");
        patient.MedicalRecords.Select(r => r.Id).Should().Equal("rec-new", "rec-old");
        patient.MedicalRecords.First().Diagnosis.Should().Be("Infección");
    }

    [Fact]
    public async Task Search_ByExactId_UsesIdLookup()
    {
        var patientRepository = new Mock<IPatientRepository>();
        var patient = Patient("pat-99", "Ana", "Gómez", "001-0000000-1");
        patientRepository.Setup(r => r.GetByIdAsync("pat-99", It.IsAny<CancellationToken>()))
            .ReturnsAsync(patient);
        var medicalRecordRepository = new Mock<IMedicalRecordRepository>();
        medicalRecordRepository.Setup(r => r.GetByPatientAsync("pat-99", It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        var handler = new SearchPatientClinicalHistoryQueryHandler(
            patientRepository.Object, medicalRecordRepository.Object);

        var result = await handler.Handle(
            new SearchPatientClinicalHistoryQuery("pat-99"), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value!.Single().PatientId.Should().Be("pat-99");
        patientRepository.Verify(r => r.GetByIdAsync("pat-99", It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Search_WithNoMatches_ReturnsEmptyList()
    {
        var patientRepository = new Mock<IPatientRepository>();
        patientRepository.Setup(r => r.GetByIdAsync("zzz", It.IsAny<CancellationToken>()))
            .ReturnsAsync((Patient?)null);
        patientRepository.Setup(r => r.SearchAsync("zzz", It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        var handler = new SearchPatientClinicalHistoryQueryHandler(
            patientRepository.Object, new Mock<IMedicalRecordRepository>().Object);

        var result = await handler.Handle(
            new SearchPatientClinicalHistoryQuery("zzz"), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().BeEmpty();
    }

    [Fact]
    public async Task Search_WithEmptyTerm_ReturnsValidation()
    {
        var handler = new SearchPatientClinicalHistoryQueryHandler(
            new Mock<IPatientRepository>().Object, new Mock<IMedicalRecordRepository>().Object);

        var result = await handler.Handle(
            new SearchPatientClinicalHistoryQuery("  "), CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.ErrorType.Should().Be(ErrorType.Validation);
    }
}