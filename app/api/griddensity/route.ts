import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("GridDensity")
    .select(
      "grid_key, min_latitude, max_latitude, min_longtitude, max_longtitude, center_latitude, center_longtitude, event_count, dominant_event, updated_at"
    )
    .order("event_count", { ascending: false });

  if (error) {
    console.error("Grid density query error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to get grid density data",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data,
  });
}
