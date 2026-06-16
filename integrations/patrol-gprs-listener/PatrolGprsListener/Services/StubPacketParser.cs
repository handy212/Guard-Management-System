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

        var deviceNumber = Environment.GetEnvironmentVariable("LISTENER_STUB_DEVICE_NUMBER") ?? "WM5000Z-DEMO-001";
        var guardCard = Environment.GetEnvironmentVariable("LISTENER_STUB_GUARD_CARD") ?? "CARD1";
        var checkpointCode = Environment.GetEnvironmentVariable("LISTENER_STUB_CHECKPOINT_CODE") ?? "CP1";
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
                    GuardCardNumber = guardCard,
                    CheckpointCode = checkpointCode,
                    OccurredAt = occurredAt,
                    RecordType = "normal",
                    Information = $"stub packet ({payload.Length} bytes)",
                    RawPayload = new Dictionary<string, object?> {["stub"] = true, ["length"] = payload.Length},
                },
            ],
        };
    }
}
