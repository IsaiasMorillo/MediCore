using Hospital.Domain.Common;

namespace Hospital.API.Extensions;

public static class ApiResults
{
    public static IResult FromResult(Result result)
    {
        var statusCode = result.ErrorType switch
        {
            ErrorType.Unauthorized => StatusCodes.Status401Unauthorized,
            ErrorType.Forbidden => StatusCodes.Status403Forbidden,
            ErrorType.NotFound => StatusCodes.Status404NotFound,
            ErrorType.Conflict => StatusCodes.Status409Conflict,
            ErrorType.Internal => StatusCodes.Status500InternalServerError,
            _ => StatusCodes.Status400BadRequest
        };

        var detail = result.ErrorType == ErrorType.Internal
            ? "Ha ocurrido un error inesperado."
            : result.Error;

        return Problem(statusCode, detail);
    }

    public static IResult Validation(string detail) =>
        Problem(StatusCodes.Status400BadRequest, detail);

    public static IResult Forbidden(string? detail = null) =>
        Problem(StatusCodes.Status403Forbidden, detail);

    private static IResult Problem(int statusCode, string? detail)
    {
        var extensions = new Dictionary<string, object?>
        {
            ["error"] = detail
        };

        return Results.Problem(
            statusCode: statusCode,
            title: GetTitle(statusCode),
            detail: detail,
            type: "about:blank",
            extensions: extensions);
    }

    private static string GetTitle(int statusCode) => statusCode switch
    {
        StatusCodes.Status400BadRequest => "La solicitud no es válida.",
        StatusCodes.Status401Unauthorized => "La autenticación es requerida.",
        StatusCodes.Status403Forbidden => "No tiene permisos para realizar esta operación.",
        StatusCodes.Status404NotFound => "El recurso solicitado no fue encontrado.",
        StatusCodes.Status409Conflict => "La operación entra en conflicto con el estado actual del recurso.",
        StatusCodes.Status500InternalServerError => "Ocurrió un error interno en el servidor.",
        _ => "Ocurrió un error al procesar la solicitud."
    };
}
