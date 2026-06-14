using PatrolDeviceAdapter.Models;
using PatrolDeviceAdapter.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton<IPatrolDeviceSdkGateway>(serviceProvider =>
{
    var mode = builder.Configuration["Adapter:Mode"] ?? Environment.GetEnvironmentVariable("ADAPTER_MODE") ?? "stub";
    return mode.Equals("sdk", StringComparison.OrdinalIgnoreCase)
        ? new LibJCommGateway()
        : new StubPatrolDeviceGateway();
});

var app = builder.Build();
var apiToken = builder.Configuration["Adapter:ApiToken"] ?? Environment.GetEnvironmentVariable("DEVICE_ADAPTER_API_TOKEN") ?? string.Empty;

app.MapGet("/health", () => Results.Ok(new {status = "ok"}));

app.MapPost("/api/v1/device-adapter/commands", (DeviceCommandRequest request, HttpContext httpContext, IPatrolDeviceSdkGateway gateway) =>
{
    if (!string.IsNullOrWhiteSpace(apiToken))
    {
        var authorization = httpContext.Request.Headers.Authorization.ToString();
        if (authorization != $"Bearer {apiToken}")
        {
            return Results.Json(
                new DeviceCommandResponse {Success = false, Code = 401, Message = "Unauthorized adapter request."},
                statusCode: StatusCodes.Status401Unauthorized);
        }
    }

    if (string.IsNullOrWhiteSpace(request.Command))
    {
        return Results.Json(
            new DeviceCommandResponse {Success = false, Code = 400, Message = "Command is required."},
            statusCode: StatusCodes.Status400BadRequest);
    }

    var response = gateway.Execute(request);
    var statusCode = response.Success ? StatusCodes.Status200OK : StatusCodes.Status502BadGateway;
    return Results.Json(response, statusCode: statusCode);
});

app.Run();
