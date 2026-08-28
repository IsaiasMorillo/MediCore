using System.Text.Json;
using FluentAssertions;
using Hospital.API.Middleware;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace Hospital.UnitTests;

public class ExceptionHandlingMiddlewareTests
{
    [Fact]
    public async Task ProductionResponse_DoesNotExposeInternalExceptionMessage()
    {
        const string internalMessage = "Mongo connection string and stack details";
        var context = CreateContext();
        var environment = CreateEnvironment(Environments.Production);
        var middleware = new ExceptionHandlingMiddleware(
            _ => throw new InvalidOperationException(internalMessage),
            NullLogger<ExceptionHandlingMiddleware>.Instance,
            environment.Object);

        await middleware.InvokeAsync(context);

        var body = await ReadBodyAsync(context);
        body.GetProperty("status").GetInt32().Should().Be(500);
        body.GetProperty("detail").GetString()
            .Should().Be("Ha ocurrido un error inesperado.");
        body.GetRawText().Should().NotContain(internalMessage);
        context.Response.ContentType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task DevelopmentResponseIncludesExceptionMessageForDiagnostics()
    {
        const string internalMessage = "diagnostic message";
        var context = CreateContext();
        var environment = CreateEnvironment(Environments.Development);
        var middleware = new ExceptionHandlingMiddleware(
            _ => throw new InvalidOperationException(internalMessage),
            NullLogger<ExceptionHandlingMiddleware>.Instance,
            environment.Object);

        await middleware.InvokeAsync(context);

        var body = await ReadBodyAsync(context);
        body.GetProperty("detail").GetString().Should().Be(internalMessage);
    }

    private static DefaultHttpContext CreateContext()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        return context;
    }

    private static Mock<IHostEnvironment> CreateEnvironment(string name)
    {
        var environment = new Mock<IHostEnvironment>();
        environment.SetupGet(value => value.EnvironmentName).Returns(name);
        return environment;
    }

    private static async Task<JsonElement> ReadBodyAsync(HttpContext context)
    {
        context.Response.Body.Position = 0;
        using var document = await JsonDocument.ParseAsync(context.Response.Body);
        return document.RootElement.Clone();
    }
}
