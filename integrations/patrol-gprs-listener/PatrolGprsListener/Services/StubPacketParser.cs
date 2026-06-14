using PatrolGprsListener.Models;

namespace PatrolGprsListener.Services;

public interface IPacketParser
{
    ParsePacketResult Parse(byte[] payload);
}

public sealed class StubPacketParser : IPacketParser
{
    public ParsePacketResult Parse(byte[] payload)
    {
        if (payload.Length == 0)
        {
            return new ParsePacketResult
            {
                DeviceType = "UNKNOWN",
                ResponseBytes = Array.Empty<byte>(),
            };
        }

        var deviceNumber = $"STUB-{payload.Length}";
        var occurredAt = DateTime.UtcNow.ToString("o");
        return new ParsePacketResult
        {
            DeviceType = "WM5000LT",
            DeviceNumber = deviceNumber,
            ResponseBytes = new byte[] {0x06},
            Records =
            [
                new NormalizedPatrolRecord
                {
                    SourceRecordId = $"stub-{deviceNumber}-{payload[0]:X2}-{occurredAt}",
                    DeviceNumber = deviceNumber,
                    GuardCardNumber = "STUB-GUARD",
                    CheckpointCode = "STUB-CP",
                    OccurredAt = occurredAt,
                    RecordType = "normal",
                    Information = $"stub packet ({payload.Length} bytes)",
                    RawPayload = new Dictionary<string, object?> {["stub"] = true, ["length"] = payload.Length},
                },
            ],
        };
    }
}
