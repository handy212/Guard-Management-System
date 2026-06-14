# Guard Management System Project Plan

## Goal

Build a security guard management platform that manages the full operating flow:

Client -> Site -> Guard -> Shift -> Patrol Route -> Patrol Device -> Checkpoint -> Patrol Record -> Report

## Recommended Stack

- Backend API: Django 5.2 + Django REST Framework
- Local database: SQLite for fast MVP setup
- Production database target: PostgreSQL
- Admin web: React + TypeScript + Vite
- Client portal: React + TypeScript + Vite
- Device integration: isolated adapter/service layer
- Background processing: planned worker for patrol sync, report generation, and notifications

## Modules

1. Admin / Company Settings
2. Client Management
3. Site / Location Management
4. Guard Management
5. Guard Assignment
6. Shift & Attendance Management
7. Patrol Route Management
8. Patrol Device Management
9. Patrol Device SDK Integration Layer
10. Patrol Monitoring
11. Incident Reporting
12. Supervisor Inspection
13. Client Portal
14. Reports & Dashboard
15. Notifications
16. Role-Based Access Control
17. Audit Logs

## MVP Scope

- User authentication foundation
- Roles and permissions model
- Company branches, regions, and departments
- Client management
- Client contacts, contracts, and SLA records
- Site management
- Site emergency contacts and operating instructions
- Guard management
- Guard HR records: next of kin, identity, training, certifications, uniform, discipline
- Shift assignment
- Patrol device registration
- Checkpoint management
- Patrol route management
- Patrol record import/sync placeholder
- Incident reports
- Supervisor inspections
- Client complaints
- Report request records
- Admin dashboard summary

## Database Entities

### Accounts and Company

- `User`: custom Django user with role, phone, and client portal link.
- `Role`: stable role code and display name.
- `Permission`: stable permission code.
- `CompanySettings`: tenant/company profile and timezone.
- `Branch`: internal company branch or region office.
- `Department`: internal company department such as Operations, HR, Control Room.

### Clients and Sites

- `Client`: client organization.
- `ClientContact`: people authorized to communicate for the client.
- `ClientContract`: contract/SLA terms and service dates.
- `Site`: physical location attached to a client.
- `SiteEmergencyContact`: site-specific emergency contact.
- `SiteInstruction`: post orders and operational instructions.

### Guards and Shifts

- `GuardProfile`: guard identity, employee number, card number, hire status.
- `GuardNextOfKin`: emergency family/contact details.
- `GuardDocument`: ID, license, certification, and training document metadata.
- `GuardTrainingRecord`: training completion and expiry tracking.
- `UniformIssue`: issued equipment/uniform records.
- `DisciplinaryRecord`: HR discipline and performance history.
- `Shift`: planned time window at a site.
- `GuardAssignment`: guard assignment to a shift.
- `AttendanceRecord`: check-in/check-out foundation.

### Patrols

- `PatrolDevice`: registered patrol device with device number, IMEI, connection mode, and status.
- `Checkpoint`: RFID/GPS checkpoint belonging to a site.
- `PatrolRoute`: route assigned to a site.
- `PatrolRouteCheckpoint`: ordered checkpoint steps.
- `PatrolRecord`: synced/imported record from USB or TCP/GPRS data.

### Incidents, Reports, Audits

- `IncidentReport`: operational issue reported by guard/supervisor/admin.
- `SupervisorInspection`: supervisor visit/checklist record for a site.
- `ClientComplaint`: client-raised service issue.
- `ReportRequest`: requested/downloadable report job placeholder.
- `AuditLog`: who did what, to which entity, and when.

## Patrol Device SDK Boundary

The SDK is isolated behind `PatrolDeviceGateway`.

Initial implementation:

- `FakePatrolDeviceGateway`: returns deterministic development responses.
- `SdkPatrolDeviceGateway`: placeholder adapter with TODOs for real SDK calls.

The backend API depends on the gateway interface only. The real SDK adapter should run in a Windows-capable integration service, because the vendor USB SDK is DLL-based and uses `stdcall`.

Confirmed SDK functions to support:

