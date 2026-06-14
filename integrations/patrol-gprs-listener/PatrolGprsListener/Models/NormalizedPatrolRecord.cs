namespace PatrolGprsListener.Models;

public sealed class ParsePacketResult
{
    public required string DeviceType { get; init; }
    public string DeviceNumber { get; init; } = string.Empty;
    public string Imei { get; init; } = string.Empty;
    public string Agency { get; init; } = string.Empty;
    public byte[] ResponseBytes { get; init; } = Array.Empty<byte>();
    public IReadOnlyList<NormalizedPatrolRecord> Records { get; init; } = Array.Empty<NormalizedPatrolRecord>();
}

public sealed class NormalizedPatrolRecord
{
    public required string SourceRecordId { get; init; }
    public required string DeviceNumber { get; init; }
    public string GuardCardNumber { get; init; } = string.Empty;
    public string CheckpointCode { get; init; } = string.Empty;
    public required string OccurredAt { get; init; }
    public string RecordType { get; init; } = string.Empty;
    public string Information { get; init; } = string.Empty;
    public string Imei { get; init; } = string.Empty;
    public decimal? Latitude { get; init; }
    public decimal? Longitude { get; init; }
    public decimal? Speed { get; init; }
    public int? Satellites { get; init; }
    public Dictionary<string, object?> RawPayload { get; init; } = new();
}

public sealed class IngestPayload
{
    public string Source { get; init; } = "tcp";
    public List<Dictionary<string, object?>> Records { get; init; } = new();
}
