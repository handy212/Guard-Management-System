using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Text.Json;
using PatrolGprsListener;
using PatrolGprsListener.Models;
using PatrolGprsListener.Services;

var builder = Host.CreateApplicationBuilder(args);

builder.Services.Configure<ListenerOptions>(builder.Configuration.GetSection("Listener"));
builder.Services.AddSingleton<IPacketParser>(serviceProvider =>
{
    var mode = builder.Configuration["Listener:Mode"] ?? Environment.GetEnvironmentVariable("LISTENER_MODE") ?? "stub";
    if (mode.Equals("sdk", StringComparison.OrdinalIgnoreCase))
    {
        return ActivatorUtilities.CreateInstance<Lib2PacketParser>(serviceProvider);
    }
    return new StubPacketParser();
});
builder.Services.AddHttpClient<DjangoIngestClient>();
builder.Services.AddHostedService<TcpDeviceListenerService>();

var app = builder.Build();
app.Run();
