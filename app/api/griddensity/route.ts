import { NextResponse } from "next/server";
import { supabase } from "@/component/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("GridDensity")
    .select("id, create_at, latitude, longtitude, radius, even_num")
    .order("even_num", { ascending: false });

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