- `OpenDevice()`
- `CloseDevice()`
- `GetDeviceId()`
- `Verify()`
- `SetDateTime()`
- `GetRecords()`
- `ClearRecords()`
- `SetAgent()`
- `GetAgent()`
- `SetReadDataCallback()`
- `SetIpAndPort()`
- `SetDomain()`
- `SetDialParam()`
- `GetImei()`
- `SetCheckPoint()`
- `GetCheckPoint()`
- `GetMaxCheckPoint()`
- `GenerateVoiceFile()`
- `DownloadVoice()`

## API Endpoint Map

All endpoints live under `/api/v1/`.

- `GET /health/`
- `POST /auth/login/`
- `GET /auth/me/`
- `POST /auth/logout/`
- `GET /dashboard/summary/`
- `GET /client-portal/summary/`
- `GET|POST /roles/`
- `GET|POST /permissions/`
- `GET|POST /users/`
- `GET|PUT|PATCH /company-settings/{id}/`
- `GET|POST /branches/`
- `GET|POST /departments/`
- `GET|POST /clients/`
- `GET|POST /client-contacts/`
- `GET|POST /client-contracts/`
- `GET|POST /sites/`
- `GET|POST /site-emergency-contacts/`
- `GET|POST /site-instructions/`
- `GET|POST /guards/`
- `GET|POST /guard-next-of-kin/`
- `GET|POST /guard-documents/`
- `GET|POST /guard-training-records/`
- `GET|POST /uniform-issues/`
- `GET|POST /disciplinary-records/`
- `GET|POST /shifts/`
- `GET|POST /assignments/`
- `POST /assignments/{id}/evaluate-patrol/`
- `GET|POST /attendance/`
- `GET|POST /devices/`
- `POST /devices/{id}/sync/`
- `POST /devices/{id}/configure-network/`
- `GET|POST /checkpoints/`
- `GET|POST /patrol-routes/`
- `GET|POST /patrol-route-checkpoints/`
- `GET|POST /patrol-records/`
- `GET|POST /patrol-exceptions/`
- `POST /patrol-records/import-placeholder/`
- `GET|POST /incidents/`
- `GET|POST /supervisor-inspections/`
- `GET|POST /client-complaints/`
- `GET|POST /report-requests/`
- `GET|POST /audit-logs/`

## Development Phases

### Phase 1: Foundation

- Create backend apps, models, serializers, viewsets, routers.
- Create frontend shells.
- Add authenticated admin resource browser for MVP modules.
- Add seed data.
- Add SDK gateway interface and fake adapter.

### Phase 2: Authentication and RBAC

- Harden token authentication or replace with JWT/Knox-style expiring tokens.
- Enforce role permissions per module using the shared permission helper. Initial enforcement is active for mutable MVP ViewSets.
- Add client portal access rules.
- Expand audit hooks from generic CRUD logging to domain-specific event summaries.

### Phase 3: Operations MVP

- Complete CRUD screens.
- Add shift calendar.
- Add guard assignments and attendance capture.
- Add incident workflow.
- Add client contracts/SLA and site post order records.
- Add guard HR tracking.
- Add supervisor inspection and client complaint workflows.
- Add patrol assignment monitoring and missed/late checkpoint exception detection.

Current foundation status: core CRUD APIs and admin resource browser are in place for company structure, clients, contacts, contracts, sites, site instructions, guards, guard HR records, shifts, patrol devices, checkpoints, patrol routes, incidents, supervisor inspections, complaints, and report requests.

### Phase 4: Patrol Sync

- Implement file import parser for `GetRecords()` output.
- Add TCP/GPRS ingestion service.
- Map reader/device/checkpoint/guard IDs to records.
- Add duplicate detection.

### Phase 5: SDK Adapter

- Build a Windows integration service for `libJComm.dll`.
- Expose a local HTTP or queue interface to backend.
- Implement device open/close/read/clear/checkpoint/voice operations.

### Phase 6: Reporting and Dashboards

- Client reports.
- Patrol compliance.
- Attendance exceptions.
- Incident trends.
- Export jobs.

### Phase 7: Notifications and Audit Hardening

- Email/SMS/push notification adapters.
- Audit event hooks.
- Retention policies.
- Supervisor inspection module.
