import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  applyLiveUpdate,
  fetchLiveMonitoring,
  getMonitoringWebSocketUrl,
  LiveMonitoringSnapshot,
  LiveMonitoringUpdate,
  POLL_INTERVAL_DISCONNECTED_MS,
  POLL_INTERVAL_MS,
} from "../lib/live-monitoring";
import { formatDate, humanize } from "../lib/format";
import { PageContext } from "../types/ui";
import { EmptyState, Panel, StatusBadge } from "./ui";

const DEFAULT_CENTER: L.LatLngExpression = [5.6037, -0.187];

type LiveMonitoringPanelProps = {
  context: PageContext;
};

type ConnectionState = "connecting" | "live" | "polling" | "offline";

function parseCoord(value: string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function LiveMonitoringPanel({context}: LiveMonitoringPanelProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const [snapshot, setSnapshot] = useState<LiveMonitoringSnapshot | null>(null);
  const [siteId, setSiteId] = useState<string>("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [highlightScanId, setHighlightScanId] = useState<number | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");

  const siteOptions = useMemo(
    () => (context.setupData?.sites ?? []).map((site) => ({value: String(site.id), label: site.name ?? site.code ?? `Site ${site.id}`})),
    [context.setupData?.sites],
  );

  const loadLiveData = useCallback(async (showSpinner = false) => {
    if (!context.token) {
      return;
    }
    if (showSpinner) {
      setIsLoading(true);
    }
    try {
      const next = await fetchLiveMonitoring(context.token, siteId ? Number(siteId) : null);
      setSnapshot(next);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Live monitoring refresh failed");
      setConnectionState("offline");
    } finally {
      setIsLoading(false);
    }
  }, [context.token, siteId]);

  const handleLiveUpdate = useCallback((update: LiveMonitoringUpdate) => {
    setSnapshot((current) => {
      if (!current) {
        return current;
      }
      return applyLiveUpdate(current, update);
    });
    if (update.scan?.id) {
      setHighlightScanId(update.scan.id);
      window.setTimeout(() => setHighlightScanId(null), 4000);
    }
  }, []);

  useEffect(() => {
    void loadLiveData(true);
  }, [loadLiveData]);

  useEffect(() => {
    const pollMs = connectionState === "live" ? POLL_INTERVAL_MS : POLL_INTERVAL_DISCONNECTED_MS;
    const timer = window.setInterval(() => {
      void loadLiveData(false);
    }, pollMs);
    return () => window.clearInterval(timer);
  }, [connectionState, loadLiveData]);

  useEffect(() => {
    if (!context.token) {
      return;
    }

    let cancelled = false;

    function scheduleReconnect(delayMs: number) {
      if (cancelled) {
        return;
      }
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
      }
      reconnectTimerRef.current = window.setTimeout(() => {
        connect();
      }, delayMs);
    }

    function connect() {
      if (cancelled) {
        return;
      }
      setConnectionState((current) => (current === "offline" ? "polling" : "connecting"));
      const socket = new WebSocket(getMonitoringWebSocketUrl(context.token, siteId ? Number(siteId) : null));
      socketRef.current = socket;

      socket.onopen = () => {
        if (cancelled) {
          socket.close();
          return;
        }
        setConnectionState("live");
        setError("");
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(String(event.data)) as LiveMonitoringUpdate | {type: "connected"};
          if (payload.type === "live_update") {
            handleLiveUpdate(payload);
          }
        } catch {
          // Ignore malformed websocket payloads.
        }
      };

      socket.onclose = () => {
        if (cancelled) {
          return;
        }
        socketRef.current = null;
        setConnectionState("polling");
        scheduleReconnect(3000);
      };

      socket.onerror = () => {
        socket.close();
      };
    }

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
      }
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [context.token, siteId, handleLiveUpdate]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }
    const map = L.map(mapContainerRef.current, {zoomControl: true}).setView(DEFAULT_CENTER, 15);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer || !snapshot) {
      return;
    }

    layer.clearLayers();
    const bounds: L.LatLngExpression[] = [];

    for (const checkpoint of snapshot.checkpoints) {
      const lat = parseCoord(checkpoint.latitude);
      const lng = parseCoord(checkpoint.longitude);
      if (lat === null || lng === null) {
        continue;
      }
      bounds.push([lat, lng]);
      const marker = L.circleMarker([lat, lng], {
        radius: checkpoint.recently_scanned ? 9 : 7,
        color: checkpoint.recently_scanned ? "#15803d" : "#64748b",
        fillColor: checkpoint.recently_scanned ? "#22c55e" : "#94a3b8",
        fillOpacity: 0.85,
        weight: 2,
      });
      marker.bindPopup(`<strong>${checkpoint.name}</strong><br/>${checkpoint.code}${checkpoint.recently_scanned ? "<br/><em>Recently scanned</em>" : ""}`);
      marker.addTo(layer);
    }

    for (const guard of snapshot.guards) {
      const lat = parseCoord(guard.latitude);
      const lng = parseCoord(guard.longitude);
      if (lat === null || lng === null) {
        continue;
      }
      bounds.push([lat, lng]);
      const marker = L.circleMarker([lat, lng], {
        radius: 10,
        color: guard.is_stale ? "#c2410c" : "#1d4ed8",
        fillColor: guard.is_stale ? "#fb923c" : "#3b82f6",
        fillOpacity: 0.9,
        weight: 3,
      });
      marker.bindPopup(
        `<strong>${guard.guard_name || "Unknown guard"}</strong><br/>${guard.device_name}<br/>Last seen ${formatDate(guard.last_seen_at)}${
          guard.last_checkpoint_name ? `<br/>Last scan: ${guard.last_checkpoint_name}` : ""
        }`,
      );
      marker.addTo(layer);
    }

    if (bounds.length === 1) {
      map.setView(bounds[0], 16);
    } else if (bounds.length > 1) {
      map.fitBounds(L.latLngBounds(bounds), {padding: [28, 28], maxZoom: 17});
    } else {
      map.setView(DEFAULT_CENTER, 14);
    }
  }, [snapshot]);

  const onlineGuards = snapshot?.guards.filter((guard) => !guard.is_stale).length ?? 0;
  const staleGuards = snapshot?.guards.filter((guard) => guard.is_stale).length ?? 0;
  const positionedGuards = snapshot?.guards.filter((guard) => guard.latitude && guard.longitude).length ?? 0;

  const connectionLabel =
    connectionState === "live"
      ? "Live stream"
      : connectionState === "connecting"
        ? "Connecting…"
        : connectionState === "polling"
          ? "Polling fallback"
          : "Offline";

  return (
    <div className="page-stack live-monitoring-stack">
      <div className="live-monitoring-toolbar">
        <label className="form-field live-site-filter">
          <span className="field-label">Site</span>
          <select value={siteId} onChange={(event) => setSiteId(event.target.value)}>
            <option value="">All sites</option>
            {siteOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className="live-monitoring-meta">
          <span className={`live-connection-pill live-connection-${connectionState}`}>{connectionLabel}</span>
          {snapshot ? <span>Updated {formatDate(snapshot.generated_at)}</span> : null}
          <span>{positionedGuards} on map</span>
          <span>{onlineGuards} online</span>
          {staleGuards ? <span className="live-stale-count">{staleGuards} stale</span> : null}
        </div>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}

      <section className="live-monitoring-grid">
        <Panel title="Live map" compact>
          <div className="live-map-legend">
            <span><i className="live-dot live-dot-guard" /> Guard GPS</span>
            <span><i className="live-dot live-dot-stale" /> Stale signal</span>
            <span><i className="live-dot live-dot-checkpoint" /> Checkpoint</span>
            <span><i className="live-dot live-dot-scanned" /> Recent scan</span>
          </div>
          <div ref={mapContainerRef} className="live-map-canvas" aria-label="Live patrol map" />
          {!positionedGuards && !isLoading ? (
            <p className="live-map-empty">No GPS positions yet. Live coordinates appear when devices push GPSTrail, GPSPosition, or GPSCheckPoint records.</p>
          ) : null}
        </Panel>

        <Panel title="Live activity" compact>
          {isLoading && !snapshot ? <EmptyState message="Loading live patrol feed…" compact /> : null}
          {!isLoading && snapshot && snapshot.recent_scans.length === 0 ? (
            <EmptyState message="No recent checkpoint scans." compact />
          ) : null}
          <div className="live-activity-feed">
            {(snapshot?.recent_scans ?? []).map((scan) => (
              <article key={scan.id} className={`live-activity-item ${highlightScanId === scan.id ? "live-activity-item-new" : ""}`}>
                <div>
                  <strong>{scan.guard_name || "Unknown guard"}</strong>
                  <div className="table-subtle">
                    {scan.checkpoint_name || scan.checkpoint_code || "Checkpoint"} · {scan.device_number}
                  </div>
                </div>
                <div className="live-activity-meta">
                  <StatusBadge value={scan.source} />
                  <time>{formatDate(scan.occurred_at)}</time>
                  {scan.record_type ? <span className="table-subtle">{humanize(scan.record_type)}</span> : null}
                </div>
              </article>
            ))}
          </div>
        </Panel>
      </section>
    </div>
  );
}
