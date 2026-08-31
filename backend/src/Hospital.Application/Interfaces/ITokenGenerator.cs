using Hospital.Domain.Entities;

namespace Hospital.Application.Interfaces;

public interface ITokenGenerator
{
    string GenerateToken(User user);
}