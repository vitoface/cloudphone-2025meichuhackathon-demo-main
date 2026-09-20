import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { supabase } from "@/component/supabase";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(request: Request) {
  try {
    // 1. 接收使用者座標與搜尋範圍
    const body = await request.json();

    const latitude = Number(body.latitude);
    const longitude = Number(body.longitude);
    const radius = Number(body.radius);
    const language = body.language || 'zh'; // 接收語言代碼，預設為中文

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      !Number.isFinite(radius) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return NextResponse.json(
        {
          error: "latitude, longitude, and radius must be valid",
        },
        {
          status: 400,
        }
      );
    }

    // 避免有人傳一個超大的 radius
    if (radius <= 0 || radius > 50000) {
      return NextResponse.json(
        {
          error: "radius must be between 1 and 50000 meters",
        },
        {
          status: 400,
        }
      );
    }

    // 2. 從 MapInfo 找出搜尋範圍內的事件
    const metersPerLatitudeDegree = 111_320;
    const latitudeDelta = radius / metersPerLatitudeDegree;
    const longitudeScale = Math.cos((latitude * Math.PI) / 180);
    const longitudeDelta = Math.min(
      180,
      radius / (metersPerLatitudeDegree * Math.max(Math.abs(longitudeScale), 0.000001))
    );

    const { data: disasters, error: dbError } = await supabase
      .from("MapInfo")
      .select(
        "id, created_at, longtitude, latitude, title, description, events"
      )
      .gte("latitude", latitude - latitudeDelta)
      .lte("latitude", latitude + latitudeDelta)
      .gte("longtitude", longitude - longitudeDelta)
      .lte("longtitude", longitude + longitudeDelta);

    if (dbError) {
      console.error("Supabase error:", dbError);

      return NextResponse.json(
        {
          error: "Failed to get disaster data",
        },
        {
          status: 500,
        }
      );
    }

    // 3. 沒有災害的情況可以直接處理
    if (!disasters || disasters.length === 0) {
      return NextResponse.json({
        location: {
          latitude,
          longitude,
        },

        radius,

        disasters: [],

        summary: "",
      });
    }

    // 4. 把資料交給 Gemini 分析 (極簡版 Prompt)
    const prompt = `
    你是一個車載導航的危險預警 AI。
    請根據以下範圍內的災害資料，直接告訴駕駛「需要注意哪種災害」以及「一句避險建議」。

    嚴格規則：
    1. 絕對不要打招呼、不要寫前言、不要使用條列式 (# 或 *)。
    2. 總字數嚴格限制在 40 字以內。
    3. 直接輸出一小段話即可。
    4. 必須使用語言代碼 "${language}" 所對應的語言來輸出你的回答。

    目前的災害統計：
    ${JSON.stringify(disasters.map(d => ({ title: d.title, type: d.events })))}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt,
    });

    // 5. 回傳給前端
    return NextResponse.json({
      location: {
        latitude,
        longitude,
      },

      radius,

      disasterCount: disasters.length,

      disasters,

      summary: response.text,
    });
  } catch (error) {
    console.error("Analyze API error:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
      },
      {
        status: 500,
      }
    );
  }
}
