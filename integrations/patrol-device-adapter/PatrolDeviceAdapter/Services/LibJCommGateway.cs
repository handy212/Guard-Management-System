using System.Runtime.InteropServices;
using System.Text.Json;
using PatrolDeviceAdapter.Models;

namespace PatrolDeviceAdapter.Services;

public sealed class LibJCommGateway : IPatrolDeviceSdkGateway, IDisposable
{
    private bool _deviceOpened;

    static LibJCommGateway()
    {
        var configuredPath = Environment.GetEnvironmentVariable("LIBJCOMM_DLL_PATH");
        if (!string.IsNullOrWhiteSpace(configuredPath))
        {
            SetDllDirectory(configuredPath);
        }
    }

    public DeviceCommandResponse Execute(DeviceCommandRequest request)
    {
        var command = request.Command.Trim();
        try
        {
            return command switch
            {
                "OpenDevice" => ExecuteOpenDevice(),
                "CloseDevice" => ExecuteCloseDevice(),
                "GetDeviceId" => ExecuteGetDeviceId(),
                "Verify" => ExecuteVerify(ReadInt(request, "value")),
                "SetDateTime" => ExecuteSetDateTime(ReadString(request, "value")),
                "GetRecords" => ExecuteGetRecords(ReadString(request, "filename"), ReadInt(request, "encrypted")),
                "ClearRecords" => ExecuteSimple("ClearRecords", ClearRecords),
                "SetAgent" => ExecuteSetAgent(ReadString(request, "agent")),
                "GetAgent" => ExecuteGetAgent(),
                "SetReadDataCallback" => ExecuteSetReadDataCallback(),
                "SetIpAndPort" => ExecuteSetIpAndPort(ReadString(request, "ip"), ReadInt(request, "port")),
                "SetDomain" => ExecuteSetDomain(ReadString(request, "domain"), ReadString(request, "dns"), ReadInt(request, "port")),
                "SetDialParam" => ExecuteSetDialParam(request),
                "GetImei" => ExecuteGetImei(),
                "SetCheckPoint" => ExecuteSetCheckpoint(ReadString(request, "checkpoints")),
                "GetCheckPoint" => ExecuteGetCheckpoint(),
                "GetMaxCheckPoint" => ExecuteSimple("GetMaxCheckPoint", GetMaxCheckPoint),
                "GenerateVoiceFile" => ExecuteGenerateVoiceFile(request),
                "DownloadVoice" => ExecuteDownloadVoice(ReadString(request, "filename")),
                _ => Failure(-1, $"Unsupported command '{command}'."),
            };
        }
        catch (DllNotFoundException ex)
        {
            return Failure(-1, $"libJComm.dll is unavailable: {ex.Message}");
        }
        catch (Exception ex)
        {
            return Failure(-1, $"{command} failed: {ex.Message}");
        }
    }

    public void Dispose()
    {
        if (_deviceOpened)
        {
            CloseDevice();
            _deviceOpened = false;
        }
    }

    private DeviceCommandResponse ExecuteOpenDevice()
    {
        var code = OpenDevice();
        _deviceOpened = code >= 0;
        return FromCode(code, new Dictionary<string, object?> {["opened"] = _deviceOpened});
    }

    private DeviceCommandResponse ExecuteCloseDevice()
    {
        var code = CloseDevice();
        _deviceOpened = false;
        return FromCode(code, new Dictionary<string, object?> {["closed"] = true});
    }

    private DeviceCommandResponse ExecuteVerify(int value)
    {
        EnsureDeviceOpened();
        return FromCode(Verify(value), new Dictionary<string, object?> {["verified"] = value});
    }

    private DeviceCommandResponse ExecuteSetDateTime(string value)
    {
        EnsureDeviceOpened();
        if (!DateTime.TryParse(value, out var parsed))
        {
            return Failure(-1, "SetDateTime requires a valid ISO datetime payload.");
        }

        var code = SetDateTime(parsed.Year, parsed.Month, parsed.Day, parsed.Hour, parsed.Minute, parsed.Second);
        return FromCode(code, new Dictionary<string, object?> {["datetime"] = parsed.ToString("o")});
    }

