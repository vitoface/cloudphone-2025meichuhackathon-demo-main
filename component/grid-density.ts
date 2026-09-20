import { supabase } from "@/component/supabase";

const GRID_SIZE_IN_DEGREES = 0.01;
const MINIMUM_EVENTS_PER_GRID = 3;
const REFRESH_DELAY_MS = 60 * 1000;
const PAGE_SIZE = 1000;
const METERS_PER_LATITUDE_DEGREE = 111_320;
const DEBUG = true;

interface MapInfoDensityRecord {
  latitude: number;
  longtitude: number;
}

interface GridAccumulator {
  latitudeIndex: number;
  longtitudeIndex: number;
  eventCount: number;
}

let refreshTimer: ReturnType<typeof setTimeout> | null = null;

async function readAllMapInfo() {
  const records: MapInfoDensityRecord[] = [];

  for (let start = 0; ; start += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("MapInfo")
      .select("latitude, longtitude")
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
      eventCount: 0,
    };

    grid.eventCount += 1;

    grids.set(gridKey, grid);
  }

  const densityRows = Array.from(grids.entries())
    .filter(([, grid]) => grid.eventCount >= MINIMUM_EVENTS_PER_GRID)
    .map(([, grid]) => {
      const minLatitude = grid.latitudeIndex * GRID_SIZE_IN_DEGREES - 90;
      const minLongtitude = grid.longtitudeIndex * GRID_SIZE_IN_DEGREES - 180;
      const latitude = minLatitude + GRID_SIZE_IN_DEGREES / 2;
      const longtitude = minLongtitude + GRID_SIZE_IN_DEGREES / 2;
      const latitudeRadius = (GRID_SIZE_IN_DEGREES / 2) * METERS_PER_LATITUDE_DEGREE;
      const longtitudeRadius = latitudeRadius * Math.cos((latitude * Math.PI) / 180);
      const radius = Math.ceil(Math.hypot(latitudeRadius, longtitudeRadius));

      return {
        latitude,
        longtitude,
        radius,
        events_num: grid.eventCount,
      };
    });

  const { error: cleanupError } = await supabase
    .from("GridDensity")
    .delete()
    .gte("events_num", 0);

  if (cleanupError) {
    throw new Error(`Unable to clear grid density: ${cleanupError.message}`);
  }

  if (densityRows.length === 0) {
    return;
  }

  const { error } = await supabase
    .from("GridDensity")
    .insert(densityRows);

  if (error) {
    throw new Error(`Unable to insert grid density: ${error.message}`);
  }
}

export function scheduleGridDensityRefresh() {
  console.log("yo whats up")
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
