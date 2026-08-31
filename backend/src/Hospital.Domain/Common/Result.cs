namespace Hospital.Domain.Common;

public class Result
{
    protected Result(bool isSuccess, string? error, ErrorType errorType)
    {
        IsSuccess = isSuccess;
        Error = error;
        ErrorType = errorType;
    }

    public bool IsSuccess { get; }

    public bool IsFailure => !IsSuccess;

    public string? Error { get; }

    public ErrorType ErrorType { get; }

    public static Result Success() => new(true, null, ErrorType.None);

    public static Result<TValue> Success<TValue>(TValue value) => new(value, true, null, ErrorType.None);

    public static Result Failure(string error, ErrorType errorType = ErrorType.Validation) =>
        new(false, error, errorType);

    public static Result<TValue> Failure<TValue>(string error, ErrorType errorType = ErrorType.Validation) =>
        new(default, false, error, errorType);
}

public class Result<TValue> : Result
{
    internal Result(TValue? value, bool isSuccess, string? error, ErrorType errorType)
        : base(isSuccess, error, errorType)
    {
        Value = value;
    }

    public TValue? Value { get; }
}

public enum ErrorType
{
    None,
    Validation,
    NotFound,
    Conflict,
    Unauthorized,
    Forbidden,
    Internal
}