import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const NEARBY_RANGE_IN_DEGREES = 0.01;

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
