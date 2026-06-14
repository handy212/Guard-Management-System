import {
  fetchLiveMonitoring,
  LiveCheckpointMarker,
  LiveGuardPosition,
  LiveMonitoringSnapshot,
  LiveMonitoringUpdate,
  LiveScanEvent,
} from "../api";
import { getMonitoringWebSocketUrl } from "@guard/shared";

const POLL_INTERVAL_MS = 60_000;
const POLL_INTERVAL_DISCONNECTED_MS = 15_000;
const RECENT_SCAN_LIMIT = 30;

export function applyLiveUpdate(
  snapshot: LiveMonitoringSnapshot,
  update: LiveMonitoringUpdate,
): LiveMonitoringSnapshot {
  const next: LiveMonitoringSnapshot = {
    ...snapshot,
    generated_at: update.generated_at,
    recent_scans: [...snapshot.recent_scans],
    guards: [...snapshot.guards],
    checkpoints: [...snapshot.checkpoints],
  };

  if (update.scan) {
    next.recent_scans = [update.scan, ...next.recent_scans.filter((scan) => scan.id !== update.scan.id)].slice(0, RECENT_SCAN_LIMIT);
  }

  if (update.guard) {
    const index = next.guards.findIndex((guard) => guard.device_id === update.guard!.device_id);
    if (index >= 0) {
      next.guards[index] = update.guard;
    } else {
      next.guards.unshift(update.guard);
    }
  }

  if (update.checkpoint) {
    const index = next.checkpoints.findIndex((checkpoint) => checkpoint.id === update.checkpoint!.id);
    if (index >= 0) {
      next.checkpoints[index] = update.checkpoint;
    }
  }

  return next;
}

export function mergeLiveSnapshot(
  current: LiveMonitoringSnapshot | null,
  incoming: LiveMonitoringSnapshot,
): LiveMonitoringSnapshot {
  if (!current) {
    return incoming;
  }
  return incoming;
}

export { fetchLiveMonitoring, getMonitoringWebSocketUrl, POLL_INTERVAL_DISCONNECTED_MS, POLL_INTERVAL_MS };
export type { LiveCheckpointMarker, LiveGuardPosition, LiveMonitoringSnapshot, LiveMonitoringUpdate, LiveScanEvent };