    private DeviceCommandResponse ExecuteGetDeviceId()
    {
        EnsureDeviceOpened();
        var code = GetDeviceId();
        return FromCode(code, new Dictionary<string, object?> {["device_id"] = code.ToString()});
    }

    private DeviceCommandResponse ExecuteGetRecords(string filename, int encrypted)
    {
        EnsureDeviceOpened();
        var code = GetRecords(filename, encrypted);
        var records = code >= 0 ? RecordsFileParser.ParseFile(filename) : Array.Empty<Dictionary<string, object?>>();
        return FromCode(code, new Dictionary<string, object?>
        {
            ["filename"] = filename,
            ["encrypted"] = encrypted,
            ["records"] = records,
        });
    }

    private DeviceCommandResponse ExecuteSetAgent(string agent)
    {
        EnsureDeviceOpened();
        return FromCode(SetAgent(agent), new Dictionary<string, object?> {["agent"] = agent});
    }

    private DeviceCommandResponse ExecuteGetAgent()
    {
        EnsureDeviceOpened();
        var pointer = IntPtr.Zero;
        var code = GetAgent(ref pointer);
        var agent = pointer == IntPtr.Zero ? string.Empty : Marshal.PtrToStringAnsi(pointer) ?? string.Empty;
        return FromCode(code, new Dictionary<string, object?> {["agent"] = agent});
    }

    private DeviceCommandResponse ExecuteSetReadDataCallback()
    {
        EnsureDeviceOpened();
        return FromCode(SetReadDataCallback((_, _) => { }), new Dictionary<string, object?> {["callback_registered"] = true});
    }

    private DeviceCommandResponse ExecuteSetIpAndPort(string ip, int port)
    {
        EnsureDeviceOpened();
        return FromCode(SetIpAndPort(ip, port), new Dictionary<string, object?> {["ip"] = ip, ["port"] = port});
    }

    private DeviceCommandResponse ExecuteSetDomain(string domain, string dns, int port)
    {
        EnsureDeviceOpened();
        return FromCode(SetDomain(domain, dns, port), new Dictionary<string, object?> {["domain"] = domain, ["dns"] = dns, ["port"] = port});
    }

    private DeviceCommandResponse ExecuteSetDialParam(DeviceCommandRequest request)
    {
        EnsureDeviceOpened();
        var code = SetDialParam(
            ReadString(request, "apn"),
            ReadString(request, "userid"),
            ReadString(request, "password"),
            ReadString(request, "pin1"),
            ReadString(request, "pin2"));
        return FromCode(code, new Dictionary<string, object?>
        {
            ["apn"] = ReadString(request, "apn"),
            ["userid"] = ReadString(request, "userid"),
        });
    }

    private DeviceCommandResponse ExecuteGetImei()
    {
        EnsureDeviceOpened();
        var pointer = IntPtr.Zero;
        var code = GetImei(ref pointer);
        var imei = pointer == IntPtr.Zero ? string.Empty : Marshal.PtrToStringAnsi(pointer) ?? string.Empty;
        return FromCode(code, new Dictionary<string, object?> {["imei"] = imei});
    }

    private DeviceCommandResponse ExecuteSetCheckpoint(string checkpoints)
    {
        EnsureDeviceOpened();
        return FromCode(SetCheckPoint(checkpoints), new Dictionary<string, object?> {["checkpoints"] = checkpoints});
    }

    private DeviceCommandResponse ExecuteGetCheckpoint()
    {
        EnsureDeviceOpened();
        var pointer = IntPtr.Zero;
        var code = GetCheckPoint(ref pointer);
        var checkpoints = pointer == IntPtr.Zero ? string.Empty : Marshal.PtrToStringAnsi(pointer) ?? string.Empty;
        return FromCode(code, new Dictionary<string, object?> {["checkpoints"] = checkpoints});
    }

