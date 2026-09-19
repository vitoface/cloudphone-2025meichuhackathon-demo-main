import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { scheduleGridDensityRefresh } from "@/lib/grid-density";

const MAP_EVENTS = [
  "car_crash",
  "traffic_jam",
  "roadwork",
  "unknown_danger",
  "natural_disaster",
] as const;

type MapEvent = (typeof MAP_EVENTS)[number];

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      longtitude,
      latitude,
      title,
      description,
      events,
    } = body;

    // 基本資料檢查
    if (
      longtitude === undefined ||
      latitude === undefined ||
      !title
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "longtitude, latitude and title are required",
        },
        { status: 400 }
      );
    }

    // 經緯度轉成 number
    const lng = Number(longtitude);
    const lat = Number(latitude);

    if (Number.isNaN(lng) || Number.isNaN(lat)) {
      return NextResponse.json(
        {
          success: false,
          error: "longtitude and latitude must be numbers",
        },
        { status: 400 }
      );
    }

    // 經緯度範圍檢查
    if (lng < -180 || lng > 180) {
      return NextResponse.json(
        {
          success: false,
          error: "longtitude must be between -180 and 180",
        },
        { status: 400 }
      );
    }

    if (lat < -90 || lat > 90) {
      return NextResponse.json(
        {
          success: false,
          error: "latitude must be between -90 and 90",
        },
        { status: 400 }
      );
    }

    if (
      events !== undefined &&
      events !== null &&
      !MAP_EVENTS.includes(events as MapEvent)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `events must be one of: ${MAP_EVENTS.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("MapInfo")
      .insert({
        longtitude: lng,
        latitude: lat,
        title,
        description: description ?? null,
        events: events ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    // scheduleGridDensityRefresh();

    // const { error: error_his } = await supabase
    //   .from("MapInfo_history")
    //   .insert({
    //     longtitude: lng,
    //     latitude: lat,
    //     title,
    //     description: description ?? null,
    //     events: events ?? null,
    //   })
    //   .select()
    //   .single();

    // if (error_his) {
    //   console.error("Supabase insert error:", error_his);

    //   return NextResponse.json(
    //     {
    //       success: false,
    //       error: error_his.message,
    //     },
    //     { status: 500 }
    //   );
    // }

    return NextResponse.json(
      {
        success: true,
        message: "Map info created successfully",
        data
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Invalid request",
      },
      { status: 500 }
    );
  }
}
