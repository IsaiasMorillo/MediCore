using Hospital.Domain.Common;
using Hospital.Domain.Enums;

namespace Hospital.Domain.Entities;

public class User : Entity
{
    public string Email { get; set; } = string.Empty;

    public string FullName { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    public List<UserRole> Roles { get; set; } = [];

    public bool IsActive { get; set; } = true;

    public string? PasswordResetToken { get; set; }

    public DateTime? PasswordResetExpires { get; set; }

    public string? StaffId { get; set; }

    public string? PatientId { get; set; }
}