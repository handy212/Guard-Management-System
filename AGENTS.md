# Guard Management System Coding Guide

## Project Shape

This repository is a modular Guard Management System with:

- `backend/`: Django + Django REST Framework API.
- `frontend/admin-web/`: React + TypeScript + Vite admin dashboard.
- `frontend/client-portal/`: React + TypeScript + Vite client portal.
- `integrations/patrol-device-sdk/`: notes and adapter boundary for vendor patrol device SDK integration.
- `integrations/patrol-device-adapter/`: USB command adapter (`libJComm.dll`) on port 8050.
- `integrations/patrol-gprs-listener/`: GPRS/TCP push listener (`Jwm.Device.Lib2.dll`) on port 8989.
- `WM-5000Z-SDK-20230320/`: vendor SDK files. Do not edit vendor SDK files.

## Architecture Rules

- The main backend must never call `libJComm.dll` or `Jwm.Device.Lib2.dll` directly.
- Patrol device calls must go through `backend/apps/device_integration/gateways.py`.
- Use a fake gateway for development and tests.
- Put real SDK calls only in a dedicated adapter/service process later.
- Do not invent SDK behavior. Only expose behavior confirmed by SDK docs or samples.
- Add TODO comments only where real SDK implementation is pending.
- Keep business modules separated by app: clients, sites, guards, shifts, devices, patrols, incidents, reports, audits.
- Prefer service functions for cross-module workflows.
- API URLs are versioned under `/api/v1/`.

## Backend Setup

```bash
cd backend
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo
python manage.py runserver 127.0.0.1:8000
```

## Backend Checks

```bash
cd backend
. .venv/bin/activate
pip install -r requirements.txt
python manage.py check
python manage.py test
```

Run the API with ASGI (required for live monitoring WebSockets):

```bash
python manage.py runserver 127.0.0.1:8000
```

`daphne` is installed via `channels[daphne]`; Django's dev server will serve HTTP and `/ws/monitoring/live/`.

## API Authentication

Development token authentication endpoints:

- `POST /api/v1/auth/login/` with `username` and `password` — returns `token`, `expires_at`, and `user`.
- `GET /api/v1/auth/me/` with `Authorization: Token <token>`.
- `POST /api/v1/auth/logout/` with `Authorization: Token <token>`.
- `GET /api/v1/client-portal/summary/` with a client-linked user token.

Tokens expire after `AUTH_TOKEN_TTL_SECONDS` (default 7 days). Expired tokens are rejected and deleted. Client-linked users without a role cannot access internal module APIs; give client users only the minimum read permissions they need, and prefer `/api/v1/client-portal/*` endpoints for portal workflows.

Set `DJANGO_ENV=production` to enable HTTPS-only cookie flags and HSTS. See `backend/.env.example`.

## Patrol device gateway

- `DEVICE_GATEWAY=fake` — local placeholder gateway (default).
- `DEVICE_GATEWAY=sdk` — HTTP calls to the Windows adapter at `DEVICE_ADAPTER_BASE_URL`.

See `integrations/patrol-device-adapter/README.md` for adapter setup and hardware verification.

## Patrol GPRS/TCP ingest

Devices on patrol push binary packets to the TCP listener (default port **8989**). The listener parses with `Jwm.Device.Lib2.dll`, replies with `ResponseBytes`, and forwards normalized records to Django:

- `POST /api/v1/device-ingest/patrol-records/` with `Authorization: Bearer <PATROL_INGEST_API_TOKEN>`
- Set the same token in backend `.env` and the listener config.

USB functions `SetIpAndPort`, `SetDomain`, and `SetDialParam` (via the adapter) configure where devices push. See `integrations/patrol-gprs-listener/README.md` and `integrations/patrol-device-sdk/README.md`.

## Live monitoring WebSocket

Admin **Monitoring → Live map** opens `ws://<host>/ws/monitoring/live/?token=<DRF token>&site_id=<optional>`.

New patrol records broadcast instantly to connected dashboards. Polling remains as a fallback when the socket is disconnected.

Demo accounts after `python manage.py seed_demo`:

- Admin: `admin` / `ChangeMe123!`
- Client portal: `client` / `ClientPass123!`

## Frontend Setup

```bash
cd frontend/admin-web
npm install
npm run dev
```

```bash
cd frontend/client-portal
npm install
npm run dev
```

## Frontend Checks

```bash
npm run build
```

## Conventions

- Use Django model constraints for important uniqueness rules.
- Use DRF serializers for request validation.
- Use `apps.core.permissions.permission_class` for module-level API permissions.
- Use `apps.core.mixins.AuditLogMixin` on mutable business ViewSets.
- Use consistent JSON error responses from DRF.
- Every model that represents business data should include timestamps.
- Soft delete is not enabled yet; preserve auditability through `AuditLog`.
- Use ISO timestamps in APIs.
- Use decimal fields for latitude/longitude when persisted.
- Keep role names and permission codes stable.
- Keep sample data realistic but obviously non-production.

## SDK Notes

Confirmed USB SDK functions include:

- `OpenDevice()`
- `CloseDevice()`
- `GetDeviceId()`
- `Verify(int val)`
- `SetDateTime(year, month, day, hour, minute, second)`
- `GetRecords(filename, encry)`
- `ClearRecords()`
- `SetAgent(agent)`
- `GetAgent(agent)`
- `SetReadDataCallback(callback)`
- `SetIpAndPort(ip, port)`
- `SetDomain(domain, dns, port)`
- `SetDialParam(apn, userid, password, pin1, pin2)`
- `GetImei(imei)`
- `SetCheckPoint(checkpoints)`
- `GetCheckPoint(checkpoints)`
- `GetMaxCheckPoint()`
- `GenerateVoiceFile(sysVoiceFolder, outputFolder, text)`
- `DownloadVoice(filename)`

The SDK docs state return values greater than or equal to zero mean communication succeeded; negative values represent SDK errors.

GPRS/TCP live push uses `Jwm.Device.Lib2.dll` (`WmDevice.parseData()`). See `WM5000LT_Protocol_Package_English.md` and `integrations/patrol-gprs-listener/`.
