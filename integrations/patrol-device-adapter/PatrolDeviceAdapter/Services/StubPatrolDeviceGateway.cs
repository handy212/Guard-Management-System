using System.Text.Json;
using PatrolDeviceAdapter.Models;

namespace PatrolDeviceAdapter.Services;

public sealed class StubPatrolDeviceGateway : IPatrolDeviceSdkGateway
{
    public DeviceCommandResponse Execute(DeviceCommandRequest request)
    {
        var command = request.Command.Trim();
        return command switch
        {
            "OpenDevice" => Success(new Dictionary<string, object?> {["opened"] = true}),
            "CloseDevice" => Success(new Dictionary<string, object?> {["closed"] = true}),
            "GetDeviceId" => Success(new Dictionary<string, object?> {["device_id"] = "STUB-DEVICE-001"}),
            "Verify" => Success(new Dictionary<string, object?> {["verified"] = ReadInt(request, "value")}),
            "SetDateTime" => Success(new Dictionary<string, object?> {["datetime"] = ReadString(request, "value")}),
            "GetRecords" => Success(new Dictionary<string, object?>
            {
                ["filename"] = ReadString(request, "filename"),
                ["encrypted"] = ReadInt(request, "encrypted"),
                ["records"] = Array.Empty<object>(),
            }),
            "ClearRecords" => Success(new Dictionary<string, object?> {["cleared"] = true}),
            "SetAgent" => Success(new Dictionary<string, object?> {["agent"] = ReadString(request, "agent")}),
            "GetAgent" => Success(new Dictionary<string, object?> {["agent"] = "Stub Agent"}),
            "SetReadDataCallback" => Success(new Dictionary<string, object?> {["callback_registered"] = true}),
            "SetIpAndPort" => Success(new Dictionary<string, object?>
            {
                ["ip"] = ReadString(request, "ip"),
                ["port"] = ReadInt(request, "port"),
            }),
            "SetDomain" => Success(new Dictionary<string, object?>
            {
                ["domain"] = ReadString(request, "domain"),
                ["dns"] = ReadString(request, "dns"),
                ["port"] = ReadInt(request, "port"),
            }),
            "SetDialParam" => Success(new Dictionary<string, object?>
            {
                ["apn"] = ReadString(request, "apn"),
                ["userid"] = ReadString(request, "userid"),
                ["pin1"] = ReadString(request, "pin1"),
                ["pin2"] = ReadString(request, "pin2"),
            }),
            "GetImei" => Success(new Dictionary<string, object?> {["imei"] = "000000000000000"}),
            "SetCheckPoint" => Success(new Dictionary<string, object?> {["checkpoints"] = ReadString(request, "checkpoints")}),
            "GetCheckPoint" => Success(new Dictionary<string, object?> {["checkpoints"] = string.Empty}),
            "GetMaxCheckPoint" => Success(new Dictionary<string, object?> {["max_checkpoints"] = 0}),
            "GenerateVoiceFile" => Success(new Dictionary<string, object?>
            {
                ["sys_voice_folder"] = ReadString(request, "sys_voice_folder"),
                ["output_folder"] = ReadString(request, "output_folder"),
                ["text"] = ReadString(request, "text"),
            }),
            "DownloadVoice" => Success(new Dictionary<string, object?> {["filename"] = ReadString(request, "filename")}),
            _ => Failure(-1, $"Unsupported command '{command}'."),
        };
    }

    private static DeviceCommandResponse Success(Dictionary<string, object?> payload) =>
        new() {Success = true, Code = 0, Message = "ok", Payload = payload};

    private static DeviceCommandResponse Failure(int code, string message) =>
        new() {Success = false, Code = code, Message = message};

    private static string ReadString(DeviceCommandRequest request, string key)
    {
        if (!request.Payload.TryGetValue(key, out var value))
        {
            return string.Empty;
        }

        return value.ValueKind switch
        {
            JsonValueKind.String => value.GetString() ?? string.Empty,
            JsonValueKind.Number => value.GetRawText(),
            JsonValueKind.True => "true",
            JsonValueKind.False => "false",
            _ => value.GetRawText(),
        };
    }

    private static int ReadInt(DeviceCommandRequest request, string key)
    {
        if (!request.Payload.TryGetValue(key, out var value))
        {
            return 0;
        }

        return value.ValueKind switch
        {
            JsonValueKind.Number => value.TryGetInt32(out var number) ? number : 0,
            JsonValueKind.String when int.TryParse(value.GetString(), out var parsed) => parsed,
            _ => 0,
        };
    }
}
