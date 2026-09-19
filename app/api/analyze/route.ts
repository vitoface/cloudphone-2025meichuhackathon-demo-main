import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { supabase } from "@/lib/supabase";

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

        summary: "目前搜尋範圍內沒有查詢到已知的災害事件。",
      });
    }

    // 4. 把資料交給 Gemini 分析
    const prompt = `
你是一個災害資訊分析助手。

使用者目前的位置：
latitude: ${latitude}
longitude: ${longitude}

搜尋範圍：
${radius} 公尺

系統已經從資料庫取得以下災害資料：

${JSON.stringify(disasters, null, 2)}

請根據這些資料進行統整。

請：
1. 說明這大概是什麼地方
2. 說明附近有哪些災害
3. 說明災害大致分布在哪些方向
4. 哪些災害距離使用者最近
5. 哪些災害可能需要特別注意
6. 提供簡短的安全建議

不要捏造資料庫沒有提供的災害資訊。
如果資料不足，請明確說明資料不足。

請使用繁體中文回答。
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
