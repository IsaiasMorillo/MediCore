using Hospital.Application.Features.Auth.Commands;
using Hospital.Domain.Common;
using MediatR;

namespace Hospital.API.Endpoints;

public static class AuthEndpoints
{
    public static RouteGroupBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth").WithTags("Auth");

        group.MapPost("/register", async (RegisterUserCommand command, IMediator mediator) =>
        {
            var result = await mediator.Send(command);
            return ToResult(result);
        })
        .RequireAuthorization("AdminOnly")
        .WithName("RegisterUser");

        group.MapPost("/patient-account", async (RegisterPatientAccountCommand command, IMediator mediator) =>
        {
            var result = await mediator.Send(command);
            return result.IsSuccess
                ? Results.Created($"/api/auth/patient-account/{result.Value}", new { id = result.Value })
                : ToResult(result);
        })
        .RequireAuthorization("AdminOnly")
        .WithName("RegisterPatientAccount");

        group.MapPost("/login", async (LoginCommand request, IMediator mediator) =>
        {
            var result = await mediator.Send(request);
            if (result.IsSuccess)
            {
                var value = result.Value!;
                return Results.Ok(new
                {
                    token = value.Token,
                    expiresAt = value.ExpiresAt,
                    user = new { value.UserId, value.FullName, value.Email, value.Roles }
                });
            }

            return result.ErrorType switch
            {
                ErrorType.Unauthorized or ErrorType.Forbidden => Results.Unauthorized(),
                _ => Results.BadRequest(new { error = result.Error })
            };
        })
        .AllowAnonymous()
        .WithName("Login");

        group.MapPost("/forgot-password", async (ForgotPasswordCommand command, IMediator mediator) =>
        {
            var result = await mediator.Send(command);
            return result.IsSuccess ? Results.Ok(new { message = "Si el correo existe, recibirá las instrucciones." }) : Results.BadRequest(new { error = result.Error });
        })
        .AllowAnonymous()
        .WithName("ForgotPassword");

        group.MapPost("/reset-password", async (ResetPasswordCommand command, IMediator mediator) =>
        {
            var result = await mediator.Send(command);
            return result.IsSuccess ? Results.Ok() : Results.BadRequest(new { error = result.Error });
        })
        .AllowAnonymous()
        .WithName("ResetPassword");

        return group;
    }

    private static IResult ToResult(Result<string> result)
    {
        return result.IsSuccess
            ? Results.Created($"/api/users/{result.Value}", new { id = result.Value })
            : Results.BadRequest(new { error = result.Error });
    }
}