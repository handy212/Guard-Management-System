using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using PatrolGprsListener.Models;

namespace PatrolGprsListener.Services;

public sealed class DjangoIngestClient
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<DjangoIngestClient> _logger;

    public DjangoIngestClient(HttpClient httpClient, IConfiguration configuration, ILogger<DjangoIngestClient> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<bool> ForwardRecordsAsync(IReadOnlyList<NormalizedPatrolRecord> records, CancellationToken cancellationToken)
    {
        if (records.Count == 0)
        {
            return true;
        }

        var baseUrl = (_configuration["Listener:DjangoBaseUrl"] ?? Environment.GetEnvironmentVariable("DJANGO_BASE_URL") ?? "http://127.0.0.1:8000").TrimEnd('/');
        var token = _configuration["Listener:IngestApiToken"] ?? Environment.GetEnvironmentVariable("PATROL_INGEST_API_TOKEN") ?? string.Empty;
        if (string.IsNullOrWhiteSpace(token))
        {
            _logger.LogWarning("PATROL_INGEST_API_TOKEN is not configured; skipping Django forward.");
            return false;
        }

        var payload = new
        {
            source = "tcp",
            records = records.Select(record => new Dictionary<string, object?>
            {
                ["source_record_id"] = record.SourceRecordId,
                ["device_number"] = record.DeviceNumber,
                ["guard_card_number"] = record.GuardCardNumber,
                ["checkpoint_code"] = record.CheckpointCode,
                ["occurred_at"] = record.OccurredAt,
                ["record_type"] = record.RecordType,
                ["information"] = record.Information,
                ["imei"] = record.Imei,
                ["latitude"] = record.Latitude,
                ["longitude"] = record.Longitude,
                ["speed"] = record.Speed,
                ["satellites"] = record.Satellites,
                ["raw_payload"] = record.RawPayload,
            }).ToList(),
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/api/v1/device-ingest/patrol-records/")
        {
            Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json"),
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        using var response = await _httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogError("Django ingest failed ({StatusCode}): {Body}", (int)response.StatusCode, body);
            return false;
        }

        _logger.LogInformation("Forwarded {Count} patrol record(s) to Django.", records.Count);
        return true;
    }
}
