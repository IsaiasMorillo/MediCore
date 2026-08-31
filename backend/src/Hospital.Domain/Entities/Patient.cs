using Hospital.Domain.Common;

namespace Hospital.Domain.Entities;

public class Patient : Entity
{
    public PersonalData PersonalData { get; set; } = new();

    public List<Contact> Contacts { get; set; } = [];

    public MedicalInsurance? MedicalInsurance { get; set; }

    public ClinicalHistory ClinicalHistory { get; set; } = new();

    public bool IsActive { get; set; } = true;
}

public class PersonalData
{
    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    public string DocumentId { get; set; } = string.Empty;

    public DateTime? DateOfBirth { get; set; }

    public string Gender { get; set; } = string.Empty;
}

public class Contact
{
    public string Type { get; set; } = "Phone";

    public string Value { get; set; } = string.Empty;

    public string? Name { get; set; }

    public string? Phone { get; set; }
}

public class MedicalInsurance
{
    public string Provider { get; set; } = string.Empty;

    public string PolicyNumber { get; set; } = string.Empty;

    public string CoverageType { get; set; } = string.Empty;
}

public class ClinicalHistory
{
    public List<string> Allergies { get; set; } = [];

    public List<string> ChronicDiseases { get; set; } = [];

    public List<string> CurrentMedications { get; set; } = [];

    public List<string> FamilyHistory { get; set; } = [];
}