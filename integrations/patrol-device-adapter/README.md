# Windows Patrol Device Adapter

ASP.NET Core service that implements the adapter contract documented in `integrations/patrol-device-sdk/README.md`.

## Endpoint

- `POST /api/v1/device-adapter/commands`
- Optional bearer auth via `DEVICE_ADAPTER_API_TOKEN` / `Adapter:ApiToken`

Request:

```json
{
  "command": "GetRecords",
  "payload": {
    "filename": "device-records.txt",
    "encrypted": 0
  }
}
```

Response:

```json
{
  "success": true,
  "code": 0,
  "message": "ok",
  "payload": {
    "filename": "device-records.txt",
    "encrypted": 0,
    "records": []
  }
}
```

## Modes

| Mode | Config | Behavior |
|------|--------|----------|
| `stub` | default | Returns deterministic placeholder responses without hardware |
| `sdk` | `ADAPTER_MODE=sdk` | Calls `libJComm.dll` through P/Invoke on Windows |

## Run (stub mode)

```powershell
cd integrations/patrol-device-adapter/PatrolDeviceAdapter
dotnet run --urls http://127.0.0.1:8050
```

## Wire Django to the adapter

In `backend/.env`:

```env
DEVICE_GATEWAY=sdk
DEVICE_ADAPTER_BASE_URL=http://127.0.0.1:8050/api/v1/device-adapter
DEVICE_ADAPTER_API_TOKEN=your-shared-token
DEVICE_ADAPTER_TIMEOUT_SECONDS=30
```

Then sync a device from the admin UI or:

```bash
curl -X POST http://127.0.0.1:8000/api/v1/patrol-devices/<id>/sync/ \
  -H "Authorization: Token <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"clear_device_after_sync": true}'
```

Django opens the device via the adapter, calls `GetRecords`, imports patrol records, optionally clears the device, and stores sync metadata on the device.

## Run (real SDK on Windows)

1. Copy `WM-5000Z-SDK-20230320/x64/libJComm.dll` to a folder on the adapter host.
2. Connect the WM-5000Z device via USB.
3. Set environment variables:

```powershell
$env:ADAPTER_MODE = "sdk"
$env:LIBJCOMM_DLL_PATH = "C:\path\to\dll-folder"
$env:DEVICE_ADAPTER_API_TOKEN = "your-shared-token"
dotnet run --urls http://127.0.0.1:8050
```

4. Match Django env vars (see above). Use the same token on both sides.

### Hardware verification checklist

Run these commands in order against the adapter (`POST /commands`):

| Step | Command | Pass criteria |
|------|---------|---------------|
| 1 | `OpenDevice` | `success: true`, code ≥ 0 |
| 2 | `GetDeviceId` | Returns a non-empty device id |
| 3 | `Verify` with `{ "value": 0 }` | SDK communication succeeds |
| 4 | `GetRecords` with `{ "filename": "test-records.txt", "encrypted": 0 }` | code ≥ 0; file created or records payload populated after parser is added |
| 5 | `GetImei` | Returns IMEI string when device supports it |
| 6 | `CloseDevice` | `success: true` |

After adapter checks pass, run a Django device sync and confirm:

- `import.imported_count` increases for new scans
- `sdk_metadata.last_sync_result.device_gateway` is `"sdk"`
- Patrol records appear under Monitoring → Patrol records

### Confirmed SDK surface

Only these functions are wired in the adapter today: `OpenDevice`, `CloseDevice`, `GetDeviceId`, `Verify`, `SetDateTime`, `GetRecords`, `ClearRecords`, `SetAgent`, `GetAgent`, `SetReadDataCallback`, `SetIpAndPort`, `SetDomain`, `SetDialParam`, `GetImei`, `SetCheckPoint`, `GetCheckPoint`, `GetMaxCheckPoint`, `GenerateVoiceFile`, `DownloadVoice`.

## Notes

- The adapter must run on Windows when `ADAPTER_MODE=sdk` because the vendor USB SDK ships as `libJComm.dll`.
- `GetRecords` in SDK mode calls the DLL but still returns an empty `records` array until the exported file format is parsed. Add parsing once the on-device file layout is confirmed during hardware testing.
- Use `stub` mode for local development on Linux/macOS/WSL.
- Keep `DEVICE_ADAPTER_API_TOKEN` set in any shared or production environment.
