import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const NEARBY_RANGE_IN_DEGREES = 0.01;
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const NULL_EVENT_LIFETIME_MS = 5 * 60 * 1000;
const CLEANUP_PAGE_SIZE = 1000;
const DELETE_BATCH_SIZE = 100;

const EVENT_LIFETIME_MS = {
  car_crash: 60 * 60 * 1000,
  traffic_jam: 30 * 60 * 1000,
  roadwork: 24 * 60 * 60 * 1000,
  unknown_danger: 60 * 60 * 1000,
  natural_disaster: 24 * 60 * 60 * 1000,
} as const;

type MapEvent = keyof typeof EVENT_LIFETIME_MS;

interface MapInfoCleanupRecord {
  id: string | number;
  created_at: string;
  events: string | null;
}

let lastRefreshAt = Date.now();
let refreshInProgress: Promise<void> | null = null;

function isMapEvent(event: string): event is MapEvent {
  return event in EVENT_LIFETIME_MS;
}

async function removeExpiredMapInfo() {
  const records: MapInfoCleanupRecord[] = [];

  for (let start = 0; ; start += CLEANUP_PAGE_SIZE) {
    const { data, error } = await supabase
      .from("MapInfo")
      .select("id, created_at, events")
      .order("id", { ascending: true })
      .range(start, start + CLEANUP_PAGE_SIZE - 1);

    if (error) {
      throw new Error(`Unable to enumerate MapInfo records: ${error.message}`);
    }

    records.push(...(data as MapInfoCleanupRecord[]));

    if (data.length < CLEANUP_PAGE_SIZE) {
      break;
    }
  }

  const now = Date.now();
  const expiredIds = records.flatMap((record) => {
    if (record.events !== null && !isMapEvent(record.events)) {
      return [];
    }

    const createdAt = Date.parse(record.created_at);
    const lifetime = record.events === null
      ? NULL_EVENT_LIFETIME_MS
      : EVENT_LIFETIME_MS[record.events];
    const timeDifference = now - createdAt;

    if (!Number.isFinite(createdAt) || timeDifference <= lifetime) {
      return [];
    }

    return [record.id];
  });

  for (let start = 0; start < expiredIds.length; start += DELETE_BATCH_SIZE) {
    const ids = expiredIds.slice(start, start + DELETE_BATCH_SIZE);
    const { error } = await supabase.from("MapInfo").delete().in("id", ids);

    if (error) {
      throw new Error(`Unable to delete expired MapInfo records: ${error.message}`);
    }
  }
}

async function refreshExpiredMapInfoIfNeeded() {
  if (Date.now() - lastRefreshAt < REFRESH_INTERVAL_MS) {
    return;
  }

  if (!refreshInProgress) {
    refreshInProgress = removeExpiredMapInfo()
      .then(() => {
        lastRefreshAt = Date.now();
      })
      .finally(() => {
        refreshInProgress = null;
      });
  }

  await refreshInProgress;
}

function parseCoordinate(
  value: string | null,
  minimum: number,
  maximum: number
) {
  if (value === null || value.trim() === "") {
    return value === null ? undefined : null;
  }

  const coordinate = Number(value);

  if (!Number.isFinite(coordinate) || coordinate < minimum || coordinate > maximum) {
    return null;
  }

  return coordinate;
}

export async function GET(request: Request) {
  try {
    await refreshExpiredMapInfoIfNeeded();
  } catch (error) {
    console.error("MapInfo refresh error:", error);
  }

  const searchParams = new URL(request.url).searchParams;
  const longtitude = parseCoordinate(
    searchParams.get("longtitude"),
    -180,
    180
  );
  const latitude = parseCoordinate(searchParams.get("latitude"), -90, 90);

  let query = supabase
    .from("MapInfo")
    .select("*");

  const hasInvalidCoordinate = longtitude === null || latitude === null;

  if (!hasInvalidCoordinate) {
    if (longtitude !== undefined) {
      query = query
        .gte("longtitude", longtitude - NEARBY_RANGE_IN_DEGREES)
        .lte("longtitude", longtitude + NEARBY_RANGE_IN_DEGREES);
    }

    if (latitude !== undefined) {
      query = query
        .gte("latitude", latitude - NEARBY_RANGE_IN_DEGREES)
        .lte("latitude", latitude + NEARBY_RANGE_IN_DEGREES);
    }
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
