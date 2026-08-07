namespace Hospital.API.Filters;

public class ModelValidationFilter : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        if (context.HttpContext.Request.HasJsonContentType() &&
            context.Arguments.Any(argument => argument is null))
        {
            return Results.BadRequest(new { error = "El cuerpo de la solicitud es inválido o está vacío." });
        }

        return await next(context);
    }
}