import React, { useMemo, useState } from "react";
import { X } from "lucide-react";
import {
  configurePatrolDeviceNetwork,
  DeviceNetworkConfigPayload,
  DeviceNetworkConfigResult,
  DeviceSyncResult,
  GenericRecord,
  syncPatrolDevice,
} from "../api";
import { formatDate, humanize } from "../lib/format";
import { PageContext } from "../types/ui";

type DeviceSyncModalProps = {
  device: GenericRecord;
  context: PageContext;
  onClose: () => void;
  onSuccess: (result: DeviceSyncResult) => void;
};

export function DeviceSyncModal({device, context, onClose, onSuccess}: DeviceSyncModalProps) {
  const [clearDevice, setClearDevice] = useState(true);
  const [error, setError] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  async function handleSync() {
    setIsRunning(true);
    setError("");
    try {
      const result = await syncPatrolDevice(Number(device.id), {clear_device_after_sync: clearDevice}, context.token);
      onSuccess(result);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="crud-drawer-backdrop" onClick={onClose}>
      <aside className="crud-drawer device-action-drawer" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <div className="crud-drawer-header">
          <div>
            <p className="eyebrow">USB sync</p>
            <h2>{String(device.name ?? "Device")}</h2>
          </div>
          <button type="button" className="ghost-button icon-button" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        {error ? <div className="error-banner drawer-banner">{error}</div> : null}
        <div className="crud-drawer-body">
          <p className="device-action-copy">
            Pull stored records from a docked device through the USB adapter. Requires the patrol device adapter
            running with <code>DEVICE_GATEWAY=sdk</code> when using real hardware.
          </p>
          <dl className="device-action-meta">
            <div>
              <dt>Device number</dt>
              <dd>{String(device.device_number ?? "—")}</dd>
            </div>
            <div>
              <dt>Last synced</dt>
              <dd>{device.last_synced_at ? formatDate(String(device.last_synced_at)) : "Never"}</dd>
            </div>
            <div>
              <dt>Connection mode</dt>
              <dd>{humanize(String(device.connection_mode ?? "usb"))}</dd>
            </div>
          </dl>
          <label className="form-field checkbox-field full-span">
            <span className="field-label">Clear device records after import</span>
            <input type="checkbox" checked={clearDevice} onChange={(event) => setClearDevice(event.target.checked)} />
            <span className="field-hint">Recommended when the import succeeds and records are safely stored in Django.</span>
          </label>
        </div>
        <div className="crud-drawer-footer">
          <button type="button" className="ghost-button" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="primary-button" onClick={() => void handleSync()} disabled={isRunning || context.isSubmitting}>
            {isRunning ? "Syncing…" : "Run USB sync"}
          </button>
        </div>
      </aside>
    </div>
  );
}

type DeviceNetworkModalProps = {
  device: GenericRecord;
  context: PageContext;
  onClose: () => void;
  onSuccess: (result: DeviceNetworkConfigResult) => void;
};

function readNetworkDefaults(device: GenericRecord): DeviceNetworkConfigPayload {
  const metadata = (device.sdk_metadata ?? {}) as {
    network_config?: {
      network_mode?: "ip" | "domain";
      ip?: string;
      domain?: string;
      dns?: string;
      port?: number;
    };
    dial_params?: {
      apn?: string;
      userid?: string;
      pin1?: string;
      pin2?: string;
    };
  };
  const network = metadata.network_config ?? {};
  const dial = metadata.dial_params ?? {};
  return {
    network_mode: network.network_mode ?? "ip",
    ip: network.ip ?? "",
    domain: network.domain ?? "",
    dns: network.dns ?? "8.8.8.8",
    port: network.port ?? 8989,
    apn: dial.apn ?? "",
    userid: dial.userid ?? "",
    password: "",
    pin1: dial.pin1 ?? "",
    pin2: dial.pin2 ?? "",
  };
}

export function DeviceNetworkModal({device, context, onClose, onSuccess}: DeviceNetworkModalProps) {
  const defaults = useMemo(() => readNetworkDefaults(device), [device]);
  const [form, setForm] = useState(defaults);
  const [error, setError] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const isDomainMode = form.network_mode === "domain";

  function updateField<K extends keyof DeviceNetworkConfigPayload>(key: K, value: DeviceNetworkConfigPayload[K]) {
    setForm((current) => ({...current, [key]: value}));
  }

  async function handleConfigure() {
    setIsRunning(true);
    setError("");
    try {
      const payload: DeviceNetworkConfigPayload = {
        network_mode: form.network_mode,
        port: Number(form.port),
        apn: form.apn?.trim() || undefined,
        userid: form.userid?.trim() || undefined,
        password: form.password?.trim() || undefined,
        pin1: form.pin1?.trim() || undefined,
        pin2: form.pin2?.trim() || undefined,
      };
      if (isDomainMode) {
        payload.domain = form.domain?.trim();
        payload.dns = form.dns?.trim();
      } else {
        payload.ip = form.ip?.trim();
      }
      const result = await configurePatrolDeviceNetwork(Number(device.id), payload, context.token);
      onSuccess(result);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network configuration failed");
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="crud-drawer-backdrop" onClick={onClose}>
      <aside className="crud-drawer device-action-drawer" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <div className="crud-drawer-header">
          <div>
            <p className="eyebrow">GPRS / TCP push</p>
            <h2>{String(device.name ?? "Device")}</h2>
          </div>
          <button type="button" className="ghost-button icon-button" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        {error ? <div className="error-banner drawer-banner">{error}</div> : null}
        <div className="crud-drawer-body">
          <p className="device-action-copy">
            Configure where this device pushes live patrol packets. Default TCP listener port is <strong>8989</strong>.
            Devices must reach your GPRS listener host over the network configured here.
          </p>
          <div className="form-grid form-grid-two-column">
            <label className="form-field">
              <span className="field-label">Network mode</span>
              <select value={form.network_mode ?? "ip"} onChange={(event) => updateField("network_mode", event.target.value as "ip" | "domain")}>
                <option value="ip">IP address</option>
                <option value="domain">Domain name</option>
              </select>
            </label>
            <label className="form-field">
              <span className="field-label">Port</span>
              <input type="number" min={1} max={65535} value={form.port ?? 8989} onChange={(event) => updateField("port", Number(event.target.value))} />
            </label>
            {isDomainMode ? (
              <>
                <label className="form-field">
                  <span className="field-label">Domain</span>
                  <input type="text" value={form.domain ?? ""} onChange={(event) => updateField("domain", event.target.value)} placeholder="patrol.example.com" />
                </label>
                <label className="form-field">
                  <span className="field-label">DNS</span>
                  <input type="text" value={form.dns ?? ""} onChange={(event) => updateField("dns", event.target.value)} placeholder="8.8.8.8" />
                </label>
              </>
            ) : (
              <label className="form-field full-span">
                <span className="field-label">Server IP</span>
                <input type="text" value={form.ip ?? ""} onChange={(event) => updateField("ip", event.target.value)} placeholder="203.0.113.10" />
              </label>
            )}
          </div>
          <section className="form-section">
            <div className="form-section-header">
              <h3>GPRS dial parameters</h3>
            </div>
            <div className="form-grid form-grid-two-column">
              <label className="form-field">
                <span className="field-label">APN</span>
                <input type="text" value={form.apn ?? ""} onChange={(event) => updateField("apn", event.target.value)} />
              </label>
              <label className="form-field">
                <span className="field-label">User ID</span>
                <input type="text" value={form.userid ?? ""} onChange={(event) => updateField("userid", event.target.value)} />
              </label>
              <label className="form-field">
                <span className="field-label">Password</span>
                <input type="password" value={form.password ?? ""} onChange={(event) => updateField("password", event.target.value)} />
              </label>
              <label className="form-field">
                <span className="field-label">PIN 1</span>
                <input type="text" value={form.pin1 ?? ""} onChange={(event) => updateField("pin1", event.target.value)} />
              </label>
              <label className="form-field">
                <span className="field-label">PIN 2</span>
                <input type="text" value={form.pin2 ?? ""} onChange={(event) => updateField("pin2", event.target.value)} />
              </label>
            </div>
          </section>
        </div>
        <div className="crud-drawer-footer">
          <button type="button" className="ghost-button" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="primary-button" onClick={() => void handleConfigure()} disabled={isRunning || context.isSubmitting}>
            {isRunning ? "Applying…" : "Apply GPRS settings"}
          </button>
        </div>
      </aside>
    </div>
  );
}

export function DeviceIntegrationBanner() {
  return (
    <div className="integration-banner">
      <div>
        <strong>Two device paths</strong>
        <p>
          <span>USB sync</span> pulls stored records when a device is docked (adapter on port 8050).
          <span>GPRS/TCP push</span> delivers live scans while on patrol (listener on port 8989).
        </p>
      </div>
    </div>
  );
}

export function formatDeviceSyncMessage(result: DeviceSyncResult) {
  const imported = result.import.imported_count;
  const duplicates = result.import.duplicate_count;
  if (!result.open_result.success) {
    return `USB sync failed: ${result.open_result.message}`;
  }
  return `USB sync completed — ${imported} imported${duplicates ? `, ${duplicates} duplicate(s)` : ""}.`;
}

export function formatDeviceNetworkMessage(result: DeviceNetworkConfigResult) {
  if (!result.open_result.success) {
    return `GPRS setup failed: ${result.open_result.message}`;
  }
  if (!result.config_result.success) {
    return `GPRS setup failed: ${result.config_result.message}`;
  }
  const imei = result.imei_result?.payload?.imei;
  return imei ? `GPRS settings applied. IMEI read: ${String(imei)}.` : "GPRS settings applied to device.";
}
