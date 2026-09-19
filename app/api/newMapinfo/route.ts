import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      longtitude,
      latitude,
      title,
      description,
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

    const { data, error } = await supabase
      .from("MapInfo")
      .insert({
        longtitude: lng,
        latitude: lat,
        title,
        description: description ?? null,
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

    return NextResponse.json(
      {
        success: true,
        message: "Map info created successfully",
        data,
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