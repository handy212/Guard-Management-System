using System.Reflection;
using PatrolGprsListener.Models;

namespace PatrolGprsListener.Services;

public sealed class Lib2PacketParser : IPacketParser
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<Lib2PacketParser> _logger;

    public Lib2PacketParser(IConfiguration configuration, ILogger<Lib2PacketParser> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public ParsePacketResult Parse(byte[] payload)
    {
        var assemblyPath = _configuration["Listener:Lib2AssemblyPath"]
            ?? Environment.GetEnvironmentVariable("JWM_DEVICE_LIB2_PATH")
            ?? string.Empty;

        if (string.IsNullOrWhiteSpace(assemblyPath) || !File.Exists(assemblyPath))
        {
            _logger.LogWarning("Jwm.Device.Lib2.dll not found at {Path}. Falling back to stub parsing.", assemblyPath);
            return new StubPacketParser().Parse(payload);
        }

        try
        {
            var assembly = Assembly.LoadFrom(assemblyPath);
            var wmDeviceType = assembly.GetType("Jwm.Device.Lib2.WmDevice")
                ?? throw new InvalidOperationException("Jwm.Device.Lib2.WmDevice type not found.");
            dynamic wmDevice = Activator.CreateInstance(wmDeviceType)!;
            var parseMethod = wmDeviceType.GetMethod("parseData")
                ?? throw new InvalidOperationException("parseData method not found.");

            var dataList = (System.Collections.IEnumerable)parseMethod.Invoke(wmDevice, new object[] {payload, payload.Length})!;
            var deviceType = Enum.GetName(wmDevice.Devicetype.GetType(), wmDevice.Devicetype) ?? "UNKNOWN";
            var responseBytes = (byte[])wmDevice.ResponseBytes;
            var records = new List<NormalizedPatrolRecord>();

            foreach (var item in dataList)
            {
                if (item is null)
                {
                    continue;
                }

                var itemType = item.GetType();
                var guardId = itemType.GetProperty("GuardID")?.GetValue(item)?.ToString() ?? string.Empty;
                var addressId = itemType.GetProperty("AddressID")?.GetValue(item)?.ToString() ?? string.Empty;
                var readTime = (DateTime)(itemType.GetProperty("ReadTime")?.GetValue(item) ?? DateTime.UtcNow);
                var recordType = itemType.GetProperty("Recordtype")?.GetValue(item)?.ToString() ?? string.Empty;
                var information = itemType.GetProperty("Information")?.GetValue(item)?.ToString() ?? string.Empty;
                var deviceNumber = wmDevice.ReaderNumber?.ToString() ?? string.Empty;
                var imei = wmDevice.Imei?.ToString() ?? string.Empty;

                decimal? latitude = null;
                decimal? longitude = null;
                decimal? speed = null;
                int? satellites = null;
                if (itemType.GetProperty("Latitude") is not null)
                {
                    latitude = Convert.ToDecimal(itemType.GetProperty("Latitude")!.GetValue(item));
                    longitude = Convert.ToDecimal(itemType.GetProperty("Longitude")!.GetValue(item));
                    speed = Convert.ToDecimal(itemType.GetProperty("Speed")!.GetValue(item));
                    satellites = Convert.ToInt32(itemType.GetProperty("Satellites")!.GetValue(item));
                }

                var occurredAt = readTime.ToUniversalTime().ToString("o");
                records.Add(new NormalizedPatrolRecord
                {
                    SourceRecordId = $"{deviceNumber}:{guardId}:{addressId}:{occurredAt}:{recordType}",
                    DeviceNumber = deviceNumber,
                    GuardCardNumber = guardId,
                    CheckpointCode = addressId,
                    OccurredAt = occurredAt,
                    RecordType = recordType,
                    Information = information,
                    Imei = imei,
                    Latitude = latitude,
                    Longitude = longitude,
                    Speed = speed,
                    Satellites = satellites,
                    RawPayload = new Dictionary<string, object?>
                    {
                        ["device_type"] = deviceType,
                        ["agency"] = wmDevice.Agency?.ToString(),
                    },
                });
            }

            return new ParsePacketResult
            {
                DeviceType = deviceType,
                DeviceNumber = wmDevice.ReaderNumber?.ToString() ?? string.Empty,
                Imei = wmDevice.Imei?.ToString() ?? string.Empty,
                Agency = wmDevice.Agency?.ToString() ?? string.Empty,
                ResponseBytes = responseBytes,
                Records = records,
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lib2 parse failed.");
            return new ParsePacketResult
            {
                DeviceType = "ERROR",
                ResponseBytes = Array.Empty<byte>(),
            };
        }
    }
}
