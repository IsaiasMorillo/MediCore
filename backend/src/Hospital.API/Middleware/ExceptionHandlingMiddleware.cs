using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace Hospital.API.Middleware;

public class ExceptionHandlingMiddleware(
    RequestDelegate next,
    ILogger<ExceptionHandlingMiddleware> logger,
    IHostEnvironment environment)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Excepción no controlada en la solicitud {Path}", context.Request.Path);

            if (context.Response.HasStarted)
            {
                throw;
            }

            await HandleExceptionAsync(context, ex, environment);
        }
    }

    private static async Task HandleExceptionAsync(
        HttpContext context,
        Exception exception,
        IHostEnvironment environment)
    {
        context.Response.Clear();
        context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
        context.Response.ContentType = "application/problem+json";

        var response = new ProblemDetails
        {
            Type = "about:blank",
            Title = "Ocurrió un error interno en el servidor.",
            Status = context.Response.StatusCode,
            Detail = environment.IsDevelopment()
                ? exception.Message
                : "Ha ocurrido un error inesperado.",
            Instance = context.Request.Path
        };

        response.Extensions["traceId"] = context.TraceIdentifier;

        await JsonSerializer.SerializeAsync(
            context.Response.Body,
            response,
            new JsonSerializerOptions(JsonSerializerDefaults.Web),
            context.RequestAborted);
    }
}
