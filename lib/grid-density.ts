import { supabase } from "@/lib/supabase";

const GRID_SIZE_IN_DEGREES = 0.01;
const MINIMUM_EVENTS_PER_GRID = 3;
const REFRESH_DELAY_MS = 60 * 1000;
const PAGE_SIZE = 1000;

type MapEvent =
  | "car_crash"
  | "traffic_jam"
  | "roadwork"
  | "unknown_danger"
  | "natural_disaster";

interface MapInfoDensityRecord {
  latitude: number;
  longtitude: number;
  events: MapEvent | null;
}

interface GridAccumulator {
  latitudeIndex: number;
  longtitudeIndex: number;
  latitudeTotal: number;
  longtitudeTotal: number;
  eventCount: number;
  eventCounts: Partial<Record<MapEvent, number>>;
}

let refreshTimer: ReturnType<typeof setTimeout> | null = null;

async function readAllMapInfo() {
  const records: MapInfoDensityRecord[] = [];

  for (let start = 0; ; start += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("MapInfo")
      .select("latitude, longtitude, events")
      .order("id", { ascending: true })
      .range(start, start + PAGE_SIZE - 1);

    if (error) {
      throw new Error(`Unable to read MapInfo for grid density: ${error.message}`);
    }

    records.push(...(data as MapInfoDensityRecord[]));

    if (data.length < PAGE_SIZE) {
      return records;
    }
  }
}

function findDominantEvent(eventCounts: GridAccumulator["eventCounts"]) {
  let dominantEvent: MapEvent | null = null;
  let dominantCount = 0;

  for (const [event, count] of Object.entries(eventCounts)) {
    if (count > dominantCount) {
      dominantEvent = event as MapEvent;
      dominantCount = count;
    }
  }

  return dominantEvent;
}

export async function refreshGridDensity() {
  const mapInfo = await readAllMapInfo();
  const grids = new Map<string, GridAccumulator>();

  for (const record of mapInfo) {
    const latitude = Number(record.latitude);
    const longtitude = Number(record.longtitude);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longtitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longtitude < -180 ||
      longtitude > 180
    ) {
      continue;
    }

    const latitudeIndex = Math.floor((latitude + 90) / GRID_SIZE_IN_DEGREES);
    const longtitudeIndex = Math.floor((longtitude + 180) / GRID_SIZE_IN_DEGREES);
    const gridKey = `${latitudeIndex}:${longtitudeIndex}`;
    const grid = grids.get(gridKey) ?? {
      latitudeIndex,
      longtitudeIndex,
      latitudeTotal: 0,
      longtitudeTotal: 0,
      eventCount: 0,
      eventCounts: {},
    };

    grid.latitudeTotal += latitude;
    grid.longtitudeTotal += longtitude;
    grid.eventCount += 1;

    if (record.events) {
      grid.eventCounts[record.events] = (grid.eventCounts[record.events] ?? 0) + 1;
    }

    grids.set(gridKey, grid);
  }

  const refreshToken = crypto.randomUUID();
  const updatedAt = new Date().toISOString();
  const densityRows = Array.from(grids.entries())
    .filter(([, grid]) => grid.eventCount >= MINIMUM_EVENTS_PER_GRID)
    .map(([gridKey, grid]) => {
      const minLatitude = grid.latitudeIndex * GRID_SIZE_IN_DEGREES - 90;
      const minLongtitude = grid.longtitudeIndex * GRID_SIZE_IN_DEGREES - 180;

      return {
        grid_key: gridKey,
        min_latitude: minLatitude,
        max_latitude: minLatitude + GRID_SIZE_IN_DEGREES,
        min_longtitude: minLongtitude,
        max_longtitude: minLongtitude + GRID_SIZE_IN_DEGREES,
        center_latitude: grid.latitudeTotal / grid.eventCount,
        center_longtitude: grid.longtitudeTotal / grid.eventCount,
        event_count: grid.eventCount,
        dominant_event: findDominantEvent(grid.eventCounts),
        updated_at: updatedAt,
        refresh_token: refreshToken,
      };
    });

  if (densityRows.length > 0) {
    const { error } = await supabase
      .from("GridDensity")
      .upsert(densityRows, { onConflict: "grid_key" });

    if (error) {
      throw new Error(`Unable to update grid density: ${error.message}`);
    }

    const { error: cleanupError } = await supabase
      .from("GridDensity")
      .delete()
      .neq("refresh_token", refreshToken);

    if (cleanupError) {
      throw new Error(`Unable to remove stale grid density: ${cleanupError.message}`);
    }
  } else {
    const { error } = await supabase
      .from("GridDensity")
      .delete()
      .gte("event_count", 0);

    if (error) {
      throw new Error(`Unable to clear grid density: ${error.message}`);
    }
  }
}

export function scheduleGridDensityRefresh() {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
  }

  refreshTimer = setTimeout(() => {
    refreshTimer = null;
    void refreshGridDensity().catch((error) => {
      console.error("Grid density refresh error:", error);
    });
  }, REFRESH_DELAY_MS);
}
