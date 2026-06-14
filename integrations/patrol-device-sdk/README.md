# Patrol Device SDK Integration

Vendor SDK files are stored in `WM-5000Z-SDK-20230320/`.

## Dual integration paths

Most deployments use **both**:

### 1. USB — configure + bulk sync

- DLL: `libJComm.dll` (`x64/` or `x86/`)
- Service: `integrations/patrol-device-adapter/` on port **8050**
- Django: `DEVICE_GATEWAY=sdk`
- Functions (from vendor USB table): `OpenDevice`, `GetRecords`, `ClearRecords`, `SetIpAndPort`, `SetDomain`, `SetDialParam`, `GetImei`, `SetCheckPoint`, voice/checkpoint download, etc.
- Used to: register devices, **point them at your TCP server**, and pull stored records when docked

### 2. GPRS/TCP — live push

- DLL: `Jwm.Device.Lib2.dll`
- Doc: `WM5000LT_Protocol_Package_English.md`
- Service: `integrations/patrol-gprs-listener/` on port **8989** (default)
- Django ingest: `POST /api/v1/device-ingest/patrol-records/` with `PATROL_INGEST_API_TOKEN`
- Used to: receive scans while guards are on patrol; `parseData()` → reply `ResponseBytes` → forward to Django

```text
[USB dock]  admin → adapter:8050 → GetRecords → Django import
[On patrol] device → listener:8989 → parseData → Django ingest (source=tcp)
```

## Boundary

The Django backend must never load vendor DLLs directly. Use:

- `apps.device_integration.gateways.PatrolDeviceGateway` for USB commands (via adapter)
- `device-ingest/patrol-records/` for TCP-normalized records (via listener)

## Record field mapping (Lib2 → Django)

| Vendor (`Record`) | Django import field |
|-------------------|---------------------|
| `GuardID` | `guard_card_number` |
| `AddressID` | `checkpoint_code` |
| `ReadTime` | `occurred_at` |
| `Recordtype` | `record_type` |
| `Information` | `information` |
| `ReaderNumber` (on `WmDevice`) | `device_number` |
| `Imei` | `imei` |
| P5: `Latitude`, `Longitude`, `Speed`, `Satellites` | same |

## Services

| Service | README |
|---------|--------|
| USB adapter | `integrations/patrol-device-adapter/README.md` |
| GPRS listener | `integrations/patrol-gprs-listener/README.md` |
