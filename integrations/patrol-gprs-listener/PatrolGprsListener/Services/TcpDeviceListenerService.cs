using System.Net;
using System.Net.Sockets;
using Microsoft.Extensions.Options;
using PatrolGprsListener.Models;

namespace PatrolGprsListener.Services;

public sealed class TcpDeviceListenerService : BackgroundService
{
    private readonly IPacketParser _parser;
    private readonly DjangoIngestClient _ingestClient;
    private readonly ListenerOptions _options;
    private readonly ILogger<TcpDeviceListenerService> _logger;

    public TcpDeviceListenerService(
        IPacketParser parser,
        DjangoIngestClient ingestClient,
        IOptions<ListenerOptions> options,
        ILogger<TcpDeviceListenerService> logger)
    {
        _parser = parser;
        _ingestClient = ingestClient;
        _options = options.Value;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var listener = new TcpListener(IPAddress.Parse(_options.BindAddress), _options.Port);
        listener.Start();
        _logger.LogInformation("GPRS/TCP listener started on {Address}:{Port}", _options.BindAddress, _options.Port);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var client = await listener.AcceptTcpClientAsync(stoppingToken);
                _ = Task.Run(() => HandleClientAsync(client, stoppingToken), stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Accept loop error.");
            }
        }

        listener.Stop();
    }

    private async Task HandleClientAsync(TcpClient client, CancellationToken cancellationToken)
    {
        using (client)
        await using (var stream = client.GetStream())
        {
            using var memory = new MemoryStream();
            var buffer = new byte[4096];
            while (client.Connected)
            {
                var read = await stream.ReadAsync(buffer.AsMemory(0, buffer.Length), cancellationToken);
                if (read <= 0)
                {
                    break;
                }
                memory.Write(buffer, 0, read);
                if (!stream.DataAvailable)
                {
                    break;
                }
            }

            var payload = memory.ToArray();
            _logger.LogInformation("Received {Length} byte(s) from {Remote}", payload.Length, client.Client.RemoteEndPoint);

            var parsed = _parser.Parse(payload);
            _logger.LogInformation(
                "Parsed device type {DeviceType}, reader {ReaderNumber}, records {RecordCount}",
                parsed.DeviceType,
                parsed.DeviceNumber,
                parsed.Records.Count);

            if (parsed.Records.Count > 0)
            {
                await _ingestClient.ForwardRecordsAsync(parsed.Records, cancellationToken);
            }

            if (parsed.ResponseBytes.Length > 0)
            {
                await stream.WriteAsync(parsed.ResponseBytes.AsMemory(0, parsed.ResponseBytes.Length), cancellationToken);
                await stream.FlushAsync(cancellationToken);
                _logger.LogInformation("Sent {Length} response byte(s) to device.", parsed.ResponseBytes.Length);
            }
        }
    }
}
