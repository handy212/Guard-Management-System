namespace PatrolGprsListener;

public sealed class ListenerOptions
{
    public int Port { get; set; } = 8989;
    public string BindAddress { get; set; } = "0.0.0.0";
}