    private DeviceCommandResponse ExecuteGenerateVoiceFile(DeviceCommandRequest request)
    {
        EnsureDeviceOpened();
        var code = GenerateVoiceFile(
            ReadString(request, "sys_voice_folder"),
            ReadString(request, "output_folder"),
            ReadString(request, "text"));
        return FromCode(code, new Dictionary<string, object?>
        {
            ["sys_voice_folder"] = ReadString(request, "sys_voice_folder"),
            ["output_folder"] = ReadString(request, "output_folder"),
            ["text"] = ReadString(request, "text"),
        });
    }

    private DeviceCommandResponse ExecuteDownloadVoice(string filename)
    {
        EnsureDeviceOpened();
        return FromCode(DownloadVoice(filename), new Dictionary<string, object?> {["filename"] = filename});
    }

    private DeviceCommandResponse ExecuteSimple(string command, Func<int> action)
    {
        EnsureDeviceOpened();
        return FromCode(action(), new Dictionary<string, object?> {["command"] = command});
    }

    private void EnsureDeviceOpened()
    {
        if (!_deviceOpened)
        {
            throw new InvalidOperationException("Device is not open. Call OpenDevice first.");
        }
    }

    private static DeviceCommandResponse FromCode(int code, Dictionary<string, object?> payload)
    {
        if (code >= 0)
        {
            return new DeviceCommandResponse
            {
                Success = true,
                Code = code,
                Message = "ok",
                Payload = payload,
            };
        }

        return Failure(code, $"SDK returned error code {code}.");
    }

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

    [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    private static extern bool SetDllDirectory(string path);

    [UnmanagedFunctionPointer(CallingConvention.StdCall)]
    private delegate void ReadDataCallback(int totalPackets, int currentPacket);

    [DllImport("libJComm.dll")]
    private static extern int OpenDevice();

    [DllImport("libJComm.dll")]
    private static extern int CloseDevice();

    [DllImport("libJComm.dll", CharSet = CharSet.Ansi)]
    private static extern int GetRecords(string filename, int encry);

    [DllImport("libJComm.dll")]
    private static extern int ClearRecords();

    [DllImport("libJComm.dll", CharSet = CharSet.Ansi)]
    private static extern int SetAgent(string agent);

    [DllImport("libJComm.dll")]
    private static extern int GetAgent(ref IntPtr agent);

    [DllImport("libJComm.dll")]
    private static extern int GetDeviceId();

    [DllImport("libJComm.dll")]
    private static extern int Verify(int val);

    [DllImport("libJComm.dll", EntryPoint = "SetReadDataCallback", CharSet = CharSet.Ansi)]
    private static extern int SetReadDataCallback(ReadDataCallback callback);

    [DllImport("libJComm.dll")]
    private static extern int SetIpAndPort(string ip, int port);

    [DllImport("libJComm.dll")]
    private static extern int SetDomain(string domain, string dns, int port);

    [DllImport("libJComm.dll")]
    private static extern int SetDialParam(string apn, string userid, string password, string pin1, string pin2);

    [DllImport("libJComm.dll")]
    private static extern int GetImei(ref IntPtr imei);

    [DllImport("libJComm.dll")]
    private static extern int SetDateTime(int year, int month, int day, int hour, int minute, int second);

    [DllImport("libJComm.dll", CharSet = CharSet.Ansi)]
    private static extern int SetCheckPoint(string checkpoints);

    [DllImport("libJComm.dll")]
    private static extern int GetCheckPoint(ref IntPtr checkpoints);

    [DllImport("libJComm.dll")]
    private static extern int GetMaxCheckPoint();

    [DllImport("libJComm.dll", CharSet = CharSet.Ansi)]
    private static extern int GenerateVoiceFile(string sysVoiceFolder, string outputFolder, string text);

    [DllImport("libJComm.dll", CharSet = CharSet.Ansi)]
    private static extern int DownloadVoice(string filename);
}
