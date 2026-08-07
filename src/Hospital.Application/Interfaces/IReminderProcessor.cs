namespace Hospital.Application.Interfaces;

public interface IReminderProcessor
{
    Task<int> ProcessPendingAsync(CancellationToken cancellationToken = default);
}