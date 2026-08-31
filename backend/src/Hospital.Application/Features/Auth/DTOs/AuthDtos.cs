using Hospital.Domain.Enums;

namespace Hospital.Application.Features.Auth.DTOs;

public record UserResponse(
    string Id,
    string Email,
    string FullName,
    List<UserRole> Roles);

public record AuthResponse(
    string Token,
    DateTime ExpiresAt,
    UserResponse User);

public record ResetPasswordRequest(string Token, string NewPassword);