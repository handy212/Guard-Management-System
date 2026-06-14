# Patrol Device SDK Integration

Vendor SDK files are stored in `WM-5000Z-SDK-20230320/`.

## Confirmed Artifacts

- USB SDK DLLs:
  - `WM-5000Z-SDK-20230320/x64/libJComm.dll`
  - `WM-5000Z-SDK-20230320/x86/libJComm.dll`
- TCP/GPRS parser DLL:
  - `WM-5000Z-SDK-20230320/tcp/Jwm.Device.Lib2.dll`
- Samples:
  - C# P/Invoke USB demo
  - C++ USB demo
  - Java/JNA USB demo
  - C# TCP/GPRS socket server demo
- Docs:
  - `Z interface-En.xlsx`
  - `usb/Z interface.xlsx`

## Boundary

The Django backend uses `apps.device_integration.gateways.PatrolDeviceGateway`.

Do not import or load vendor DLLs from Django models, serializers, or viewsets. Real SDK calls should be implemented in a separate Windows-capable integration service and exposed to the backend through a stable local API or queue.

## Record Fields Observed From Samples

- device/reader number
- IMEI
- guard ID
- checkpoint/address ID
- read time
- record type
- information
- longitude
- latitude
- speed
- satellites

## Pending Real Adapter Work

The initial application uses `FakePatrolDeviceGateway`. Set `DEVICE_GATEWAY=sdk` only after a real adapter service is implemented.

## Planned Adapter Contract

The Django backend now expects the future Windows adapter service to expose:

- `POST /api/v1/device-adapter/commands`

Request body:

```json
{
  "command": "GetRecords",
  "payload": {
    "filename": "device-WM5000Z-DEMO-001-records.txt",
    "encrypted": 0
  }
}
```

Response body:

```json
{
  "success": true,
  "code": 0,
  "message": "ok",
  "payload": {
    "records": []
  }
}
```

The backend can authenticate to the adapter with `DEVICE_ADAPTER_API_TOKEN` as a Bearer token. The adapter should translate these commands to vendor SDK calls and return only confirmed fields from the SDK or parser output.
