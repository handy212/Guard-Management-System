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
    next.recent_scans = [update.scan, ...next.recent_scans.filter((scan) => scan.id !== update.scan!.id)].slice(0, RECENT_SCAN_LIMIT);
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
    } else {
      next.checkpoints.push(update.checkpoint);
    }
  }

  return next;
}

export function mergeLiveSnapshot(
  current: LiveMonitoringSnapshot,
  incoming: LiveMonitoringSnapshot,
): LiveMonitoringSnapshot {
  const guardByDevice = new Map(incoming.guards.map((guard) => [guard.device_id, guard]));
  for (const guard of current.guards) {
    const existing = guardByDevice.get(guard.device_id);
    if (!existing || new Date(guard.last_seen_at).getTime() > new Date(existing.last_seen_at).getTime()) {
      guardByDevice.set(guard.device_id, guard);
    }
  }

  const scanIds = new Set(incoming.recent_scans.map((scan) => scan.id));
  const mergedScans = [
    ...incoming.recent_scans,
    ...current.recent_scans.filter((scan) => !scanIds.has(scan.id)),
  ].slice(0, RECENT_SCAN_LIMIT);

  const checkpointById = new Map(incoming.checkpoints.map((checkpoint) => [checkpoint.id, checkpoint]));
  for (const checkpoint of current.checkpoints) {
    const existing = checkpointById.get(checkpoint.id);
    if (!existing) {
      checkpointById.set(checkpoint.id, checkpoint);
      continue;
    }
    if (checkpoint.recently_scanned && !existing.recently_scanned) {
      checkpointById.set(checkpoint.id, checkpoint);
    }
  }

  return {
    ...incoming,
    guards: Array.from(guardByDevice.values()),
    recent_scans: mergedScans,
    checkpoints: Array.from(checkpointById.values()),
    generated_at:
      new Date(incoming.generated_at).getTime() >= new Date(current.generated_at).getTime()
        ? incoming.generated_at
        : current.generated_at,
  };
}

export { fetchLiveMonitoring, getMonitoringWebSocketUrl, POLL_INTERVAL_DISCONNECTED_MS, POLL_INTERVAL_MS };
export type { LiveCheckpointMarker, LiveGuardPosition, LiveMonitoringSnapshot, LiveMonitoringUpdate, LiveScanEvent };
