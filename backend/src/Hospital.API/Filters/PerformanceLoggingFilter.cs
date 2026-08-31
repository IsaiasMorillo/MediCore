using System.Diagnostics;

namespace Hospital.API.Filters;

public class PerformanceLoggingFilter(ILogger<PerformanceLoggingFilter> logger) : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var stopwatch = Stopwatch.StartNew();
        var result = await next(context);
        stopwatch.Stop();

        logger.LogInformation(
            "{Method} {Path} respondió {StatusCode} en {ElapsedMs} ms",
            context.HttpContext.Request.Method,
            context.HttpContext.Request.Path,
            context.HttpContext.Response.StatusCode,
            stopwatch.ElapsedMilliseconds);

        return result;
    }
}