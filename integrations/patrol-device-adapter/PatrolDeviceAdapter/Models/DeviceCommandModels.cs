using System.Text.Json;

namespace PatrolDeviceAdapter.Models;

public sealed class DeviceCommandRequest
{
    public string Command { get; set; } = string.Empty;
    public Dictionary<string, JsonElement> Payload { get; set; } = new();
}

public sealed class DeviceCommandResponse
{
    public bool Success { get; set; }
    public int Code { get; set; }
    public string Message { get; set; } = "ok";
    public Dictionary<string, object?> Payload { get; set; } = new();
}
