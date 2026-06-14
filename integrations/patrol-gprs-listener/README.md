# Patrol GPRS/TCP Listener

Windows-capable .NET worker that accepts **live device uploads** over TCP/GPRS, parses packets with `Jwm.Device.Lib2.dll`, replies with `ResponseBytes`, and forwards normalized records to Django.

## How this fits with USB

| Path | When | Service | Vendor API |
|------|------|---------|------------|
| **USB configure + sync** | Device docked / admin sync | `integrations/patrol-device-adapter/` (:8050) | `libJComm.dll` — OpenDevice, GetRecords, SetIpAndPort, SetDomain, SetDialParam, … |
| **GPRS/TCP push** | Device on patrol, online | This listener (:8989) | `Jwm.Device.Lib2.dll` — `WmDevice.parseData()` |

Your attached USB function table maps to the **adapter** (configure network + read records). Devices use those settings to know **where to push** (your server IP/domain + port 8989).

## Flow

```text
Handheld --TCP binary packet--> Listener (8989)
         <-- ResponseBytes ----  parseData()
Listener --POST /api/v1/device-ingest/patrol-records/--> Django
```

## Django setup

In `backend/.env`:

```env
PATROL_INGEST_API_TOKEN=change-me-ingest-token
```

Restart Django after setting the token.

## Run (stub mode, Linux/WSL dev)

```bash
export PATH="$HOME/.dotnet:$PATH"
export PATROL_INGEST_API_TOKEN=change-me-ingest-token
export LISTENER_MODE=stub

cd integrations/patrol-gprs-listener/PatrolGprsListener
dotnet run
```

## Run (real Lib2 parser, Windows)

1. Copy `WM-5000Z-SDK-20230320/tcp/Jwm.Device.Lib2.dll` to the listener host.
2. Configure:

```powershell
$env:LISTENER_MODE = "sdk"
$env:JWM_DEVICE_LIB2_PATH = "C:\path\to\Jwm.Device.Lib2.dll"
$env:PATROL_INGEST_API_TOKEN = "change-me-ingest-token"
$env:DJANGO_BASE_URL = "http://127.0.0.1:8000"
dotnet run
```

3. Point devices at your server using USB adapter commands:
   - `SetIpAndPort` / `SetDomain` + port **8989**
   - `SetDialParam` (APN, user, password, PINs) for GPRS

## Test stub ingest

```bash
# Send a fake packet
python3 - <<'PY'
import socket
s = socket.create_connection(("127.0.0.1", 8989))
s.send(bytes.fromhex("23 4A 57 4D 4C 54"))
print(s.recv(16).hex())
s.close()
PY
```

Check Django patrol records (Monitoring → Patrol records) for a stub import.

## Modes

| Mode | Config | Behavior |
|------|--------|----------|
| `stub` | default | Accepts packets, creates one demo record, returns minimal ack |
| `sdk` | `LISTENER_MODE=sdk` | Calls `Jwm.Device.Lib2.WmDevice.parseData()` |

## Notes

- Always send `ResponseBytes` back to the device when `Devicetype != UNKNOWN` (vendor requirement).
- `TIMING` packets may need a time response — extend `Lib2PacketParser` when confirmed on hardware.
- Do not load vendor DLLs from Django; only from this listener process.
